/**
 * Simulation Analytics Logger Hook
 * 
 * Encapsulates all simulation analytics logging to both Supabase and localStorage.
 * Extracted from useSimulationAnalytics to separate concerns.
 */

import { useCallback, useRef } from 'react';
import type { SimulationDecision, PatientState, BranchingCase } from '@/types/simulation';
import {
    createSimulationSession,
    completeSimulationSession,
    abandonSimulationSession,
    logAnalyticsEvent,
    forceFlushAnalytics,
    calculateOptimalPathDeviation,
    calculateLearningObjectivesAchieved,
} from '@/services/analyticsService';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAnalytics } from './useLocalAnalytics';

interface DecisionLogEntry {
    decision: SimulationDecision;
    timestamp: Date;
    stageId: string;
    timeSpent: number;
}

interface SessionCompletionData {
    totalCost: number;
    timeElapsed: number;
    stagesCompleted: number;
    decisionsLog: DecisionLogEntry[];
    criticalErrors: number;
    warningsIgnored: number;
    outcome: string | null;
    patientStatus: string;
    whatIfExplored: number;
}

export interface UseSimulationLoggerReturn {
    /** Create a new DB session, returns session ID */
    createSession: (caseData: BranchingCase) => Promise<string | null>;
    /** Log a decision event to both Supabase and localStorage */
    logDecision: (
        dbSessionId: string | null,
        decision: SimulationDecision,
        stageId: string,
        timeElapsed: number,
        timeSpent: number,
        patientState: PatientState,
        decisionsLog: DecisionLogEntry[],
        totalCost: number,
        currentStageIndex: number,
        criticalErrors: number,
        warningsIgnored: number,
        optimalDecisions: string[],
    ) => void;
    /** Log an analytics event (generic) */
    logEvent: (
        dbSessionId: string | null,
        eventType: string,
        stageId: string,
        timeElapsed: number,
        data: Record<string, unknown>,
    ) => void;
    /** Log what-if scenario exploration */
    logWhatIfExploration: (
        dbSessionId: string | null,
        scenarioId: string,
        stageId: string,
        timeElapsed: number,
        totalExplored: number,
    ) => void;
    /** Complete the session with final analytics */
    completeSession: (
        dbSessionId: string | null,
        branchingCase: BranchingCase,
        data: SessionCompletionData,
    ) => Promise<void>;
    /** Mark session as abandoned */
    abandonSession: (
        dbSessionId: string | null,
        stageId: string,
        data: SessionCompletionData,
    ) => Promise<void>;
    /** Start tracking in local analytics */
    startLocalTracking: (caseData: BranchingCase) => Promise<void>;
    /** Decision timer management */
    resetDecisionTimer: () => void;
    getDecisionTime: () => number;
}

