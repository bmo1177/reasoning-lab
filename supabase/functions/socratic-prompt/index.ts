import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SocraticPromptRequest {
  caseContext: {
    specialty: string;
    presentation: string;
    currentDiagnoses: string[];
  };
  currentNodes: Array<{ type: string; label: string }>;
  currentConnections: number;
  testsOrdered: string[];
}

const systemPrompt = `You are a Socratic medical educator helping students develop metacognitive skills.
Based on the student's current reasoning map, generate a thoughtful question that:
- Encourages deeper thinking without giving away answers
- Challenges assumptions appropriately
- Promotes consideration of alternatives
- Is specific to their current reasoning state

Return a JSON object with:
{
  "question": "Your Socratic question",
  "category": "hypothesis" | "evidence" | "alternatives" | "uncertainty" | "next-steps",
  "explanation": "Brief internal note on why this question is valuable (not shown to student)"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData = (await req.json()) as SocraticPromptRequest;
    console.log("Generating Socratic prompt for:", requestData.caseContext.specialty);

    const diagnosisNodes = requestData.currentNodes.filter((n) => n.type === "diagnosis");
    const symptomNodes = requestData.currentNodes.filter((n) => n.type === "symptom");

    const userPrompt = `Case context:
Specialty: ${requestData.caseContext.specialty}
Presentation: ${requestData.caseContext.presentation}

Student's current reasoning:
- Symptoms/findings identified: ${symptomNodes.map((n) => n.label).join(", ") || "None yet"}
- Diagnoses being considered: ${diagnosisNodes.map((n) => n.label).join(", ") || "None yet"}
- Number of connections drawn: ${requestData.currentConnections}
- Tests ordered: ${requestData.testsOrdered.join(", ") || "None yet"}

Generate an appropriate Socratic question for this stage of reasoning. Return only valid JSON.`;

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

    let promptData;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      promptData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse prompt data from AI response");
    }

    console.log("Generated prompt:", promptData.category);

    return new Response(JSON.stringify(promptData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Socratic prompt error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
