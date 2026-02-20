import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ======================
// Types
// ======================

interface EcaChatRequest {
    /** Learner's message */
    message: string;
    /** Conversation history (last 10 turns max) */
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
    /** Simulation context */
    context: {
        caseTitle: string;
        specialty: string;
        currentStage: string;
        patientStatus: string;
        vitalSigns: {
            bloodPressure: string;
            heartRate: number;
            respiratoryRate: number;
            temperature: number;
            oxygenSaturation: number;
        };
        recentDecisions: string[];
        errorsDetected: string[];
        hintLevel: number;
        decisionsCount: number;
        timeElapsed: number;
    };
    /** Session ID for rate limiting */
    sessionId: string;
}

// ======================
// Rate limiting (in-memory, per-session)
// ======================

const sessionCallCounts = new Map<string, { count: number; windowStart: number }>();
const MAX_CALLS_PER_SESSION = 10;
const MAX_CALLS_PER_HOUR = 50;
const HOUR_MS = 60 * 60 * 1000;

function checkRateLimit(sessionId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const entry = sessionCallCounts.get(sessionId);

    if (!entry) {
        sessionCallCounts.set(sessionId, { count: 1, windowStart: now });
        return { allowed: true };
    }

    // Reset window if over an hour
    if (now - entry.windowStart > HOUR_MS) {
        sessionCallCounts.set(sessionId, { count: 1, windowStart: now });
        return { allowed: true };
    }

    if (entry.count >= MAX_CALLS_PER_SESSION) {
        return { allowed: false, reason: "Session limit reached (10 calls per session)" };
    }

    if (entry.count >= MAX_CALLS_PER_HOUR) {
        return { allowed: false, reason: "Hourly limit reached (50 calls per hour)" };
    }

    entry.count++;
    return { allowed: true };
}

// ======================
// System prompt
// ======================

function buildSystemPrompt(context: EcaChatRequest["context"]): string {
    return `You are a clinical reasoning tutor embedded in a medical simulation. Your name is "Clinical Tutor."

CASE CONTEXT:
- Case: ${context.caseTitle} (${context.specialty})
- Current Stage: ${context.currentStage}
- Patient Status: ${context.patientStatus}
- Vital Signs: BP ${context.vitalSigns.bloodPressure}, HR ${context.vitalSigns.heartRate}, RR ${context.vitalSigns.respiratoryRate}, Temp ${context.vitalSigns.temperature}°C, SpO₂ ${context.vitalSigns.oxygenSaturation}%
- Recent Decisions: ${context.recentDecisions.join(", ") || "None yet"}
- Errors Detected: ${context.errorsDetected.join(", ") || "None"}
- Hint Level: ${context.hintLevel}/3
- Decisions Made: ${context.decisionsCount}
- Time Elapsed: ${Math.round(context.timeElapsed / 60)} minutes

RULES:
1. Use Socratic questioning — guide, don't give answers directly.
2. If the learner is struggling (hint level ≥ 2), be more directive.
3. If hint level = 3, provide more explicit guidance but still encourage reasoning.
4. Reference specific clinical findings from the patient data.
5. Keep responses concise (2-3 sentences). Use **bold** for key terms.
6. Never diagnose for the student — help them reason toward it.
7. If asked unrelated questions, redirect to the clinical case.

RESPONSE FORMAT:
Return a JSON object:
{
  "response": "Your tutoring message",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "confidence": 0.0-1.0
}`;
}

// ======================
// Handler
// ======================

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        const requestData = (await req.json()) as EcaChatRequest;

        // Validate required fields
        if (!requestData.message || !requestData.context || !requestData.sessionId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: message, context, sessionId" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Rate limit check
        const rateLimitResult = checkRateLimit(requestData.sessionId);
        if (!rateLimitResult.allowed) {
            return new Response(
                JSON.stringify({
                    error: rateLimitResult.reason,
                    fallback: true,
                }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(
            `ECA chat: session=${requestData.sessionId}, stage=${requestData.context.currentStage}, ` +
            `decisions=${requestData.context.decisionsCount}`
        );

        // Build conversation with system prompt + history + new message
        const systemPrompt = buildSystemPrompt(requestData.context);

        // Limit history to last 10 turns to stay within token limits
        const recentHistory = requestData.conversationHistory.slice(-10);

        const messages = [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: requestData.message },
        ];

        // Call AI gateway
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages,
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI gateway error:", response.status, errorText);

            if (response.status === 429) {
                return new Response(
                    JSON.stringify({ error: "AI rate limit exceeded. Please try again later.", fallback: true }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            if (response.status === 402) {
                return new Response(
                    JSON.stringify({ error: "AI usage limit reached.", fallback: true }),
                    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content in AI response");
        }

        // Parse structured response
        let ecaResponse;
        try {
            const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            ecaResponse = JSON.parse(cleanContent);
        } catch {
            // If not valid JSON, use raw text
            ecaResponse = {
                response: content,
                suggestions: [],
                confidence: 0.7,
            };
        }

        console.log("ECA response generated, confidence:", ecaResponse.confidence);

        return new Response(JSON.stringify(ecaResponse), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("ECA chat error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: errorMessage, fallback: true }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
