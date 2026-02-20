import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ReasoningMap, ReasoningNodeType } from '@/types/case';
import ReasoningNodeComponent from '../canvas/ReasoningNode';
import ConnectionEdge from '../canvas/ConnectionEdge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useGraphComparison, GraphComparisonResult } from '@/hooks/useGraphComparison';
import { Sparkles, AlertCircle, CheckCircle2, XCircle, Lightbulb, Target, Brain, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ComparisonViewProps {
  studentMap: ReasoningMap;
  expertMap: ReasoningMap;
  caseTitle: string;
}

const nodeTypes = { reasoning: ReasoningNodeComponent };
const edgeTypes = { connection: ConnectionEdge };

function MapView({
  map,
  title,
  variant,
}: {
  map: ReasoningMap;
  title: string;
  variant: 'student' | 'expert';
}) {
  const nodes: Node[] = useMemo(
    () =>
      map.nodes.map((node) => ({
        id: node.id,
        type: 'reasoning',
        position: node.position,
        data: {
          label: node.label,
          nodeType: node.type,
          description: node.description,
          confidence: node.confidence,
        },
        draggable: false,
      })),
    [map.nodes]
  );

  const edges: Edge[] = useMemo(
    () =>
      map.connections.map((conn) => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        type: 'connection',
        data: {
          connectionType: conn.type,
          label: conn.label,
        },
      })),
    [map.connections]
  );

  const minimapNodeColor = useCallback((node: Node) => {
    const type = node.data?.nodeType as ReasoningNodeType;
    const colors: Record<ReasoningNodeType, string> = {
      symptom: 'hsl(var(--node-symptom))',
      finding: 'hsl(var(--node-finding))',
      diagnosis: 'hsl(var(--node-diagnosis))',
      test: 'hsl(var(--node-test))',
      note: 'hsl(var(--muted-foreground))',
      treatment: '#10b981',
      outcome: '#3b82f6',
      'risk-factor': '#f97316',
      complication: '#ef4444',
    };
    return colors[type] || 'hsl(var(--primary))';
  }, []);

  return (
    <Card className={cn(
      'h-full flex flex-col',
      variant === 'expert' ? 'border-primary border-2 shadow-lg shadow-primary/10' : 'border-border'
    )}>
      <CardHeader className={cn(
        'py-3 px-4 border-b shrink-0',
        variant === 'expert' && 'bg-primary/5'
      )}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            {variant === 'expert' && <Brain className="h-4 w-4 text-primary" />}
            <span className={cn(variant === 'expert' && 'text-primary font-semibold')}>
              {title}
            </span>
          </span>
          <Badge variant={variant === 'expert' ? 'default' : 'outline'} className={cn(
            variant === 'expert' && 'bg-primary text-primary-foreground'
          )}>
            {map.nodes.length} nodes • {map.connections.length} connections
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="hsl(var(--background) / 0.8)"
            className="!bg-card !border !border-border rounded-lg"
          />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}

function SemanticMatchBadge({ 
  match, 
  type 
}: { 
  match: { studentDiagnosis: string; expertDiagnosis: string; confidence: number; explanation?: string };
  type: 'match' | 'partial' | 'miss';
}) {
  const colors = {
    match: 'bg-supports-strong/20 text-supports-strong border-supports-strong/50',
    partial: 'bg-supports-weak/20 text-supports-weak border-supports-weak/50',
    miss: 'bg-contradicts/20 text-contradicts border-contradicts/50',
  };

  return (
    <div className={cn("p-3 rounded-lg border", colors[type])}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{match.studentDiagnosis}</span>
        <Badge variant="outline" className="text-xs">
          {match.confidence}%
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
        <span>matches</span>
        <span className="font-medium">{match.expertDiagnosis}</span>
      </div>
      {match.explanation && (
        <p className="text-xs mt-2 opacity-70">{match.explanation}</p>
      )}
      <Progress value={match.confidence} className="h-1 mt-2" />
    </div>
  );
}

