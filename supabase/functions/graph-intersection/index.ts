import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { graph1, graph2, analysisType, includeSemanticMatching } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Extract diagnoses for focused comparison
    const graph1Diagnoses = graph1.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label);
    const graph2Diagnoses = graph2.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label);
    
    // Extract all node labels by type
    const graph1Symptoms = graph1.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label);
    const graph2Symptoms = graph2.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label);
    
    const graph1Findings = graph1.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label);
    const graph2Findings = graph2.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label);
    
    const graph1Tests = graph1.nodes.filter((n: any) => n.type === 'test').map((n: any) => n.label);
    const graph2Tests = graph2.nodes.filter((n: any) => n.type === 'test').map((n: any) => n.label);

    const prompt = `You are a clinical reasoning analyst. Compare these two reasoning graphs and provide detailed semantic analysis.

## Graph 1 (Student/User Reasoning)
**Diagnoses (${graph1Diagnoses.length}):** ${graph1Diagnoses.join(', ') || 'None'}
**Symptoms (${graph1Symptoms.length}):** ${graph1Symptoms.join(', ') || 'None'}
**Findings (${graph1Findings.length}):** ${graph1Findings.join(', ') || 'None'}
**Tests Ordered (${graph1Tests.length}):** ${graph1Tests.join(', ') || 'None'}

**All Nodes:**
${JSON.stringify(graph1.nodes, null, 2)}

**Connections:**
${JSON.stringify(graph1.connections, null, 2)}

## Graph 2 (Expert/Reference Reasoning)
**Diagnoses (${graph2Diagnoses.length}):** ${graph2Diagnoses.join(', ') || 'None'}
**Symptoms (${graph2Symptoms.length}):** ${graph2Symptoms.join(', ') || 'None'}
**Findings (${graph2Findings.length}):** ${graph2Findings.join(', ') || 'None'}
**Tests Ordered (${graph2Tests.length}):** ${graph2Tests.join(', ') || 'None'}

**All Nodes:**
${JSON.stringify(graph2.nodes, null, 2)}

**Connections:**
${JSON.stringify(graph2.connections, null, 2)}

## Required Analysis

${includeSemanticMatching ? `### Semantic Matches (Critical Section)
Provide a detailed list of diagnoses from Graph 1 that SEMANTICALLY match diagnoses in Graph 2, even if the wording differs. Use medical knowledge to determine equivalency.

Format as:
- "Student Diagnosis" ≈ "Expert Diagnosis" (Confidence%) - Brief explanation

Example:
- "Acute Decompensated Heart Failure" ≈ "Acute Heart Failure" (95%) - Same condition, different specificity
- "HFrEF" ≈ "Heart Failure with Reduced Ejection Fraction" (100%) - Abbreviation vs full name
- "AFib" ≈ "Atrial Fibrillation" (100%) - Common abbreviation

Be thorough and consider:
- Abbreviations vs full names
- Different classification systems
- Varying levels of specificity
- Clinical synonyms` : ''}

### Shared Concepts
List all concepts that appear in both graphs (exact or semantic matches).

### Unique to Graph 1 (Student)
Concepts considered by the student but NOT by the expert. Evaluate if these are:
- Reasonable differentials to consider
- Over-interpretations
- Red herrings

### Unique to Graph 2 (Expert)
Concepts in expert reasoning that student missed. For each:
- Why it's important
- What findings should have triggered this consideration
- Clinical significance

### Reasoning Alignment
Compare the logical flow and connections:
- Are the causal relationships similar?
- Does the student follow sound diagnostic logic?
- Are there any dangerous misinterpretations?
- Quality of supporting evidence cited

### Gaps & Recommendations
Provide 3-5 specific, actionable recommendations:
- What key diagnoses were missed?
- What critical findings were overlooked?
- How can reasoning be improved?
- What additional workup is needed?

### Overall Assessment
Brief summary (2-3 sentences) evaluating:
- Diagnostic accuracy (percentage or qualitative)
- Reasoning quality
- Areas of strength
- Priority areas for improvement

Format as structured markdown with clear headers. Be specific, cite actual diagnoses/findings from the graphs, and provide actionable clinical insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert clinical reasoning analyst and medical educator. You specialize in comparing diagnostic reasoning processes and identifying semantic equivalencies in medical terminology. Provide detailed, accurate, and educationally valuable analysis." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
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
    const analysis = data.choices?.[0]?.message?.content || "Failed to analyze.";

    // Also calculate basic statistics
    const stats = calculateBasicStats(graph1, graph2);

    return new Response(JSON.stringify({ 
      analysis,
      stats,
      graph1Summary: {
        totalNodes: graph1.nodes.length,
        diagnoses: graph1Diagnoses.length,
        symptoms: graph1Symptoms.length,
        findings: graph1Findings.length,
        tests: graph1Tests.length,
        connections: graph1.connections.length,
      },
      graph2Summary: {
        totalNodes: graph2.nodes.length,
        diagnoses: graph2Diagnoses.length,
        symptoms: graph2Symptoms.length,
        findings: graph2Findings.length,
        tests: graph2Tests.length,
        connections: graph2.connections.length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graph-intersection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateBasicStats(graph1: any, graph2: any) {
  const g1Diagnoses = new Set(graph1.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label.toLowerCase()));
  const g2Diagnoses = new Set(graph2.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label.toLowerCase()));
  
  const g1Symptoms = new Set(graph1.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label.toLowerCase()));
  const g2Symptoms = new Set(graph2.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label.toLowerCase()));
  
  const g1Findings = new Set(graph1.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label.toLowerCase()));
  const g2Findings = new Set(graph2.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label.toLowerCase()));
  
  // Exact matches
  const matchedDiagnoses = [...g1Diagnoses].filter(d => g2Diagnoses.has(d));
  const missedDiagnoses = [...g2Diagnoses].filter(d => !g1Diagnoses.has(d));
  const extraDiagnoses = [...g1Diagnoses].filter(d => !g2Diagnoses.has(d));
  
  return {
    diagnoses: {
      matched: matchedDiagnoses.length,
      missed: missedDiagnoses.length,
      extra: extraDiagnoses.length,
      studentTotal: g1Diagnoses.size,
      expertTotal: g2Diagnoses.size,
      matchRate: g2Diagnoses.size > 0 ? Math.round((matchedDiagnoses.length / g2Diagnoses.size) * 100) : 0,
    },
    symptoms: {
      matched: [...g1Symptoms].filter(s => g2Symptoms.has(s)).length,
      studentTotal: g1Symptoms.size,
      expertTotal: g2Symptoms.size,
    },
    findings: {
      matched: [...g1Findings].filter(f => g2Findings.has(f)).length,
      studentTotal: g1Findings.size,
      expertTotal: g2Findings.size,
    },
  };
}
