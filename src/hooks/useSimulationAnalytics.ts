/**
 * Simulation Analytics Hook
 * 
 * Main hook composing useSimulationTimer and useSimulationLogger
 * for a clean separation of concerns. Manages simulation state,
 * decision processing, and stage progression.
 * 
 * Refactored from 611 lines → ~280 lines by extracting:
 * - Timer logic → useSimulationTimer.ts
 * - Analytics logging → useSimulationLogger.ts
 */

import { useState, useCallback, useRef } from 'react';
import { BranchingCase, SimulationSession as SimulationState, PatientState, SimulationDecision } from '@/types/simulation';
import { useSimulationTimer } from './useSimulationTimer';
import { useSimulationLogger } from './useSimulationLogger';

interface UseSimulationReturn {
  // Session state
  session: SimulationState | null;
  sessionId: string | null;
  currentStage: string;
  patientState: PatientState;
  timeRemaining: number | null;
  totalCost: number;
  decisionsLog: { decision: SimulationDecision; timestamp: Date; stageId: string; timeSpent: number }[];
  revealedInfo: string[];

  // Actions
  startSimulation: (branchingCase: BranchingCase) => Promise<void>;
  makeDecision: (decision: SimulationDecision) => void;
  advanceStage: () => void;
  endSimulation: () => Promise<void>;
  resetSimulation: () => void;
  trackWhatIfExploration: (scenarioId: string) => void;

  // Status
  isActive: boolean;
  isCompleted: boolean;
  outcome: string | null;
  feedbackMessage: string | null;
}

const DEFAULT_PATIENT_STATE: PatientState = {
  status: 'stable',
  vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
  symptoms: [],
  timeElapsed: 0,
};

export function useSimulationAnalytics(branchingCase: BranchingCase | null): UseSimulationReturn {
  return useSimulation(branchingCase);
}

