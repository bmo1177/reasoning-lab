// Unified Analytics Types
// Cross-case analytics foundation for all case types

// ============================================
// Case Type Definitions
// ============================================

export type CaseType = 'clinical' | 'simulation' | 'error' | 'uncertainty';

export interface CaseTypeConfig {
  id: CaseType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const CASE_TYPES: CaseTypeConfig[] = [
  {
    id: 'clinical',
    label: 'Clinical Reasoning',
    description: 'Diagnostic reasoning with progressive information reveal',
    icon: 'Stethoscope',
    color: 'blue',
  },
  {
    id: 'simulation',
    label: 'Clinical Simulation',
    description: 'Interactive time-critical scenarios with real consequences',
    icon: 'Activity',
    color: 'green',
  },
  {
    id: 'error',
    label: 'Error Analysis',
    description: 'Learn from diagnostic errors and cognitive biases',
    icon: 'AlertTriangle',
    color: 'orange',
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty Management',
    description: 'Bayesian reasoning and confidence calibration',
    icon: 'Gauge',
    color: 'purple',
  },
];

// ============================================
// Unified Performance Metrics
// ============================================

export interface CasePerformanceMetrics {
  id: string;
  user_id: string;
  case_id: string;
  case_type: CaseType;
  case_title: string | null;
  specialty: string | null;
  difficulty: string | null;
  
  // Universal Timing
  started_at: string;
  completed_at: string | null;
  total_duration_seconds: number | null;
  time_spent_on_decisions: number;
  
  // Universal Accuracy
  accuracy_score: number | null; // 0-100
  completion_status: 'completed' | 'abandoned' | 'timeout' | null;
  
  // Universal Efficiency
  total_cost: number;
  efficiency_score: number | null;
  
  // Universal Assistance
  hints_used: number;
  hints_available: number;
  
  // Universal Attempts
  attempt_number: number;
  is_retry: boolean;
  previous_attempt_id: string | null;
  
  // Case-Type Specific (flexible)
  type_specific_metrics: ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics;
  
  // Learning Outcomes
  learning_objectives_achieved: string[];
  cognitive_biases_detected: string[];
  
  // Engagement
  decisions_made: number;
  interactions_count: number;
  
  created_at: string;
  updated_at: string;
}

// Type-specific metric interfaces
export interface ClinicalMetrics {
  tests_ordered: number;
  appropriate_tests_percentage: number;
  time_to_diagnosis: number | null;
  correct_diagnosis: boolean | null;
  reasoning_map_accuracy: number | null;
  test_ordering_efficiency: number | null;
  socratic_prompts_used: number;
}

export interface SimulationMetrics {
  stages_completed: number;
  optimal_path_deviation: number | null;
  critical_errors: number;
  warnings_heeded: number;
  warnings_ignored: number;
  patient_final_status: string | null;
  whatif_scenarios_explored: number;
}

export interface ErrorMetrics {
  biases_correctly_identified: number;
  biases_missed: number;
  red_flags_detected: number;
  red_flags_missed: number;
  correct_diagnosis_identified: boolean;
  reflection_quality_score: number | null;
}

export interface UncertaintyMetrics {
  probabilities_assigned: number;
  calibration_score: number | null;
  brier_score: number | null;
  overconfidence_instances: number;
  underconfidence_instances: number;
  bayesian_updates_correct: number;
}

// ============================================
// Unified Learning Events
// ============================================

export type LearningEventType = 
  // Universal
  | 'case_started'
  | 'case_completed'
  | 'case_abandoned'
  | 'hint_requested'
  | 'hint_viewed'
  
  // Clinical
  | 'test_ordered'
  | 'test_result_viewed'
  | 'diagnosis_made'
  | 'reasoning_node_added'
  | 'reasoning_node_connected'
  | 'expert_map_compared'
  
  // Simulation
  | 'decision_made'
  | 'stage_advanced'
  | 'patient_state_changed'
  | 'constraint_warning_shown'
  | 'constraint_warning_heeded'
  | 'constraint_warning_ignored'
  | 'whatif_explored'
  | 'branch_triggered'
  
  // Error
  | 'bias_selected'
  | 'bias_correctly_identified'
  | 'bias_missed'
  | 'red_flag_detected'
  | 'red_flag_missed'
  | 'correct_diagnosis_identified'
  
  // Uncertainty
  | 'probability_assigned'
  | 'test_selected'
  | 'bayesian_update_viewed'
  | 'confidence_calibrated';

export interface LearningEvent {
  id: string;
  user_id: string;
  session_id: string | null;
  
  case_type: CaseType;
  case_id: string;
  event_type: LearningEventType;
  
  event_data: Record<string, unknown>;
  
  stage_id: string | null;
  decision_id: string | null;
  timestamp: string;
  time_elapsed_seconds: number;
  
