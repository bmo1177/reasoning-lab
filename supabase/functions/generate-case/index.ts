import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateCaseRequest {
  specialty: string;
  difficulty: string;
  biasType?: string;
}

const systemPrompt = `You are an expert medical educator creating clinical cases for medical students.
Generate a realistic, educational clinical case that teaches diagnostic reasoning.

The case should be structured with the following JSON format:
{
  "id": "ai-case-<timestamp>",
  "title": "Brief descriptive title",
  "specialty": "<specialty>",
  "difficulty": "<difficulty>",
  "estimatedMinutes": <15-30>,
  "description": "1-2 sentence overview of what the case teaches",
  "patient": {
    "age": <number>,
    "sex": "male" | "female",
    "chiefComplaint": "Patient's presenting complaint"
  },
  "presentation": "Detailed initial presentation (2-3 paragraphs)",
  "history": "Past medical history, medications, family and social history",
  "physicalExam": "Physical examination findings",
  "vitalSigns": {
    "bloodPressure": "systolic/diastolic",
    "heartRate": <bpm>,
    "respiratoryRate": <per minute>,
    "temperature": <celsius>,
    "oxygenSaturation": <percent>
  },
  "availableTests": [
    {
      "id": "unique-id",
      "name": "Test name",
      "category": "lab" | "imaging" | "procedure",
      "result": "Actual result values",
      "interpretation": "What this means"
    }
  ],
  "learningObjectives": ["What students should learn"],
  "potentialBiases": ["cognitive biases this case might trigger"],
  "expertReasoningMap": {
    "nodes": [
      {
        "id": "node-1",
        "type": "symptom" | "finding" | "diagnosis" | "test",
        "label": "Short label",
        "description": "Why this is relevant",
        "position": { "x": <number>, "y": <number> }
      }
    ],
    "connections": [
      {
        "id": "conn-1",
        "sourceId": "node-1",
        "targetId": "node-2",
        "type": "supports-strong" | "supports-weak" | "contradicts" | "neutral",
        "label": "Brief explanation"
      }
    ],
    "notes": []
  }
}

Make the case medically accurate and realistic. Include 4-6 diagnostic tests.
The expert reasoning map should have 8-12 nodes showing ideal clinical reasoning flow,
with 10-15 connections showing relationships.
Position nodes in a logical layout (symptoms on left, diagnoses on right).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { specialty, difficulty, biasType } = (await req.json()) as GenerateCaseRequest;
    console.log(`Generating case: specialty=${specialty}, difficulty=${difficulty}, biasType=${biasType}`);

    let userPrompt = `Generate a ${difficulty} level clinical case in ${specialty}.`;
    if (biasType) {
      userPrompt += ` Design the case to potentially trigger ${biasType} in the learner.`;
    }
    userPrompt += ` Return ONLY valid JSON, no markdown or explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
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

    // Parse the JSON from the response
    let caseData;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      caseData = JSON.parse(cleanContent);
      
      // Add timestamp-based ID if not present
      if (!caseData.id || caseData.id.includes("<timestamp>")) {
        caseData.id = `ai-case-${Date.now()}`;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse case data from AI response");
    }

    console.log("Generated case:", caseData.id, caseData.title);

    return new Response(JSON.stringify(caseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate case error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