export function useSimulation(branchingCase: BranchingCase | null): UseSimulationReturn {
  // Core state
  const [session, setSession] = useState<SimulationState | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [patientState, setPatientState] = useState<PatientState>(
    branchingCase?.initialPatientState || DEFAULT_PATIENT_STATE
  );
  const [totalCost, setTotalCost] = useState(0);
  const [decisionsLog, setDecisionsLog] = useState<{ decision: SimulationDecision; timestamp: Date; stageId: string; timeSpent: number }[]>([]);
  const [revealedInfo, setRevealedInfo] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Refs for analytics counters
  const criticalErrors = useRef(0);
  const warningsIgnored = useRef(0);
  const whatIfExplored = useRef(0);

  const currentStage = branchingCase?.stages[currentStageIndex];

  // Composed hooks
  const logger = useSimulationLogger(branchingCase?.id || '');

  const handleTimeout = useCallback(async () => {
    setIsCompleted(true);
    setOutcome('timeout');
    setFeedbackMessage('Time ran out! In medical emergencies, delayed action can have serious consequences.');

    logger.logEvent(dbSessionId, 'simulation_completed', currentStage?.id || '', patientState.timeElapsed, {
      outcome: 'timeout',
      was_optimal: false,
    });

    if (dbSessionId && branchingCase) {
      await logger.completeSession(dbSessionId, branchingCase, {
        totalCost,
        timeElapsed: patientState.timeElapsed,
        stagesCompleted: currentStageIndex + 1,
        decisionsLog,
        criticalErrors: criticalErrors.current,
        warningsIgnored: warningsIgnored.current,
        outcome: 'timeout',
        patientStatus: patientState.status,
        whatIfExplored: whatIfExplored.current,
      });
    }
  }, [dbSessionId, branchingCase, currentStage, patientState, totalCost, decisionsLog, currentStageIndex, logger]);

  const timer = useSimulationTimer({
    hasTimeLimit: branchingCase?.hasTimeLimit ?? false,
    timeLimitSeconds: branchingCase?.timeLimitSeconds ?? null,
    isActive: session !== null && !isCompleted,
    isCompleted,
    currentStage,
    onTimeout: handleTimeout,
  });

  // ============================================
  // Actions
  // ============================================

  const startSimulation = useCallback(async (caseData: BranchingCase) => {
    const newSessionId = await logger.createSession(caseData);
    setDbSessionId(newSessionId);

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
    setTotalCost(0);
    setDecisionsLog([]);
    setRevealedInfo([]);
    setIsCompleted(false);
    setOutcome(null);
    setFeedbackMessage(null);

    criticalErrors.current = 0;
    warningsIgnored.current = 0;
    whatIfExplored.current = 0;

    timer.resetTimer(caseData.hasTimeLimit ? caseData.timeLimitSeconds || 600 : null);
    logger.resetDecisionTimer();

    // Log start events
    logger.logEvent(newSessionId, 'stage_advanced', caseData.stages[0]?.id || '', 0, {
      patient_state_snapshot: caseData.initialPatientState,
      was_optimal: true,
    });

    await logger.startLocalTracking(caseData);
  }, [logger, timer]);

  const makeDecision = useCallback((decision: SimulationDecision) => {
    if (!branchingCase || isCompleted) return;

    const timeSpent = logger.getDecisionTime();

    // Add to log
    setDecisionsLog((prev) => [
      ...prev,
      { decision, timestamp: new Date(), stageId: currentStage?.id || '', timeSpent },
    ]);

    // Update cost
    setTotalCost((prev) => prev + decision.cost);

    // Apply consequences
    if (decision.consequences.patientStateChange) {
      setPatientState((prev) => {
        const newState = {
          ...prev,
          ...decision.consequences.patientStateChange,
          vitalSigns: {
            ...prev.vitalSigns,
            ...decision.consequences.patientStateChange.vitalSigns,
          },
          symptoms: decision.consequences.patientStateChange.symptoms || prev.symptoms,
        };

        logger.logEvent(dbSessionId, 'patient_state_changed', currentStage?.id || '', prev.timeElapsed + decision.timeRequired, {
          previousStatus: prev.status,
          newStatus: newState.status,
          patient_state_snapshot: newState,
          decision_id: decision.id,
        });

        return newState;
      });
    }

    // Reveal new information
    if (decision.consequences.newInformationRevealed) {
      setRevealedInfo((prev) => [...prev, decision.consequences.newInformationRevealed!]);
      logger.logEvent(dbSessionId, 'info_revealed', currentStage?.id || '', patientState.timeElapsed + decision.timeRequired, {
        info: decision.consequences.newInformationRevealed,
        decision_id: decision.id,
      });
    }

    // Check for branch trigger
    if (decision.consequences.triggersBranch) {
      const branch = branchingCase.branches.find((b) => b.id === decision.consequences.triggersBranch);
      if (branch) {
        if (branch.patientOutcome === 'critical' || branch.patientOutcome === 'poor') {
          criticalErrors.current += 1;
          setIsCompleted(true);
          setOutcome(branch.id);
          setFeedbackMessage(branch.feedbackMessage);

          logger.logEvent(dbSessionId, 'branch_triggered', currentStage?.id || '', patientState.timeElapsed + decision.timeRequired, {
            branchId: branch.id,
            outcome: branch.patientOutcome,
            was_optimal: false,
            deviation_from_optimal: 100,
            decision_id: decision.id,
          });
        } else if (branch.patientOutcome === 'good' || branch.patientOutcome === 'neutral') {
          setRevealedInfo((prev) => [...prev, `✓ ${branch.description}`]);
        }
      }
    }

    // Add simulated time
    setPatientState((prev) => ({
      ...prev,
      timeElapsed: prev.timeElapsed + decision.timeRequired,
    }));

    timer.deductTime(decision.timeRequired);
    timer.clearTimers(); // Clear critical window

    // Log decision
    logger.logDecision(
      dbSessionId, decision, currentStage?.id || '', patientState.timeElapsed,
      timeSpent, patientState, decisionsLog, totalCost, currentStageIndex,
      criticalErrors.current, warningsIgnored.current,
      branchingCase.optimalPath?.decisions || [],
    );

    logger.resetDecisionTimer();
  }, [branchingCase, currentStage, isCompleted, dbSessionId, patientState, decisionsLog, totalCost, currentStageIndex, logger, timer]);

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

      logger.logEvent(dbSessionId, 'stage_advanced', branchingCase.stages[nextIndex].id, patientState.timeElapsed, {
        stageIndex: nextIndex,
        stageName: branchingCase.stages[nextIndex].name,
      });
    }
  }, [branchingCase, currentStageIndex, decisionsLog, isCompleted, dbSessionId, patientState, logger]);

  const endSimulation = useCallback(async () => {
    setSession((prev) => (prev ? { ...prev, completedAt: new Date() } : null));
    setIsCompleted(true);

    if (!outcome) {
      const branch = branchingCase?.branches.find((b) => b.patientOutcome === 'neutral');
      setOutcome(branch?.id || 'ended');
      setFeedbackMessage(branch?.feedbackMessage || 'Simulation ended early.');
    }

    if (branchingCase) {
      await logger.completeSession(dbSessionId, branchingCase, {
        totalCost,
        timeElapsed: patientState.timeElapsed,
        stagesCompleted: currentStageIndex + 1,
        decisionsLog,
        criticalErrors: criticalErrors.current,
        warningsIgnored: warningsIgnored.current,
        outcome: outcome || 'ended',
        patientStatus: patientState.status,
        whatIfExplored: whatIfExplored.current,
      });
    }
  }, [dbSessionId, branchingCase, outcome, totalCost, decisionsLog, patientState, currentStageIndex, logger]);

  const resetSimulation = useCallback(async () => {
    await logger.abandonSession(dbSessionId, currentStage?.id || '', {
      totalCost,
      timeElapsed: patientState.timeElapsed,
      stagesCompleted: currentStageIndex + 1,
      decisionsLog,
      criticalErrors: criticalErrors.current,
      warningsIgnored: warningsIgnored.current,
      outcome,
      patientStatus: patientState.status,
      whatIfExplored: whatIfExplored.current,
    });

    setSession(null);
    setDbSessionId(null);
    setCurrentStageIndex(0);
    setPatientState(branchingCase?.initialPatientState || DEFAULT_PATIENT_STATE);
    setTotalCost(0);
    setDecisionsLog([]);
    setRevealedInfo([]);
    setIsCompleted(false);
    setOutcome(null);
    setFeedbackMessage(null);

    timer.clearTimers();
  }, [branchingCase, dbSessionId, isCompleted, currentStage, patientState, decisionsLog, currentStageIndex, outcome, totalCost, logger, timer]);

  const trackWhatIfExploration = useCallback((scenarioId: string) => {
    whatIfExplored.current += 1;
    logger.logWhatIfExploration(dbSessionId, scenarioId, currentStage?.id || '', patientState.timeElapsed, whatIfExplored.current);
  }, [dbSessionId, currentStage, patientState.timeElapsed, logger]);

  return {
    session,
    sessionId: dbSessionId,
    currentStage: currentStage?.id || '',
    patientState,
    timeRemaining: timer.timeRemaining,
    totalCost,
    decisionsLog,
    revealedInfo,
    startSimulation,
    makeDecision,
    advanceStage,
    endSimulation,
    resetSimulation,
    trackWhatIfExploration,
    isActive: session !== null && !isCompleted,
    isCompleted,
    outcome,
    feedbackMessage,
  };
}
