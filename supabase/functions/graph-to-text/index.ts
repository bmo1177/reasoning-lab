import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { graphData, narrativeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      clinical: `You are a clinical reasoning expert. Convert the provided reasoning graph into a structured clinical narrative. 
Write in professional medical language. Include: patient presentation, key findings, diagnostic reasoning with supporting/contradicting evidence, and recommended workup. 
Keep it concise but thorough. Do not invent information not present in the graph.`,
      differential: `You are a clinical reasoning expert. Convert the provided reasoning graph into a structured differential diagnosis list.
For each diagnosis, list supporting evidence and contradicting evidence from the graph. Rank by likelihood based on the connection strengths.
Do not invent information not present in the graph.`,
      summary: `You are a clinical reasoning expert. Convert the provided reasoning graph into a brief 2-3 sentence summary.
Mention the key symptoms, primary diagnosis considerations, and critical tests. Be concise.
Do not invent information not present in the graph.`,
    };

    const prompt = `Here is a clinical reasoning graph:\n\nNodes:\n${JSON.stringify(graphData.nodes, null, 2)}\n\nConnections:\n${JSON.stringify(graphData.connections, null, 2)}\n\nConvert this into a ${narrativeType} narrative.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompts[narrativeType] || systemPrompts.clinical },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const narrative = data.choices?.[0]?.message?.content || "Failed to generate narrative.";

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graph-to-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
