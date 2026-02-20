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
      const { data, error } = await supabase.functions.invoke('graph-rag', {
        body: { graphData, query: ragQuery || undefined },
      });
      if (error) throw error;
      setRagResult(data.insights || 'No insights generated.');
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
      const { data, error } = await supabase.functions.invoke('graph-intersection', {
        body: { graph1: graphData, graph2: expertGraph, analysisType: 'intersection' },
      });
      if (error) throw error;
      setIntersectionResult(data.analysis || 'No analysis generated.');
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
      className="absolute right-4 top-4 z-10 w-80 transition-all duration-300 ease-in-out flex flex-col"
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
