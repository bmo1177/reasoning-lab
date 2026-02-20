import { useState, useCallback, useRef } from 'react';
import type {
  CaseType,
  CasePerformanceMetrics,
  LearningEvent,
  LearningEventType,
  CrossCaseRecommendation,
  CrossCasePerformanceSummary,
  UseCaseAnalyticsConfig,
  UseCaseAnalyticsReturn,
  ClinicalMetrics,
  SimulationMetrics,
  ErrorMetrics,
  UncertaintyMetrics,
} from '@/types/unifiedAnalytics';
import {
  savePerformanceMetric,
  updatePerformanceMetric,
  saveLearningEvent,
  saveLearningEvents,
  getUserCrossCasePerformance,
  getUserWeakestCaseType,
  calculateLearningVelocity,
  getUserRecommendations,
  getUserStats,
} from '@/services/localAnalyticsService';

// Event buffer for batching
let eventBuffer: Partial<LearningEvent>[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 2000; // 2 seconds (faster for demo)
const BUFFER_SIZE_LIMIT = 5;

/**
 * Client-side analytics hook using localStorage
 * Perfect for testing without database migrations
 * Drop-in replacement for useCaseAnalytics
 */
export function useLocalAnalytics(config: UseCaseAnalyticsConfig): UseCaseAnalyticsReturn {
  const { caseType, caseId, userId, enableRealTimeTracking = true, batchEvents = true } = config;
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<Partial<CasePerformanceMetrics>>({});
  
  const startTime = useRef<number>(0);
  const eventCount = useRef(0);
  const hintsUsed = useRef(0);
  const decisionsMade = useRef(0);
  const sessionEvents = useRef<Partial<LearningEvent>[]>([]);

  /**
   * Flush buffered events
   */
  const flushEvents = useCallback(async () => {
    if (eventBuffer.length === 0) return;
    
    const eventsToFlush = [...eventBuffer];
    eventBuffer = [];
    
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    
    // Save to localStorage
    saveLearningEvents(eventsToFlush);
    
    // Also add to session events for immediate feedback
    sessionEvents.current.push(...eventsToFlush);
  }, []);

  /**
   * Start a new case session
   */
  const startCase = useCallback(async (initialData?: Partial<CasePerformanceMetrics>) => {
    if (!userId) {
      console.warn('Cannot start case analytics: No user ID');
      return;
    }

    const newSessionId = crypto.randomUUID();
    startTime.current = Date.now();
    sessionEvents.current = [];
    
    const sessionData: Partial<CasePerformanceMetrics> = {
      id: newSessionId,
      user_id: userId,
      case_id: caseId,
      case_type: caseType,
      case_title: initialData?.case_title || null,
      specialty: initialData?.specialty || null,
      difficulty: initialData?.difficulty || null,
      started_at: new Date().toISOString(),
      completion_status: null,
      total_cost: 0,
      hints_used: 0,
      hints_available: initialData?.hints_available || 0,
      attempt_number: initialData?.attempt_number || 1,
      is_retry: initialData?.is_retry || false,
      decisions_made: 0,
      interactions_count: 0,
      type_specific_metrics: getDefaultMetrics(caseType),
      learning_objectives_achieved: [],
      cognitive_biases_detected: [],
      ...initialData,
    };

    // Save to localStorage
    savePerformanceMetric(sessionData);

    setSessionId(newSessionId);
    setIsTracking(true);
    setCurrentMetrics(sessionData);

    // Log case started event
    const startEvent: Partial<LearningEvent> = {
      user_id: userId,
      session_id: newSessionId,
      case_type: caseType,
      case_id: caseId,
      event_type: 'case_started',
      timestamp: sessionData.started_at,
      time_elapsed_seconds: 0,
      event_data: {
        case_title: sessionData.case_title,
        difficulty: sessionData.difficulty,
      },
    };
    
    eventBuffer.push(startEvent);
    await flushEvents();
    
    console.log('📊 Analytics: Case started', { sessionId: newSessionId, caseType, caseId });
  }, [caseType, caseId, userId, flushEvents]);

  /**
   * Complete a case session
   */
  const completeCase = useCallback(async (finalData: Partial<CasePerformanceMetrics>) => {
    if (!sessionId || !userId) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime.current) / 1000);

    const completionData: Partial<CasePerformanceMetrics> = {
      completed_at: new Date().toISOString(),
      completion_status: 'completed',
      total_duration_seconds: duration,
      time_spent_on_decisions: currentMetrics.time_spent_on_decisions || 0,
      total_cost: currentMetrics.total_cost || 0,
      hints_used: hintsUsed.current,
      decisions_made: decisionsMade.current,
      interactions_count: eventCount.current,
      ...finalData,
    };

    // Update localStorage
    updatePerformanceMetric(sessionId, completionData);

    // Log completion event
    const completeEvent: Partial<LearningEvent> = {
      user_id: userId,
      session_id: sessionId,
      case_type: caseType,
      case_id: caseId,
      event_type: 'case_completed',
      timestamp: completionData.completed_at,
      time_elapsed_seconds: duration,
      was_correct: (completionData.accuracy_score || 0) > 70,
      event_data: {
        duration_seconds: duration,
        accuracy_score: completionData.accuracy_score,
        total_cost: completionData.total_cost,
      },
    };
    
    eventBuffer.push(completeEvent);
    await flushEvents();

    setCurrentMetrics(prev => ({ ...prev, ...completionData }));
    setIsTracking(false);
    
    console.log('📊 Analytics: Case completed', { sessionId, duration, accuracy: completionData.accuracy_score });
  }, [sessionId, userId, currentMetrics, caseType, caseId, flushEvents]);

  /**
   * Abandon a case session
   */
  const abandonCase = useCallback(async (reason?: string) => {
    if (!sessionId || !userId) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime.current) / 1000);

    const abandonmentData = {
      completed_at: new Date().toISOString(),
      completion_status: 'abandoned' as const,
      total_duration_seconds: duration,
    };

    updatePerformanceMetric(sessionId, abandonmentData);

    const abandonEvent: Partial<LearningEvent> = {
      user_id: userId,
      session_id: sessionId,
      case_type: caseType,
      case_id: caseId,
      event_type: 'case_abandoned',
      timestamp: abandonmentData.completed_at,
      time_elapsed_seconds: duration,
      event_data: { reason },
    };
    
    eventBuffer.push(abandonEvent);
    await flushEvents();

    setIsTracking(false);
    
    console.log('📊 Analytics: Case abandoned', { sessionId, reason });
  }, [sessionId, userId, caseType, caseId, flushEvents]);

  /**
   * Log a learning event
   */
  const logEvent = useCallback(async (eventType: LearningEventType, eventData?: Record<string, unknown>) => {
    if (!enableRealTimeTracking) return;

    const timeElapsed = Math.floor((Date.now() - startTime.current) / 1000);
    
    const event: Partial<LearningEvent> = {
      user_id: userId,
      session_id: sessionId,
      case_type: caseType,
      case_id: caseId,
      event_type: eventType,
      event_data: eventData || {},
      time_elapsed_seconds: timeElapsed,
      timestamp: new Date().toISOString(),
    };

    eventCount.current++;
    
    // Add to session events immediately
    sessionEvents.current.push(event);

    if (batchEvents) {
      eventBuffer.push(event);
      
      if (eventBuffer.length >= BUFFER_SIZE_LIMIT) {
        await flushEvents();
      } else if (!flushTimeout) {
        flushTimeout = setTimeout(flushEvents, FLUSH_INTERVAL);
      }
    } else {
      saveLearningEvent(event);
    }
  }, [caseType, caseId, userId, sessionId, enableRealTimeTracking, batchEvents, flushEvents]);

  /**
   * Log a decision
   */
  const logDecision = useCallback(async (decisionId: string, wasCorrect?: boolean, wasOptimal?: boolean) => {
    decisionsMade.current++;
    
    await logEvent('decision_made', {
      decision_id: decisionId,
      was_correct: wasCorrect,
      was_optimal: wasOptimal,
      decision_number: decisionsMade.current,
    });

    setCurrentMetrics(prev => ({
      ...prev,
      decisions_made: decisionsMade.current,
    }));
  }, [logEvent]);

  /**
   * Log hint usage
   */
  const logHintUsage = useCallback(async () => {
    hintsUsed.current++;
    await logEvent('hint_requested');
    
    setCurrentMetrics(prev => ({
      ...prev,
      hints_used: hintsUsed.current,
    }));
  }, [logEvent]);

  /**
   * Update current metrics
   */
  const updateMetrics = useCallback((updates: Partial<CasePerformanceMetrics>) => {
    setCurrentMetrics(prev => {
      const updated = { ...prev, ...updates };
      
      // Sync to localStorage in real-time
      if (sessionId && enableRealTimeTracking) {
        updatePerformanceMetric(sessionId, updates);
      }
      
      return updated;
    });
  }, [sessionId, enableRealTimeTracking]);

  /**
   * Update type-specific metrics
   */
  const updateTypeSpecificMetrics = useCallback((
    updates: Partial<ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics>
  ) => {
    setCurrentMetrics(prev => {
      const updated = {
        ...prev,
        type_specific_metrics: {
          ...prev.type_specific_metrics,
          ...updates,
        },
      };
      
      // Sync to localStorage
      if (sessionId) {
        updatePerformanceMetric(sessionId, { type_specific_metrics: updated.type_specific_metrics });
      }
      
      return updated;
    });
  }, [sessionId]);

  /**
   * Get user's performance across all case types
   */
  const getCrossCasePerformance = useCallback(async (): Promise<CrossCasePerformanceSummary[]> => {
    if (!userId) return [];
    return getUserCrossCasePerformance(userId);
  }, [userId]);

  /**
   * Get cross-case recommendations
   */
  const getRecommendations = useCallback(async (): Promise<CrossCaseRecommendation[]> => {
    if (!userId) return [];
    return getUserRecommendations(userId);
  }, [userId]);

  /**
   * Get user stats
   */
  const getStats = useCallback(() => {
    if (!userId) return null;
    return getUserStats(userId);
  }, [userId]);

  return {
    sessionId,
    isTracking,
    currentMetrics,
    startCase,
    completeCase,
    abandonCase,
    logEvent,
    logDecision,
    logHintUsage,
    updateMetrics,
    updateTypeSpecificMetrics,
    getCrossCasePerformance,
    getRecommendations,
    // Additional local-only methods
    getSessionEvents: () => sessionEvents.current,
    getStats,
  } as UseCaseAnalyticsReturn & { 
    getSessionEvents: () => Partial<LearningEvent>[],
    getStats: () => ReturnType<typeof getUserStats> | null,
  };
}