function ComparisonStats({
  studentMap,
  expertMap,
  aiResult,
  isLoading,
  onAnalyze,
}: {
  studentMap: ReasoningMap;
  expertMap: ReasoningMap;
  aiResult: GraphComparisonResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
}) {
  const studentDiagnoses = studentMap.nodes.filter((n) => n.type === 'diagnosis');
  const expertDiagnoses = expertMap.nodes.filter((n) => n.type === 'diagnosis');

  // Basic string matching for immediate feedback
  const basicMatched = studentDiagnoses.filter((sd) =>
    expertDiagnoses.some((ed) => ed.label.toLowerCase() === sd.label.toLowerCase())
  );

  const basicMissed = expertDiagnoses.filter(
    (ed) =>
      !studentDiagnoses.some((sd) => sd.label.toLowerCase() === ed.label.toLowerCase())
  );

  const basicExtra = studentDiagnoses.filter(
    (sd) =>
      !expertDiagnoses.some((ed) => ed.label.toLowerCase() === sd.label.toLowerCase())
  );

  // Calculate AI-enhanced metrics
  const aiMatches = aiResult?.semanticMatches || [];
  const highConfidenceMatches = aiMatches.filter(m => m.confidence >= 80);
  const partialMatches = aiMatches.filter(m => m.confidence >= 50 && m.confidence < 80);
  const lowConfidenceMatches = aiMatches.filter(m => m.confidence < 50);

  const hasStudentContent = studentMap.nodes.length > 0;

  return (
    <div className="space-y-4">
      {/* Warning if no student reasoning */}
      {!hasStudentContent && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">No Reasoning Map Found</AlertTitle>
          <AlertDescription className="text-amber-700">
            You haven't created any nodes in your reasoning map yet. Go back to the canvas to build your diagnostic reasoning before comparing.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-supports-strong/10 border-supports-strong/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-supports-strong">
                {aiResult ? highConfidenceMatches.length : basicMatched.length}
              </p>
              <CheckCircle2 className="h-5 w-5 text-supports-strong opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Matched Diagnoses</p>
            {basicMatched.length > 0 && !aiResult && (
              <div className="mt-2 flex flex-wrap gap-1">
                {basicMatched.slice(0, 3).map((d) => (
                  <Badge key={d.id} variant="outline" className="text-xs">
                    {d.label}
                  </Badge>
                ))}
                {basicMatched.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{basicMatched.length - 3}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-contradicts/10 border-contradicts/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-contradicts">
                {aiResult 
                  ? expertDiagnoses.length - highConfidenceMatches.length 
                  : basicMissed.length
                }
              </p>
              <XCircle className="h-5 w-5 text-contradicts opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Missed Considerations</p>
            {basicMissed.length > 0 && !aiResult && (
              <div className="mt-2 flex flex-wrap gap-1">
                {basicMissed.slice(0, 3).map((d) => (
                  <Badge key={d.id} variant="outline" className="text-xs">
                    {d.label}
                  </Badge>
                ))}
                {basicMissed.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{basicMissed.length - 3}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-supports-weak/10 border-supports-weak/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-supports-weak">
                {aiResult 
                  ? studentDiagnoses.length - highConfidenceMatches.length 
                  : basicExtra.length
                }
              </p>
              <Target className="h-5 w-5 text-supports-weak opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Extra Steps</p>
            {basicExtra.length > 0 && !aiResult && (
              <div className="mt-2 flex flex-wrap gap-1">
                {basicExtra.slice(0, 3).map((d) => (
                  <Badge key={d.id} variant="outline" className="text-xs">
                    {d.label}
                  </Badge>
                ))}
                {basicExtra.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{basicExtra.length - 3}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      <Card className="border-primary/30">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI-Powered Analysis</CardTitle>
            </div>
            {!aiResult && !isLoading && (
              <Button 
                onClick={onAnalyze} 
                size="sm"
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                Analyze with AI
              </Button>
            )}
          </div>
          <CardDescription>
            Get detailed semantic comparison between your reasoning and expert reasoning
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Analyzing reasoning patterns...
              </div>
              <Progress value={33} className="h-2" />
            </div>
          ) : aiResult ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {/* Semantic Matches */}
                {aiResult.semanticMatches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-supports-strong" />
                      Semantic Matches
                    </h4>
                    <div className="space-y-2">
                      {aiResult.semanticMatches.map((match, idx) => (
                        <SemanticMatchBadge 
                          key={idx} 
                          match={match} 
                          type={match.confidence >= 80 ? 'match' : match.confidence >= 50 ? 'partial' : 'miss'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Reasoning Alignment */}
                {aiResult.reasoningAlignment && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Reasoning Alignment
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {aiResult.reasoningAlignment}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Gaps & Recommendations */}
                {aiResult.gapsAndRecommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-supports-weak" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {aiResult.gapsAndRecommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-supports-weak mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Assessment */}
                {aiResult.overallAssessment && (
                  <>
                    <Separator />
                    <Alert className="bg-primary/5 border-primary/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Overall Assessment</AlertTitle>
                      <AlertDescription className="text-sm">
                        {aiResult.overallAssessment}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Click "Analyze with AI" to get detailed insights about your reasoning
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ComparisonView({ studentMap, expertMap, caseTitle }: ComparisonViewProps) {
  const { compare, result, isLoading, error, clear } = useGraphComparison();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    // Auto-trigger analysis on mount if both maps have content
    if (!hasAnalyzed && studentMap.nodes.length > 0 && expertMap.nodes.length > 0) {
      compare(studentMap, expertMap);
      setHasAnalyzed(true);
    }
  }, [studentMap, expertMap, compare, hasAnalyzed]);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const handleAnalyze = useCallback(() => {
    compare(studentMap, expertMap);
  }, [compare, studentMap, expertMap]);

  // Calculate summary stats
  const studentDiagnoses = studentMap.nodes.filter((n) => n.type === 'diagnosis');
  const expertDiagnoses = expertMap.nodes.filter((n) => n.type === 'diagnosis');
  const matchedCount = studentDiagnoses.filter((sd) =>
    expertDiagnoses.some((ed) => ed.label.toLowerCase() === sd.label.toLowerCase())
  ).length;
  const totalNodes = studentMap.nodes.length;
  const totalConnections = studentMap.connections.length;

  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col p-4 overflow-hidden">
        {/* Header with summary stats */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Compare Your Reasoning: {caseTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {totalNodes > 0 ? (
                <>
                  Your map: {totalNodes} nodes, {totalConnections} connections • {' '}
                  {matchedCount} of {expertDiagnoses.length} diagnoses matched
                </>
              ) : (
                <span className="text-amber-600">No reasoning created yet - go back to canvas to build your map</span>
              )}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ComparisonStats 
          studentMap={studentMap} 
          expertMap={expertMap}
          aiResult={result}
          isLoading={isLoading}
          onAnalyze={handleAnalyze}
        />

        <div className="flex-1 flex gap-4 min-h-0 mt-4">
          <div className="flex-[40] min-h-0">
            <MapView map={studentMap} title="Your Reasoning Map" variant="student" />
          </div>
          <div className="flex-[60] min-h-0">
            <MapView map={expertMap} title="Expert Reasoning Map" variant="expert" />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