export function useSimulationLogger(caseId: string): UseSimulationLoggerReturn {
    const { user } = useAuth();
    const decisionStartTime = useRef<number>(0);

    const localAnalytics = useLocalAnalytics({
        caseType: 'simulation',
        caseId,
        userId: user?.id || '',
        enableRealTimeTracking: true,
        batchEvents: true,
    });

    const createSession = useCallback(async (caseData: BranchingCase): Promise<string | null> => {
        if (!user) return null;
        return createSimulationSession(user.id, caseData);
    }, [user]);

    const logDecision = useCallback((
        dbSessionId: string | null,
        decision: SimulationDecision,
        stageId: string,
        timeElapsed: number,
        timeSpent: number,
        patientState: PatientState,
        decisionsLog: DecisionLogEntry[],
        totalCost: number,
        currentStageIndex: number,
        criticalErrors: number,
        warningsIgnored: number,
        optimalDecisions: string[],
    ) => {
        const isOptimal = optimalDecisions.includes(decision.id);

        // Log to Supabase
        if (dbSessionId && user) {
            const decisionIds = decisionsLog.map(d => d.decision.id);
            const optimalIndex = optimalDecisions.indexOf(decision.id);
            const actualIndex = decisionIds.length;
            const deviation = Math.abs(optimalIndex - actualIndex);

            logAnalyticsEvent(dbSessionId, user.id, {
                event_type: 'decision_made',
                stage_id: stageId,
                decision_id: decision.id,
                decision_type: decision.type,
                time_elapsed_seconds: timeElapsed,
                was_optimal: isOptimal,
                deviation_from_optimal: deviation,
                decision_time_seconds: timeSpent,
                patient_state_snapshot: patientState,
                event_data: {
                    decisionLabel: decision.label,
                    cost: decision.cost,
                    timeRequired: decision.timeRequired,
                },
            });
        }

        // Log to localStorage
        localAnalytics.logDecision(decision.id, undefined, isOptimal);
        localAnalytics.updateMetrics({ total_cost: totalCost + decision.cost });
        localAnalytics.updateTypeSpecificMetrics({
            stages_completed: currentStageIndex + 1,
            critical_errors: criticalErrors,
            warnings_ignored: warningsIgnored,
        });
    }, [user, localAnalytics]);

    const logEvent = useCallback((
        dbSessionId: string | null,
        eventType: string,
        stageId: string,
        timeElapsed: number,
        data: Record<string, unknown>,
    ) => {
        if (dbSessionId && user) {
            logAnalyticsEvent(dbSessionId, user.id, {
                event_type: eventType,
                stage_id: stageId,
                time_elapsed_seconds: timeElapsed,
                was_optimal: (data.was_optimal as boolean | null) ?? null,
                deviation_from_optimal: (data.deviation_from_optimal as number | undefined),
                event_data: data,
            });
        }
    }, [user]);

    const logWhatIfExploration = useCallback((
        dbSessionId: string | null,
        scenarioId: string,
        stageId: string,
        timeElapsed: number,
        totalExplored: number,
    ) => {
        localAnalytics.logEvent('whatif_explored', { scenarioId });
        localAnalytics.updateTypeSpecificMetrics({ whatif_scenarios_explored: totalExplored });

        if (dbSessionId && user) {
            logAnalyticsEvent(dbSessionId, user.id, {
                event_type: 'whatif_explored',
                stage_id: stageId,
                time_elapsed_seconds: timeElapsed,
                was_optimal: null,
                event_data: { scenarioId },
            });
        }
    }, [user, localAnalytics]);

    const completeSession = useCallback(async (
        dbSessionId: string | null,
        branchingCase: BranchingCase,
        data: SessionCompletionData,
    ) => {
        const decisionIds = data.decisionsLog.map((d) => d.decision.id);
        const optimalDeviation = calculateOptimalPathDeviation(
            decisionIds,
            branchingCase.optimalPath?.decisions || []
        );
        const objectivesAchieved = calculateLearningObjectivesAchieved(
            data.decisionsLog.map(d => ({ decisionId: d.decision.id })),
            branchingCase
        );

        if (dbSessionId && user) {
            await completeSimulationSession(dbSessionId, {
                totalCost: data.totalCost,
                totalDuration: data.timeElapsed,
                stagesCompleted: data.stagesCompleted,
                decisionsMade: data.decisionsLog.length,
                criticalErrors: data.criticalErrors,
                warningsIgnored: data.warningsIgnored,
                optimalPathDeviation: optimalDeviation,
                learningObjectivesAchieved: objectivesAchieved,
                biasesDetected: [],
                decisionPath: data.decisionsLog.map(d => ({
                    decisionId: d.decision.id,
                    decisionLabel: d.decision.label,
                    stageId: d.stageId,
                    timestamp: d.timestamp.toISOString(),
                    timeElapsed: d.timeSpent,
                    cost: d.decision.cost,
                })),
            });

            logAnalyticsEvent(dbSessionId, user.id, {
                event_type: 'simulation_completed',
                stage_id: '',
                time_elapsed_seconds: data.timeElapsed,
                was_optimal: optimalDeviation >= 80,
                deviation_from_optimal: 100 - optimalDeviation,
                event_data: {
                    outcome: data.outcome || 'ended',
                    totalCost: data.totalCost,
                    totalDecisions: data.decisionsLog.length,
                },
            });

            await forceFlushAnalytics();
        }

        // Track in localStorage
        await localAnalytics.completeCase({
            accuracy_score: optimalDeviation,
            total_cost: data.totalCost,
            type_specific_metrics: {
                stages_completed: data.stagesCompleted,
                optimal_path_deviation: optimalDeviation,
                critical_errors: data.criticalErrors,
                warnings_ignored: data.warningsIgnored,
                warnings_heeded: 0,
                patient_final_status: data.patientStatus,
                whatif_scenarios_explored: data.whatIfExplored,
            },
        });
    }, [user, localAnalytics]);

    const abandonSession = useCallback(async (
        dbSessionId: string | null,
        stageId: string,
        data: SessionCompletionData,
    ) => {
        if (dbSessionId && !data.outcome && user) {
            await abandonSimulationSession(dbSessionId);

            logAnalyticsEvent(dbSessionId, user.id, {
                event_type: 'simulation_abandoned',
                stage_id: stageId,
                time_elapsed_seconds: data.timeElapsed,
                was_optimal: false,
                event_data: {
                    decisionsMade: data.decisionsLog.length,
                    stagesCompleted: data.stagesCompleted,
                },
            });

            await forceFlushAnalytics();
        }

        if (localAnalytics.isTracking) {
            await localAnalytics.abandonCase('User reset simulation');
        }
    }, [user, localAnalytics]);

    const startLocalTracking = useCallback(async (caseData: BranchingCase) => {
        await localAnalytics.startCase({
            case_title: caseData.title,
            specialty: caseData.specialty,
            difficulty: caseData.difficulty,
        });
    }, [localAnalytics]);

    const resetDecisionTimer = useCallback(() => {
        decisionStartTime.current = Date.now();
    }, []);

    const getDecisionTime = useCallback(() => {
        return Math.floor((Date.now() - decisionStartTime.current) / 1000);
    }, []);

    return {
        createSession,
        logDecision,
        logEvent,
        logWhatIfExploration,
        completeSession,
        abandonSession,
        startLocalTracking,
        resetDecisionTimer,
        getDecisionTime,
    };
}