/**
 * Get default metrics for a case type
 */
function getDefaultMetrics(caseType: CaseType): ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics {
  switch (caseType) {
    case 'clinical':
      return {
        tests_ordered: 0,
        appropriate_tests_percentage: 0,
        time_to_diagnosis: null,
        correct_diagnosis: null,
        reasoning_map_accuracy: null,
        test_ordering_efficiency: null,
        socratic_prompts_used: 0,
      } as ClinicalMetrics;
    
    case 'simulation':
      return {
        stages_completed: 0,
        optimal_path_deviation: null,
        critical_errors: 0,
        warnings_heeded: 0,
        warnings_ignored: 0,
        patient_final_status: null,
        whatif_scenarios_explored: 0,
      } as SimulationMetrics;
    
    case 'error':
      return {
        biases_correctly_identified: 0,
        biases_missed: 0,
        red_flags_detected: 0,
        red_flags_missed: 0,
        correct_diagnosis_identified: false,
        reflection_quality_score: null,
      } as ErrorMetrics;
    
    case 'uncertainty':
      return {
        probabilities_assigned: 0,
        calibration_score: null,
        brier_score: null,
        overconfidence_instances: 0,
        underconfidence_instances: 0,
        bayesian_updates_correct: 0,
      } as UncertaintyMetrics;
    
    default:
      return {} as ClinicalMetrics;
  }
}

// Cleanup on app unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventBuffer.length > 0) {
      saveLearningEvents(eventBuffer);
    }
  });
}
