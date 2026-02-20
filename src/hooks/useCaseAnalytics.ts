import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

// Generate UUID using native crypto
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Event buffer for batching
let eventBuffer: Partial<LearningEvent>[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 5000; // 5 seconds
const BUFFER_SIZE_LIMIT = 10;

/**
 * Unified analytics hook that works across ALL case types
 * Tracks performance, logs events, and enables cross-case recommendations
 */
export function useCaseAnalytics(config: UseCaseAnalyticsConfig): UseCaseAnalyticsReturn {
  const { caseType, caseId, userId, enableRealTimeTracking = true, batchEvents = true } = config;
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<Partial<CasePerformanceMetrics>>({});
  
  const startTime = useRef<number>(0);
  const eventCount = useRef(0);
  const hintsUsed = useRef(0);
  const decisionsMade = useRef(0);

  /**
   * Start a new case session
   */
  const startCase = useCallback(async (initialData?: Partial<CasePerformanceMetrics>) => {
    if (!userId) {
      console.warn('Cannot start case analytics: No user ID');
      return;
    }

    const newSessionId = generateUUID();
    startTime.current = Date.now();
    
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

    // Save to database
    const { error } = await supabase
      .from('case_performance_metrics' as any)
      .insert(sessionData as any);

    if (error) {
      console.error('Error starting case session:', error);
      return;
    }

    setSessionId(newSessionId);
    setIsTracking(true);
    setCurrentMetrics(sessionData);

    // Log case started event
    logEvent('case_started', {
      case_title: sessionData.case_title,
      difficulty: sessionData.difficulty,
    });
  }, [caseType, caseId, userId]);

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

    // Update database
    const { error } = await supabase
      .from('case_performance_metrics')
      .update(completionData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing case:', error);
      return;
    }

    // Log completion event
    logEvent('case_completed', {
      duration_seconds: duration,
      accuracy_score: completionData.accuracy_score,
      total_cost: completionData.total_cost,
    });

    // Flush any remaining events
    await flushEvents();

    setCurrentMetrics(prev => ({ ...prev, ...completionData }));
    setIsTracking(false);
  }, [sessionId, userId, currentMetrics]);

  /**
   * Abandon a case session
   */
  const abandonCase = useCallback(async (reason?: string) => {
    if (!sessionId || !userId) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime.current) / 1000);

    const abandonmentData = {
      completed_at: new Date().toISOString(),
      completion_status: 'abandoned',
      total_duration_seconds: duration,
    };

    await supabase
      .from('case_performance_metrics')
      .update(abandonmentData)
      .eq('id', sessionId);

    logEvent('case_abandoned', { reason });
    await flushEvents();

    setIsTracking(false);
  }, [sessionId, userId]);

  /**
   * Log a learning event
   */
  const logEvent = useCallback((eventType: LearningEventType, eventData?: Record<string, unknown>) => {
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

    if (batchEvents) {
      // Add to buffer
      eventBuffer.push(event);
      
      // Flush if buffer is full
      if (eventBuffer.length >= BUFFER_SIZE_LIMIT) {
        flushEvents();
      } else if (!flushTimeout) {
        // Schedule flush
        flushTimeout = setTimeout(flushEvents, FLUSH_INTERVAL);
      }
    } else {
      // Immediate write
      supabase.from('learning_events').insert(event);
    }
  }, [caseType, caseId, userId, sessionId, enableRealTimeTracking, batchEvents]);

  /**
   * Log a decision
   */
  const logDecision = useCallback((decisionId: string, wasCorrect?: boolean, wasOptimal?: boolean) => {
    decisionsMade.current++;
    
    logEvent('decision_made', {
      decision_id: decisionId,
      was_correct: wasCorrect,
      was_optimal: wasOptimal,
      decision_number: decisionsMade.current,
    });

    // Update metrics
    setCurrentMetrics(prev => ({
      ...prev,
      decisions_made: decisionsMade.current,
    }));
  }, [logEvent]);

  /**
   * Log hint usage
   */
  const logHintUsage = useCallback(() => {
    hintsUsed.current++;
    logEvent('hint_requested');
    
    setCurrentMetrics(prev => ({
      ...prev,
      hints_used: hintsUsed.current,
    }));
  }, [logEvent]);

  /**
   * Update current metrics
   */
  const updateMetrics = useCallback((updates: Partial<CasePerformanceMetrics>) => {
    setCurrentMetrics(prev => ({ ...prev, ...updates }));
    
    // Optionally sync to database in real-time
    if (sessionId && enableRealTimeTracking) {
      supabase
        .from('case_performance_metrics')
        .update(updates)
        .eq('id', sessionId);
    }
  }, [sessionId, enableRealTimeTracking]);

  /**
   * Update type-specific metrics
   */
  const updateTypeSpecificMetrics = useCallback((
    updates: Partial<ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics>
  ) => {
    setCurrentMetrics(prev => ({
      ...prev,
      type_specific_metrics: {
        ...prev.type_specific_metrics,
        ...updates,
      },
    }));
  }, []);

  /**
   * Get user's performance across all case types
   */
  const getCrossCasePerformance = useCallback(async (): Promise<CrossCasePerformanceSummary[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .rpc('get_user_cross_case_performance', {
        p_user_id: userId,
      });

    if (error) {
      console.error('Error fetching cross-case performance:', error);
      return [];
    }

    return data || [];
  }, [userId]);

  /**
   * Get cross-case recommendations
   */
  const getRecommendations = useCallback(async (): Promise<CrossCaseRecommendation[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('cross_case_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('was_viewed', false)
      .order('priority_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }

    return data || [];
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
  };
}

/**
 * Flush buffered events to database
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const eventsToFlush = [...eventBuffer];
  eventBuffer = [];
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const { error } = await supabase
    .from('learning_events')
    .insert(eventsToFlush);

  if (error) {
    console.error('Error flushing events:', error);
    // Re-add failed events to buffer
    eventBuffer = [...eventsToFlush, ...eventBuffer];
  }
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
    flushEvents();
  });
}
