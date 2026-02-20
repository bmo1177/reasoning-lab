import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { graphData, query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const graphContext = `Current Reasoning Graph:
Nodes: ${JSON.stringify(graphData.nodes)}
Connections: ${JSON.stringify(graphData.connections)}`;

    const prompt = query 
      ? `${graphContext}\n\nUser question: ${query}\n\nUsing the reasoning graph as context, provide evidence-based medical information to answer this question. Cite relevant medical literature concepts. Suggest additional nodes or connections that could strengthen the reasoning.`
      : `${graphContext}\n\nAnalyze this reasoning graph and provide:\n1. Evidence-based insights for each diagnosis\n2. Missing differential diagnoses to consider\n3. Recommended tests with expected findings\n4. Key medical knowledge that connects the symptoms to diagnoses\n5. Potential cognitive biases in the current reasoning\n\nBe specific and cite medical reasoning principles.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a medical knowledge assistant using Graph-RAG (Retrieval-Augmented Generation). Given a clinical reasoning graph, provide evidence-based medical insights, suggest missing connections, and help strengthen diagnostic reasoning. Format responses in clear markdown with sections." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "Failed to generate insights.";

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graph-rag error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
