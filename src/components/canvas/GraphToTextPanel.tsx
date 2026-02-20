import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GraphToTextPanelProps {
  nodes: Node[];
  edges: Edge[];
  caseId: string;
}

type NarrativeType = 'clinical' | 'differential' | 'summary';

export function GraphToTextPanel({ nodes, edges, caseId }: GraphToTextPanelProps) {
  const [narrative, setNarrative] = useState('');
  const [narrativeType, setNarrativeType] = useState<NarrativeType>('clinical');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateNarrative = async () => {
    if (nodes.length === 0) {
      toast.error('Add some nodes to the canvas first');
      return;
    }

    setIsGenerating(true);
    setNarrative('');

    // Build graph description
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
        label: e.data?.label,
      })),
    };

    try {
      const { data, error } = await supabase.functions.invoke('graph-to-text', {
        body: { graphData, narrativeType },
      });

      if (error) throw error;
      setNarrative(data.narrative || 'Failed to generate narrative.');
    } catch (err) {
      console.error('Graph to text error:', err);
      // Fallback: generate locally
      const fallback = generateLocalNarrative(graphData, narrativeType);
      setNarrative(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={narrativeType} onValueChange={(v: NarrativeType) => setNarrativeType(v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clinical">Clinical Narrative</SelectItem>
            <SelectItem value="differential">Differential Dx</SelectItem>
            <SelectItem value="summary">Brief Summary</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={generateNarrative}
          disabled={isGenerating || nodes.length === 0}
          className="gap-1.5"
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate
        </Button>
      </div>

      {narrative && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {narrativeType === 'clinical' ? 'Clinical Narrative' : narrativeType === 'differential' ? 'Differential' : 'Summary'}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <ScrollArea className="max-h-[200px]">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{narrative}</p>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function generateLocalNarrative(
  graphData: { nodes: any[]; connections: any[] },
  type: NarrativeType
): string {
  const symptoms = graphData.nodes.filter(n => n.type === 'symptom').map(n => n.label);
  const findings = graphData.nodes.filter(n => n.type === 'finding').map(n => n.label);
  const diagnoses = graphData.nodes.filter(n => n.type === 'diagnosis').map(n => n.label);
  const tests = graphData.nodes.filter(n => n.type === 'test').map(n => n.label);

  if (type === 'summary') {
    const parts = [];
    if (symptoms.length) parts.push(`Presenting with: ${symptoms.join(', ')}.`);
    if (findings.length) parts.push(`Key findings: ${findings.join(', ')}.`);
    if (diagnoses.length) parts.push(`Differential includes: ${diagnoses.join(', ')}.`);
    if (tests.length) parts.push(`Tests ordered: ${tests.join(', ')}.`);
    return parts.join(' ') || 'Empty reasoning map.';
  }

  if (type === 'differential') {
    if (!diagnoses.length) return 'No diagnoses have been mapped yet.';
    return diagnoses.map((d, i) => {
      const supporting = graphData.connections
        .filter(c => c.to === d && (c.type === 'supports-strong' || c.type === 'supports-weak'))
        .map(c => c.from).filter(Boolean);
      const against = graphData.connections
        .filter(c => c.to === d && c.type === 'contradicts')
        .map(c => c.from).filter(Boolean);

      let text = `${i + 1}. ${d}`;
      if (supporting.length) text += `\n   Supporting: ${supporting.join(', ')}`;
      if (against.length) text += `\n   Against: ${against.join(', ')}`;
      return text;
    }).join('\n\n');
  }

  // Clinical narrative
  const parts = [];
  if (symptoms.length) parts.push(`The patient presents with ${symptoms.join(', ')}.`);
  if (findings.length) parts.push(`On examination, notable findings include ${findings.join(', ')}.`);
  if (tests.length) parts.push(`Diagnostic workup includes ${tests.join(', ')}.`);
  if (diagnoses.length) {
    const primary = diagnoses[0];
    const rest = diagnoses.slice(1);
    parts.push(`The leading diagnosis is ${primary}${rest.length ? `, with ${rest.join(', ')} in the differential` : ''}.`);
  }
  
  const supportingConnections = graphData.connections.filter(c => c.type === 'supports-strong');
  if (supportingConnections.length) {
    parts.push(`Key reasoning links include: ${supportingConnections.map(c => `${c.from} supports ${c.to}`).join('; ')}.`);
  }

  return parts.join('\n\n') || 'Begin adding nodes to generate a clinical narrative.';
}
