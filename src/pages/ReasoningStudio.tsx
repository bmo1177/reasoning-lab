import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { sampleCases } from '@/data/sampleCases';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitCompare, Printer, Brain, Sparkles, FileText, PenLine, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import { PrintableCase, handlePrintCase } from '@/components/print/PrintableCase';
import { motion } from 'framer-motion';
import { ReasoningCanvas } from '@/components/canvas/ReasoningCanvas';
import { CasePanel } from '@/components/studio/CasePanel';
import { ThinkAloudPanel } from '@/components/studio/ThinkAloudPanel';
import { SocraticPrompt } from '@/components/studio/SocraticPrompt';
import { OnboardingTour } from '@/components/studio/OnboardingTour';
import { ProgressIndicator } from '@/components/studio/ProgressIndicator';
import { ExportMenu } from '@/components/canvas/ExportMenu';
import { ModeToggle } from '@/components/mode-toggle';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ClinicalCase, ReasoningMap } from '@/types/case';
import { Node, Edge } from '@xyflow/react';

export default function ReasoningStudio() {
  const { caseId } = useParams<{ caseId: string }>();
  const [showComparison, setShowComparison] = useState(false);
  const [showGraphIntelligence, setShowGraphIntelligence] = useState(false);
  const [hasSeenGraphIntelligence, setHasSeenGraphIntelligence] = useState(() => {
    return localStorage.getItem('has-seen-graph-intelligence') === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('has-completed-onboarding') !== 'true';
  });
  const [focusMode, setFocusMode] = useState(false);
  const [activePanel, setActivePanel] = useState<'case' | 'canvas' | 'notes'>('canvas');
  const [isMobile, setIsMobile] = useState(false);
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([]);
  const [testsOrdered, setTestsOrdered] = useState<string[]>([]);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Find case from sample cases or AI-generated cases in sessionStorage
  const clinicalCase = useMemo((): ClinicalCase | undefined => {
    // First check sample cases
    const sampleCase = sampleCases.find((c) => c.id === caseId);
    if (sampleCase) return sampleCase;

    // Then check AI-generated cases in sessionStorage
    try {
      const aiCases: ClinicalCase[] = JSON.parse(
        sessionStorage.getItem('ai-generated-cases') || '[]'
      );
      return aiCases.find((c) => c.id === caseId);
    } catch {
      return undefined;
    }
  }, [caseId]);

  // Handle canvas state changes from ReasoningCanvas
  const handleCanvasStateChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setCanvasNodes(nodes);
    setCanvasEdges(edges);
  }, []);

  // Build student map from real-time canvas state or localStorage
  const studentMap: ReasoningMap = useMemo(() => {
    // Always prioritize localStorage data when in comparison mode or when canvas state is empty
    const savedCanvas = localStorage.getItem(`canvas-${caseId}`);
    
    if (savedCanvas) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedCanvas);
        if (savedNodes?.length > 0 || savedEdges?.length > 0) {
          return {
            nodes: savedNodes.map((n: Node) => ({
              id: n.id,
              type: n.data?.nodeType || 'note',
              label: n.data?.label || '',
              description: n.data?.description,
              position: n.position,
              confidence: n.data?.confidence,
            })),
            connections: savedEdges.map((e: Edge) => ({
              id: e.id,
              sourceId: e.source,
              targetId: e.target,
              type: e.data?.connectionType || 'neutral',
              label: e.data?.label,
            })),
            notes: [],
          };
        }
      } catch {
        console.error('Failed to load canvas from localStorage');
      }
    }

    // Use real-time canvas state if available
    if (canvasNodes.length > 0 || canvasEdges.length > 0) {
      return {
        nodes: canvasNodes.map((n: Node) => ({
          id: n.id,
          type: n.data?.nodeType || 'note',
          label: n.data?.label || '',
          description: n.data?.description,
          position: n.position,
          confidence: n.data?.confidence,
        })),
        connections: canvasEdges.map((e: Edge) => ({
          id: e.id,
          sourceId: e.source,
          targetId: e.target,
          type: e.data?.connectionType || 'neutral',
          label: e.data?.label,
        })),
        notes: [],
      };
    }

    return { nodes: [], connections: [], notes: [] };
  }, [caseId, showComparison, canvasNodes, canvasEdges]);

  const handleTestOrdered = useCallback((testId: string) => {
    setTestsOrdered((prev) => [...prev, testId]);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('has-completed-onboarding', 'true');
    setShowOnboarding(false);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('has-completed-onboarding', 'true');
    setShowOnboarding(false);
  }, []);

  const currentNodesForPrompt = useMemo(() => {
    return studentMap.nodes.map((n) => ({ type: n.type, label: n.label }));
  }, [studentMap.nodes]);

  if (!clinicalCase) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Case not found</h1>
            <p className="mt-2 text-muted-foreground">
              The case you're looking for doesn't exist.
            </p>
            <Button asChild className="mt-4">
              <Link to="/cases">Back to Cases</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show comparison view
  if (showComparison && clinicalCase.expertReasoningMap) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="flex items-center justify-between border-b px-4 py-2 bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComparison(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Canvas
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <ComparisonView
            studentMap={studentMap}
            expertMap={clinicalCase.expertReasoningMap}
            caseTitle={clinicalCase.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact header for studio */}
      <header className="flex items-center justify-between border-b px-4 py-2 bg-card">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/cases">
              <ArrowLeft className="h-4 w-4" />
              Cases
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold leading-tight">{clinicalCase.title}</h1>
            <p className="text-xs text-muted-foreground">
              {clinicalCase.patient.age}yo {clinicalCase.patient.sex} — {clinicalCase.patient.chiefComplaint}
            </p>
          </div>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Primary Actions (Canvas specific) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setFocusMode(!focusMode)}
                >
                  {focusMode ? (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Exit Focus</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Focus Mode</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{focusMode ? 'Exit focus mode' : 'Focus on canvas'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Compare button - only show if expert map exists */}
            {clinicalCase.expertReasoningMap && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowComparison(true)}
                  >
                    <GitCompare className="h-4 w-4" />
                    <span className="hidden sm:inline">Compare</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compare with Expert Map</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* AI Analysis button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 relative"
                  onClick={() => {
                    setShowGraphIntelligence(true);
                    if (!hasSeenGraphIntelligence) {
                      setHasSeenGraphIntelligence(true);
                      localStorage.setItem('has-seen-graph-intelligence', 'true');
                    }
                  }}
                >
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">AI Analysis</span>
                  {!hasSeenGraphIntelligence && canvasNodes.length > 2 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Analyze reasoning graph</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="h-6 w-px bg-border mx-1" />
            
            {/* Secondary Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handlePrintCase}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print case</p>
              </TooltipContent>
            </Tooltip>

            <ExportMenu 
              caseId={clinicalCase.id}
              caseTitle={clinicalCase.title}
              reasoningMap={studentMap}
            />
            
            <ModeToggle />
          </div>
        </TooltipProvider>
      </header>

      {/* Mobile Tab Navigation - Hidden in Focus Mode */}
      {isMobile && !focusMode && (
        <div className="flex border-b bg-card">
          <Button
            variant={activePanel === 'case' ? 'secondary' : 'ghost'}
            className="flex-1 gap-2 rounded-none"
            onClick={() => setActivePanel('case')}
          >
            <FileText className="h-4 w-4" />
            Case
          </Button>
          <Button
            variant={activePanel === 'canvas' ? 'secondary' : 'ghost'}
            className="flex-1 gap-2 rounded-none"
            onClick={() => setActivePanel('canvas')}
          >
            <LayoutGrid className="h-4 w-4" />
            Canvas
          </Button>
          <Button
            variant={activePanel === 'notes' ? 'secondary' : 'ghost'}
            className="flex-1 gap-2 rounded-none"
            onClick={() => setActivePanel('notes')}
          >
            <PenLine className="h-4 w-4" />
            Notes
          </Button>
        </div>
      )}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-hidden"
      >
        {isMobile ? (
          // Mobile Layout - Single panel view with tabs
          <div className="h-full">
            {activePanel === 'case' && (
              <div className="h-full bg-card">
                <CasePanel clinicalCase={clinicalCase} onTestOrdered={handleTestOrdered} />
              </div>
            )}
            {activePanel === 'canvas' && (
              <div className="h-full relative flex flex-col">
                {/* Progress Indicator */}
                {!showOnboarding && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-lg">
                    <ProgressIndicator 
                      nodes={currentNodesForPrompt}
                      connections={studentMap.connections.length}
                    />
                  </div>
                )}
                
                <div className="flex-1 relative">
                  <ReasoningCanvas 
                    caseId={clinicalCase.id} 
                    onStateChange={handleCanvasStateChange}
                    externalShowIntelligence={showGraphIntelligence}
                    onIntelligenceClose={() => setShowGraphIntelligence(false)}
                    onToggleFocusMode={() => setFocusMode(!focusMode)}
                  />
                  <SocraticPrompt
                    caseContext={{
                      specialty: clinicalCase.specialty,
                      presentation: clinicalCase.presentation,
                      currentDiagnoses: studentMap.nodes
                        .filter((n) => n.type === 'diagnosis')
                        .map((n) => n.label),
                    }}
                    currentNodes={currentNodesForPrompt}
                    currentConnections={studentMap.connections.length}
                    testsOrdered={testsOrdered}
                  />
                </div>
              </div>
            )}
            {activePanel === 'notes' && (
              <div className="h-full bg-card">
                <ThinkAloudPanel caseId={clinicalCase.id} />
              </div>
            )}
          </div>
        ) : focusMode ? (
          // Focus Mode - Canvas only
          <div className="h-full relative flex flex-col">
            {/* Progress Indicator - Hidden in focus mode for cleaner view */}
            {!showOnboarding && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-lg opacity-0 hover:opacity-100 transition-opacity">
                <ProgressIndicator 
                  nodes={currentNodesForPrompt}
                  connections={studentMap.connections.length}
                />
              </div>
            )}
            
            <div className="flex-1 relative">
              <ReasoningCanvas 
                caseId={clinicalCase.id} 
                onStateChange={handleCanvasStateChange}
                externalShowIntelligence={showGraphIntelligence}
                onIntelligenceClose={() => setShowGraphIntelligence(false)}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
              />
              <SocraticPrompt
                caseContext={{
                  specialty: clinicalCase.specialty,
                  presentation: clinicalCase.presentation,
                  currentDiagnoses: studentMap.nodes
                    .filter((n) => n.type === 'diagnosis')
                    .map((n) => n.label),
                }}
                currentNodes={currentNodesForPrompt}
                currentConnections={studentMap.connections.length}
                testsOrdered={testsOrdered}
              />
            </div>
          </div>
        ) : (
          // Desktop Layout - Three panel view
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Case panel */}
            <ResizablePanel defaultSize={22} minSize={20} maxSize={40}>
              <div className="h-full border-r bg-card">
                <CasePanel clinicalCase={clinicalCase} onTestOrdered={handleTestOrdered} />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Canvas */}
            <ResizablePanel defaultSize={56} minSize={35}>
              <div className="h-full relative flex flex-col">
                {/* Progress Indicator */}
                {!showOnboarding && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-lg">
                    <ProgressIndicator 
                      nodes={currentNodesForPrompt}
                      connections={studentMap.connections.length}
                    />
                  </div>
                )}
                
                <div className="flex-1 relative">
                  <ReasoningCanvas 
                    caseId={clinicalCase.id} 
                    onStateChange={handleCanvasStateChange}
                    externalShowIntelligence={showGraphIntelligence}
                    onIntelligenceClose={() => setShowGraphIntelligence(false)}
                    onToggleFocusMode={() => setFocusMode(!focusMode)}
                  />

                  {/* Socratic prompts */}
                  <SocraticPrompt
                    caseContext={{
                      specialty: clinicalCase.specialty,
                      presentation: clinicalCase.presentation,
                      currentDiagnoses: studentMap.nodes
                        .filter((n) => n.type === 'diagnosis')
                        .map((n) => n.label),
                    }}
                    currentNodes={currentNodesForPrompt}
                    currentConnections={studentMap.connections.length}
                    testsOrdered={testsOrdered}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Think-aloud panel */}
            <ResizablePanel defaultSize={22} minSize={20} maxSize={40}>
              <div className="h-full border-l bg-card">
                <ThinkAloudPanel caseId={clinicalCase.id} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </motion.div>

      {/* Printable version - hidden on screen, shown when printing */}
      <PrintableCase clinicalCase={clinicalCase} />

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
