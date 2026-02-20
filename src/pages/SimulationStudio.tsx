import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleBranchingCases } from '@/data/sampleBranchingCases';
import { SimulationHeader } from '@/components/simulation/SimulationHeader';
import { SimulationSidebar } from '@/components/simulation/SimulationSidebar';
import { DecisionPanel } from '@/components/simulation/DecisionPanel';
import { EcaChatPanel, type EcaMessage } from '@/components/simulation/EcaChatPanel';
import { WhatIfPanel } from '@/components/simulation/WhatIfPanel';

import {
  analyzeDecision,
  createEcaSession,
  buildSessionSummary,
  type EcaSessionState,
  type EcaContext,
} from '@/services/ecaService';
import { digitalTraceCollector } from '@/services/digitalTraceCollector';
import { feedbackRouter } from '@/services/feedbackRouter';
import { useConstraintValidator } from '@/hooks/useConstraintValidator';
import type { SimulationDecision, BranchingCase, PatientState } from '@/types/simulation';
import type { ConstraintValidation } from '@/services/constraintValidator';
import { toast } from 'sonner';
import { cn, generateUUID } from '@/lib/utils';

export default function SimulationStudio() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  // -- State --
  const [branchingCase, setBranchingCase] = useState<BranchingCase | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const [revealedInfo, setRevealedInfo] = useState<string[]>([]);
  const [decisionsLog, setDecisionsLog] = useState<Array<{ decision: SimulationDecision; timestamp: number }>>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [showWhatIf, setShowWhatIf] = useState(false);

  // -- Analytical State --
  const [ecaSession, setEcaSession] = useState<EcaSessionState>(createEcaSession());
  const [messages, setMessages] = useState<EcaMessage[]>([]);
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now());
  const [warningHistory, setWarningHistory] = useState<ConstraintValidation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { validateDecision, currentWarning, proceedWithWarning } = useConstraintValidator();

  const [sessionId, setSessionId] = useState<string>('');

  // -- Initialization --
  useEffect(() => {
    // Generate session ID on mount
    setSessionId(generateUUID());

    if (caseId) {
      const data = sampleBranchingCases.find(c => c.id === caseId);
      if (data) {
        setBranchingCase(data);
        const firstStage = data.stages[0];

        // Set initial patient state
        setPatientState(data.initialPatientState);

        // Initialize timer from critical window
        if (firstStage.criticalWindow) {
          setTimeRemaining(firstStage.criticalWindow);
        }

        // Start tracking
        digitalTraceCollector.startStage(firstStage.id);

        // ECA Greeting
        setMessages([{
          id: 'welcome',
          role: 'eca',
          content: `Welcome to **${data.title}**. ` +
            `I'm your clinical tutor. I'll monitor your decisions and provide guidance if needed. ` +
            `Review the patient's initial state on the left, then select an action.`,
          timestamp: new Date()
        }]);
      }
    }
  }, [caseId]);

  // -- Timer --
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      toast.error("Critical time window elapsed!");
    }
  }, [timeRemaining]);

  // -- Handlers --
  const handleDecision = (decision: SimulationDecision) => {
    if (!branchingCase || !patientState) return;

    const currentStage = branchingCase.stages[currentStageIndex];

    // 1. Validate Decision
    const context = {
      timeInStage: (Date.now() - stageStartTime) / 1000,
      decisionsInStage: decisionsLog.filter(d => d.timestamp > stageStartTime).length,
      totalDecisions: decisionsLog.length,
      currentStageId: currentStage.id
    };

    const { allowed, validation } = validateDecision(decision, patientState, branchingCase, context);

    if (!allowed && validation) {
      setWarningHistory(prev => [...prev, validation]);
      return; // Hook sets the warning state
    }

    executeDecision(decision);
  };

  const executeDecision = (decision: SimulationDecision) => {
    if (!branchingCase || !patientState) return;

    // 2. Update Simulation State
    setTotalCost((prev) => prev + decision.cost);
    setDecisionsLog((prev) => [...prev, { decision, timestamp: Date.now() }]);

    // 3. Reveal Info / Update Patient
    // Ensure decision.consequences exists to avoid TS error
    const consequences = decision.consequences || {};

    if (consequences.newInformationRevealed) {
      setRevealedInfo((prev) => [...prev, `${decision.label}: ${consequences.newInformationRevealed}`]);
    }

    // Apply state updates if any
    if (consequences.patientStateChange) {
      setPatientState(prev => ({
        ...prev!,
        ...consequences.patientStateChange
      }));
    }

    // 4. ECA Analysis
    const currentStage = branchingCase.stages[currentStageIndex];
    const context: EcaContext = {
      caseData: branchingCase,
      currentStage,
      patientState,
      decisionsLog: decisionsLog.map(d => ({
        decision: d.decision,
        timestamp: new Date(d.timestamp),
        stageId: currentStage.id,
        timeSpent: Date.now() - stageStartTime
      })),
      timeInStage: Date.now() - stageStartTime,
      difficulty: 'intermediate'
    };

    const { response, updatedState } = analyzeDecision(decision, context, ecaSession);
    setEcaSession(updatedState);

    if (response) {
      const newMessage: EcaMessage = {
        id: Date.now().toString(),
        role: 'eca',
        content: response.content,
        timestamp: new Date(),
        hint: response.hint,
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, newMessage]);
      if (response.hint) {
        toast.info("New hint available");
      }
    }
  };

  const handleAdvanceStage = () => {
    if (!branchingCase) return;

    // Finalize trace for current stage
    const currentStage = branchingCase.stages[currentStageIndex];
    const trace = digitalTraceCollector.finalizeStage({
      stage: currentStage,
      decisionsMade: decisionsLog.map(d => d.decision.id)
    });

    // Route feedback (updates Learner Model)
    // Note: trace can be null if collector wasn't started, handle safely
    if (trace && sessionId) {
      feedbackRouter.routeToSimulation(
        { id: 'stage-complete', type: 'summative', content: 'Stage completed', timestamp: Date.now() },
        trace,
        sessionId,
        currentStage.id
      );
    }

    if (currentStageIndex < branchingCase.stages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      const nextStage = branchingCase.stages[currentStageIndex + 1];

      // Start tracking next stage
      digitalTraceCollector.startStage(nextStage.id);

      if (nextStage.criticalWindow) {
        setTimeRemaining(nextStage.criticalWindow);
      }
      setStageStartTime(Date.now());
      toast.success(`Advancing to Stage ${currentStageIndex + 2}`);

      // ECA Stage Transition Message
      setMessages(prev => [...prev, {
        id: `stage-${currentStageIndex + 2}`,
        role: 'eca',
        content: `**Stage ${currentStageIndex + 2}: ${nextStage.name}**\n\n${nextStage.description}`,
        timestamp: new Date()
      }]);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    digitalTraceCollector.finalizeStage();
    toast.success("Simulation Completed!");
    navigate(`/simulation/${caseId}/results`, {
      state: {
        branchingCase,
        decisionsLog,
        totalCost,
        patientState,
        revealedInfo,
        startTime: stageStartTime,
        sessionId,
      }
    });
  };

  if (!branchingCase || !patientState) return null;

  const currentStage = branchingCase.stages[currentStageIndex];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-foreground">
      {/* 1. HUD / Header */}
      <SimulationHeader
        branchingCase={branchingCase}
        currentStageIndex={currentStageIndex}
        timeRemaining={timeRemaining}
        totalCost={totalCost}
        whatIfCount={3} // Mock
        exploredCount={1} // Mock
        onShowWhatIf={() => setShowWhatIf(true)}
      />

      {/* 2. Immersive Workspace (Grid) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">

        {/* Left: Patient Monitor (Glass Panel) */}
        <div className="lg:col-span-3 h-full min-h-0 overflow-hidden">
          <SimulationSidebar
            patientState={patientState}
            revealedInfo={revealedInfo}
            warningHistory={warningHistory}
          />
        </div>

        {/* Center: Decision Control (Main Stage) */}
        <div className="lg:col-span-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          <DecisionPanel
            branchingCase={branchingCase}
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            decisionsLog={decisionsLog}
            currentWarning={currentWarning}
            onDecision={handleDecision}
            onAdvanceStage={handleAdvanceStage}
            onComplete={handleComplete}
            onProceedWithWarning={() => {
              proceedWithWarning();
              toast("Proceeding with caution...");
            }}
            onChooseAlternative={(id) => console.log("Alt:", id)}
          />
        </div>

        {/* Right: ECA Tutor (Chat) - Embedded Mode */}
        <div className="lg:col-span-3 h-full min-h-0 overflow-hidden flex flex-col">
          <EcaChatPanel
            isOpen={true}
            onOpenChange={() => { }}
            messages={messages}
            isTyping={false}
            mode="embedded"
            currentStage={currentStage.name}
            onSendMessage={(text) => {
              // User message
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'learner',
                content: text,
                timestamp: new Date()
              }]);
              // Mock AI response for chat interaction
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  role: 'eca',
                  content: "I'm processing your question. In this simulation, focus on the patient's vitals and the available diagnostic tests.",
                  timestamp: new Date()
                }]);
              }, 1000);
            }}
          />
        </div>
      </main>

      {/* Overlays */}
      <WhatIfPanel
        isOpen={showWhatIf}
        onClose={() => setShowWhatIf(false)}
        branchingCase={branchingCase}
        currentStageId={currentStage.id}
      />
    </div>
  );
}