  was_correct: boolean | null;
  was_optimal: boolean | null;
  accuracy_deviation: number | null;
  
  created_at: string;
}

// ============================================
// Cross-Case Recommendations
// ============================================

export type RecommendationType = 
  | 'skill_gap'      // Target a weak area
  | 'variety'        // Try different case type
  | 'mastery'        // Continue with successful type
  | 'calibration'    // Balance confidence
  | 'review'         // Retry failed case
  | 'challenge';     // Try harder difficulty

export interface CrossCaseRecommendation {
  id: string;
  user_id: string;
  
  recommendation_type: RecommendationType;
  recommended_case_id: string;
  recommended_case_type: CaseType;
  recommended_case_title: string | null;
  
  primary_reason: string;
  supporting_data: Record<string, unknown>;
  
  was_viewed: boolean;
  was_accepted: boolean;
  accepted_at: string | null;
  
  priority_score: number | null;
  expires_at: string | null;
  
  created_at: string;
}

// ============================================
// Enhanced User Skill Profile
// ============================================

export interface CrossCaseMetrics {
  clinical: {
    cases_completed: number;
    avg_accuracy: number;
    total_cost_efficiency: number;
  };
  simulation: {
    cases_completed: number;
    avg_accuracy: number;
    critical_error_rate: number;
  };
  error: {
    cases_completed: number;
    bias_identification_rate: number;
    red_flag_detection_rate: number;
  };
  uncertainty: {
    cases_completed: number;
    calibration_score: number;
    brier_score: number;
  };
}

export interface CaseTypePreferences {
  preferred_types: CaseType[];
  type_rotation_schedule: CaseType[];
  last_case_type: CaseType | null;
}

// ============================================
// Unified Case Analytics Hook Types
// ============================================

export interface UseCaseAnalyticsConfig {
  caseType: CaseType;
  caseId: string;
  userId: string;
  enableRealTimeTracking?: boolean;
  batchEvents?: boolean;
}

export interface UseCaseAnalyticsReturn {
  // Session state
  sessionId: string | null;
  isTracking: boolean;
  
  // Metrics
  currentMetrics: Partial<CasePerformanceMetrics>;
  
  // Actions
  startCase: (initialData?: Partial<CasePerformanceMetrics>) => Promise<void>;
  completeCase: (finalData: Partial<CasePerformanceMetrics>) => Promise<void>;
  abandonCase: (reason?: string) => Promise<void>;
  
  // Event logging
  logEvent: (eventType: LearningEventType, eventData?: Record<string, unknown>) => void;
  logDecision: (decisionId: string, wasCorrect?: boolean, wasOptimal?: boolean) => void;
  logHintUsage: () => void;
  
  // Metrics updates
  updateMetrics: (updates: Partial<CasePerformanceMetrics>) => void;
  updateTypeSpecificMetrics: (updates: Partial<ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics>) => void;
  
  // Cross-case
  getCrossCasePerformance: () => Promise<CrossCasePerformanceSummary[]>;
  getRecommendations: () => Promise<CrossCaseRecommendation[]>;
}

export interface CrossCasePerformanceSummary {
  case_type: CaseType;
  total_cases: number;
  completed_cases: number;
  avg_accuracy: number | null;
  avg_efficiency: number | null;
  last_completed_at: string | null;
}

// ============================================
// Case Adapter Types
// ============================================

export interface CaseAdapter<TCase, TDecision, TMetrics> {
  caseType: CaseType;
  
  // Convert case to unified format
  extractCaseInfo: (caseData: TCase) => {
    caseId: string;
    title: string;
    specialty: string;
    difficulty: string;
    learningObjectives: string[];
  };
  
  // Convert decision to unified format
  extractDecisionInfo: (decision: TDecision) => {
    decisionId: string;
    decisionType: string;
    cost: number;
    timeRequired: number;
  };
  
  // Calculate unified metrics from case-specific data
  calculateMetrics: (
    caseData: TCase,
    decisions: TDecision[],
    context: unknown
  ) => TMetrics;
  
  // Validate decision against clinical rules
  validateDecision?: (decision: TDecision, caseData: TCase, context: unknown) => ConstraintValidation | null;
  
  // Generate what-if scenarios
  generateWhatIfScenarios?: (actualDecision: TDecision, caseData: TCase, context: unknown) => WhatIfScenario[];
}

// Constraint validation (shared)
export interface ConstraintValidation {
  isValid: boolean;
  severity: 'safe' | 'warning' | 'error' | 'critical';
  message?: string;
  clinicalRationale?: string;
  suggestedAlternative?: string;
}

// What-if scenario (shared)
export interface WhatIfScenario {
  id: string;
  alternativeDecisionId: string;
  alternativeDecisionLabel: string;
  predictedOutcome: 'better' | 'worse' | 'similar' | 'different';
  description: string;
  explanation: string;
  keyInsight: string;
}
