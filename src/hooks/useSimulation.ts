import { useState, useCallback, useRef, useEffect } from 'react';
import { BranchingCase, SimulationSession, PatientState, SimulationDecision } from '@/types/simulation';

interface UseSimulationReturn {
  // Session state
  session: SimulationSession | null;
  currentStage: string;
  patientState: PatientState;
  timeRemaining: number | null;
  totalCost: number;
  decisionsLog: { decision: SimulationDecision; timestamp: Date; stageId: string }[];
  revealedInfo: string[];
  
  // Actions
  startSimulation: (branchingCase: BranchingCase) => void;
  makeDecision: (decision: SimulationDecision) => void;
  advanceStage: () => void;
  endSimulation: () => void;
  resetSimulation: () => void;
  
  // Status
  isActive: boolean;
  isCompleted: boolean;
  outcome: string | null;
  feedbackMessage: string | null;
}

export function useSimulation(branchingCase: BranchingCase | null): UseSimulationReturn {
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [patientState, setPatientState] = useState<PatientState>(
    branchingCase?.initialPatientState || {
      status: 'stable',
      vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
      symptoms: [],
      timeElapsed: 0,
    }
  );
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [decisionsLog, setDecisionsLog] = useState<{ decision: SimulationDecision; timestamp: Date; stageId: string }[]>([]);
  const [revealedInfo, setRevealedInfo] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const criticalWindowRef = useRef<NodeJS.Timeout | null>(null);

  const currentStage = branchingCase?.stages[currentStageIndex];

  // Start timer
  useEffect(() => {
    if (!session || !branchingCase?.hasTimeLimit || isCompleted) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Time's up - trigger worst outcome
          setIsCompleted(true);
          setOutcome('timeout');
          setFeedbackMessage('Time ran out! In medical emergencies, delayed action can have serious consequences.');
          return 0;
        }
        return prev - 1;
      });
      
      setPatientState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session, branchingCase?.hasTimeLimit, isCompleted]);

  // Critical window monitoring
  useEffect(() => {
    if (!currentStage?.criticalWindow || isCompleted) {
      return;
    }

    criticalWindowRef.current = setTimeout(() => {
      // Patient deteriorates if critical action not taken
      setPatientState((prev) => ({
        ...prev,
        status: 'critical',
      }));
    }, currentStage.criticalWindow * 1000);

    return () => {
      if (criticalWindowRef.current) {
        clearTimeout(criticalWindowRef.current);
      }
    };
  }, [currentStage, isCompleted]);

  const startSimulation = useCallback((caseData: BranchingCase) => {
    setSession({
      caseId: caseData.id,
      startedAt: new Date(),
      currentStageId: caseData.stages[0]?.id || '',
      decisionsMade: [],
      patientState: caseData.initialPatientState,
      totalCost: 0,
    });
    setCurrentStageIndex(0);
    setPatientState(caseData.initialPatientState);
    setTimeRemaining(caseData.hasTimeLimit ? caseData.timeLimitSeconds || 600 : null);
    setTotalCost(0);
    setDecisionsLog([]);
    setRevealedInfo([]);
    setIsCompleted(false);
    setOutcome(null);
    setFeedbackMessage(null);
  }, []);

  const makeDecision = useCallback((decision: SimulationDecision) => {
    if (!branchingCase || isCompleted) return;

    // Add to log
    setDecisionsLog((prev) => [
      ...prev,
      { decision, timestamp: new Date(), stageId: currentStage?.id || '' },
    ]);

    // Update cost
    setTotalCost((prev) => prev + decision.cost);

    // Apply consequences
    if (decision.consequences.patientStateChange) {
      setPatientState((prev) => ({
        ...prev,
        ...decision.consequences.patientStateChange,
        vitalSigns: {
          ...prev.vitalSigns,
          ...decision.consequences.patientStateChange.vitalSigns,
        },
        symptoms: decision.consequences.patientStateChange.symptoms || prev.symptoms,
      }));
    }

    // Reveal new information (avoid duplicates)
    if (decision.consequences.newInformationRevealed) {
      setRevealedInfo((prev) => {
        const newInfo = decision.consequences.newInformationRevealed!;
        // Check if this info already exists (to avoid duplicates)
        if (prev.includes(newInfo)) {
          return prev;
        }
        return [...prev, newInfo];
      });
    }

    // Check for branch trigger
    if (decision.consequences.triggersBranch) {
      const branch = branchingCase.branches.find(
        (b) => b.id === decision.consequences.triggersBranch
      );
      if (branch) {
        if (branch.patientOutcome === 'critical' || branch.patientOutcome === 'poor') {
          setIsCompleted(true);
          setOutcome(branch.id);
          setFeedbackMessage(branch.feedbackMessage);
        } else if (branch.patientOutcome === 'good') {
          // Good outcome - continue but mark progress (avoid duplicates)
          setRevealedInfo((prev) => {
            const successMsg = `✓ ${branch.description}`;
            if (prev.includes(successMsg)) {
              return prev;
            }
            return [...prev, successMsg];
          });
        }
      }
    }

    // Add simulated time
    setPatientState((prev) => ({
      ...prev,
      timeElapsed: prev.timeElapsed + decision.timeRequired,
    }));
    
    if (branchingCase.hasTimeLimit) {
      setTimeRemaining((prev) => (prev !== null ? Math.max(0, prev - decision.timeRequired) : null));
    }

    // Clear critical window timer if appropriate action taken
    if (criticalWindowRef.current) {
      clearTimeout(criticalWindowRef.current);
    }
  }, [branchingCase, currentStage, isCompleted]);

  const advanceStage = useCallback(() => {
    if (!branchingCase || isCompleted) return;

    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= branchingCase.stages.length) {
      // Simulation complete - determine outcome
      const decisionIds = decisionsLog.map((d) => d.decision.id);
      const optimalDecisions = branchingCase.optimalPath.decisions;
      const matchCount = optimalDecisions.filter((id) => decisionIds.includes(id)).length;
      const matchPercent = matchCount / optimalDecisions.length;

      let finalBranch;
      if (matchPercent >= 0.8) {
        finalBranch = branchingCase.branches.find((b) => b.patientOutcome === 'good');
      } else if (matchPercent >= 0.5) {
        finalBranch = branchingCase.branches.find((b) => b.patientOutcome === 'neutral');
      } else {
        finalBranch = branchingCase.branches.find((b) => b.patientOutcome === 'poor');
      }

      setIsCompleted(true);
      setOutcome(finalBranch?.id || 'complete');
      setFeedbackMessage(finalBranch?.feedbackMessage || 'Simulation complete.');
    } else {
      setCurrentStageIndex(nextIndex);
      setSession((prev) =>
        prev ? { ...prev, currentStageId: branchingCase.stages[nextIndex].id } : null
      );
    }
  }, [branchingCase, currentStageIndex, decisionsLog, isCompleted]);

  const endSimulation = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, completedAt: new Date() } : null));
    setIsCompleted(true);
    
    if (!outcome) {
      // Calculate outcome based on decisions made
      const branch = branchingCase?.branches.find((b) => b.patientOutcome === 'neutral');
      setOutcome(branch?.id || 'ended');
      setFeedbackMessage(branch?.feedbackMessage || 'Simulation ended early.');
    }
  }, [branchingCase, outcome]);

  const resetSimulation = useCallback(() => {
    setSession(null);
    setCurrentStageIndex(0);
    setPatientState(
      branchingCase?.initialPatientState || {
        status: 'stable',
        vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
        symptoms: [],
        timeElapsed: 0,
      }
    );
    setTimeRemaining(null);
    setTotalCost(0);
    setDecisionsLog([]);
    setRevealedInfo([]);
    setIsCompleted(false);
    setOutcome(null);
    setFeedbackMessage(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (criticalWindowRef.current) {
      clearTimeout(criticalWindowRef.current);
    }
  }, [branchingCase]);

  return {
    session,
    currentStage: currentStage?.id || '',
    patientState,
    timeRemaining,
    totalCost,
    decisionsLog,
    revealedInfo,
    startSimulation,
    makeDecision,
    advanceStage,
    endSimulation,
    resetSimulation,
    isActive: session !== null && !isCompleted,
    isCompleted,
    outcome,
    feedbackMessage,
  };
}
