import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateErrorCaseRequest {
  specialty: string;
  difficulty: string;
  targetBiases?: string[];
}

const systemPrompt = `You are an expert medical educator creating error-based learning scenarios for medical students.
Generate a realistic clinical error case that teaches diagnostic reasoning by showing what went wrong.

The case should be structured with the following JSON format:
{
  "id": "error-ai-<timestamp>",
  "title": "Short descriptive title",
  "specialty": "<specialty>",
  "difficulty": "<difficulty>",
  "estimatedMinutes": <15-30>,
  
  "scenario": {
    "patientAge": <number>,
    "patientSex": "male" | "female",
    "presentation": "Detailed patient presentation (2-3 paragraphs)",
    "initialWorkup": "What the clinician did initially",
    "clinicianThinking": "The flawed reasoning process"
  },
  
  "error": {
    "initialDiagnosis": "What was diagnosed incorrectly",
    "missedDiagnosis": "What should have been diagnosed",
    "outcome": "What happened as a result (be realistic, not always catastrophic)",
    "errorSummary": "One sentence summary of the core error"
  },
  
  "analysis": {
    "cognitiveBiases": ["anchoring-bias", "premature-closure", ...],
    "biasExplanations": {
      "anchoring-bias": "How this bias manifested in this case",
      ...
    },
    "missedRedFlags": [
      {
        "id": "rf-1",
        "description": "Red flag that was missed",
        "significance": "critical" | "important" | "minor",
        "hint": "Optional hint for students"
      }
    ],
    "missedQuestions": [
      {
        "id": "mq-1",
        "question": "Question that should have been asked",
        "importance": "Why this question matters",
        "expectedAnswer": "What the answer would have revealed"
      }
    ],
    "flawedReasoningSteps": [
      {
        "nodeId": "step-1",
        "description": "The reasoning step that was flawed",
        "whatWentWrong": "Explanation of the flaw",
        "correctApproach": "What should have been done"
      }
    ]
  },
  
  "correctApproach": {
    "keyDifferentials": ["List of diagnoses that should have been considered"],
    "criticalTests": ["Tests that should have been ordered"],
    "reasoningPath": "Step-by-step correct reasoning"
  },
  
  "reflectionPrompts": [
    "Thoughtful questions for student reflection (4-5 prompts)"
  ]
}

Valid cognitive biases to include:
- anchoring-bias: Fixating on initial information
- availability-heuristic: Overweighting recent or memorable cases
- confirmation-bias: Seeking info that confirms initial hypothesis
- premature-closure: Stopping investigation too early
- diagnosis-momentum: Accepting previous diagnosis without questioning
- gender-bias: Different treatment based on gender
- age-bias: Different treatment based on age
- overconfidence: Being too certain in diagnosis
- representativeness-heuristic: Expecting "typical" presentations
- base-rate-neglect: Ignoring prevalence in population

Make the case medically accurate and educational. Include 2-4 cognitive biases, 3-5 missed red flags, 3-4 missed questions, and 2-3 flawed reasoning steps.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { specialty, difficulty, targetBiases } = (await req.json()) as GenerateErrorCaseRequest;
    console.log(`Generating error case: specialty=${specialty}, difficulty=${difficulty}, biases=${targetBiases?.join(', ')}`);

    let userPrompt = `Generate a ${difficulty} level error-based learning case in ${specialty}.`;
    if (targetBiases && targetBiases.length > 0) {
      userPrompt += ` Design the case to specifically demonstrate these cognitive biases: ${targetBiases.join(', ')}.`;
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
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      caseData = JSON.parse(cleanContent);
      
      if (!caseData.id || caseData.id.includes("<timestamp>")) {
        caseData.id = `error-ai-${Date.now()}`;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse error case data from AI response");
    }

    console.log("Generated error case:", caseData.id, caseData.title);

    return new Response(JSON.stringify(caseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate error case error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
