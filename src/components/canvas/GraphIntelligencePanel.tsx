import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Loader2, Brain, GitCompare, Search, Sparkles, Maximize2 } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraphToTextPanel } from './GraphToTextPanel';
import ReactMarkdown from 'react-markdown';

interface GraphIntelligencePanelProps {
  nodes: Node[];
  edges: Edge[];
  caseId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function GraphIntelligencePanel({ nodes, edges, caseId, isOpen, onToggle }: GraphIntelligencePanelProps) {
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState('');
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [intersectionResult, setIntersectionResult] = useState('');
  const [isIntersectionLoading, setIsIntersectionLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(60); // Height as percentage (60% of viewport)

  const graphData = {
    nodes: nodes.map(n => ({
      type: n.data?.nodeType,
      label: n.data?.label,
      description: n.data?.description,
      confidence: n.data?.confidence,
    })),
    connections: edges.map(e => ({
      from: nodes.find(n => n.id === e.source)?.data?.label,
      to: nodes.find(n => n.id === e.target)?.data?.label,
      type: e.data?.connectionType,
    })),
  };

  const runGraphRAG = async () => {
    if (nodes.length === 0) { toast.error('Add nodes first'); return; }
    setIsRagLoading(true);
    try {
      const { generateGeminiContent } = await import('@/services/geminiService');
      const graphContext = `Current Reasoning Graph:
Nodes: ${JSON.stringify(graphData.nodes)}
Connections: ${JSON.stringify(graphData.connections)}`;

      const prompt = ragQuery 
        ? `${graphContext}\n\nUser question: ${ragQuery}\n\nUsing the reasoning graph as context, provide evidence-based medical information to answer this question. Cite relevant medical literature concepts. Suggest additional nodes or connections that could strengthen the reasoning.`
        : `${graphContext}\n\nAnalyze this reasoning graph and provide:\n1. Evidence-based insights for each diagnosis\n2. Missing differential diagnoses to consider\n3. Recommended tests with expected findings\n4. Key medical knowledge that connects the symptoms to diagnoses\n5. Potential cognitive biases in the current reasoning\n\nBe specific and cite medical reasoning principles.`;

      const content = await generateGeminiContent(
        "You are a medical knowledge assistant using Graph-RAG (Retrieval-Augmented Generation). Given a clinical reasoning graph, provide evidence-based medical insights, suggest missing connections, and help strengthen diagnostic reasoning. Format responses in clear markdown with sections.",
        prompt
      );
      
      setRagResult(content || 'No insights generated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate insights');
    } finally {
      setIsRagLoading(false);
    }
  };

  const runIntersection = async () => {
    if (nodes.length === 0) { toast.error('Add nodes first'); return; }
    // Compare against saved expert map from localStorage (or use empty comparison)
    const savedExpert = localStorage.getItem(`expert-map-${caseId}`);
    const expertGraph = savedExpert ? JSON.parse(savedExpert) : { nodes: [], connections: [] };

    setIsIntersectionLoading(true);
    try {
      const { generateGeminiContent } = await import('@/services/geminiService');
      
      const graph1Diagnoses = graphData.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label);
      const graph2Diagnoses = expertGraph.nodes.filter((n: any) => n.type === 'diagnosis').map((n: any) => n.label);
      const graph1Symptoms = graphData.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label);
      const graph2Symptoms = expertGraph.nodes.filter((n: any) => n.type === 'symptom').map((n: any) => n.label);
      const graph1Findings = graphData.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label);
      const graph2Findings = expertGraph.nodes.filter((n: any) => n.type === 'finding').map((n: any) => n.label);
      const graph1Tests = graphData.nodes.filter((n: any) => n.type === 'test').map((n: any) => n.label);
      const graph2Tests = expertGraph.nodes.filter((n: any) => n.type === 'test').map((n: any) => n.label);

      const prompt = `You are a clinical reasoning analyst. Compare these two reasoning graphs and provide detailed semantic analysis.

## Graph 1 (Student/User Reasoning)
**Diagnoses (${graph1Diagnoses.length}):** ${graph1Diagnoses.join(', ') || 'None'}
**Symptoms (${graph1Symptoms.length}):** ${graph1Symptoms.join(', ') || 'None'}
**Findings (${graph1Findings.length}):** ${graph1Findings.join(', ') || 'None'}
**Tests Ordered (${graph1Tests.length}):** ${graph1Tests.join(', ') || 'None'}

**All Nodes:**
${JSON.stringify(graphData.nodes, null, 2)}

**Connections:**
${JSON.stringify(graphData.connections, null, 2)}

## Graph 2 (Expert/Reference Reasoning)
**Diagnoses (${graph2Diagnoses.length}):** ${graph2Diagnoses.join(', ') || 'None'}
**Symptoms (${graph2Symptoms.length}):** ${graph2Symptoms.join(', ') || 'None'}
**Findings (${graph2Findings.length}):** ${graph2Findings.join(', ') || 'None'}
**Tests Ordered (${graph2Tests.length}):** ${graph2Tests.join(', ') || 'None'}

**All Nodes:**
${JSON.stringify(expertGraph.nodes, null, 2)}

**Connections:**
${JSON.stringify(expertGraph.connections, null, 2)}

## Required Analysis

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

      const content = await generateGeminiContent(
        "You are an expert clinical reasoning analyst and medical educator. You specialize in comparing diagnostic reasoning processes and identifying semantic equivalencies in medical terminology. Provide detailed, accurate, and educationally valuable analysis.",
        prompt
      );
      
      setIntersectionResult(content || 'No analysis generated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze intersection');
    } finally {
      setIsIntersectionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-4 top-4 z-40 w-80 transition-all duration-300 ease-in-out flex flex-col"
      style={{ height: `${panelHeight}vh` }}
    >
      <div className="rounded-lg border bg-card shadow-lg overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-card shrink-0">
          <span className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Graph Intelligence
          </span>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs h-6">Close</Button>
        </div>

        {/* Height Slider Control */}
        <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
            <Slider
              value={[panelHeight]}
              onValueChange={(value) => setPanelHeight(value[0])}
              min={40}
              max={90}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12 text-right">{panelHeight}%</span>
          </div>
        </div>

        <Tabs defaultValue="text" className="p-0 flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full grid grid-cols-3 rounded-none h-8 shrink-0">
            <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
            <TabsTrigger value="rag" className="text-xs">RAG</TabsTrigger>
            <TabsTrigger value="intersect" className="text-xs">Intersect</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="p-3 m-0 flex-1 overflow-auto">
            <GraphToTextPanel nodes={nodes} edges={edges} caseId={caseId} />
          </TabsContent>

          <TabsContent value="rag" className="p-3 m-0 space-y-3 flex-1 overflow-auto">
            <p className="text-xs text-muted-foreground">
              Query medical knowledge using your reasoning graph as context.
            </p>
            <Textarea
              value={ragQuery}
              onChange={e => setRagQuery(e.target.value)}
              placeholder="Ask about your reasoning... (leave empty for general analysis)"
              className="min-h-[60px] text-xs resize-none"
            />
            <Button size="sm" onClick={runGraphRAG} disabled={isRagLoading || nodes.length === 0} className="w-full gap-1.5">
              {isRagLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              {ragQuery ? 'Search' : 'Analyze Graph'}
            </Button>
            {ragResult && (
              <ScrollArea className="max-h-[250px] rounded border p-2 bg-muted/30">
                <div className="prose prose-sm prose-slate max-w-none text-xs">
                  <ReactMarkdown>{ragResult}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="intersect" className="p-3 m-0 space-y-3 flex-1 overflow-auto">
            <p className="text-xs text-muted-foreground">
              Compare your graph against another reasoner or expert map using AI.
            </p>
            <Button size="sm" onClick={runIntersection} disabled={isIntersectionLoading || nodes.length === 0} className="w-full gap-1.5">
              {isIntersectionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitCompare className="h-3 w-3" />}
              Run Intersection Analysis
            </Button>
            {intersectionResult && (
              <ScrollArea className="max-h-[250px] rounded border p-2 bg-muted/30">
                <div className="prose prose-sm prose-slate max-w-none text-xs">
                  <ReactMarkdown>{intersectionResult}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
