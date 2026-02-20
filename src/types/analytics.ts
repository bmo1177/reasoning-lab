// Types for Learning Analytics System

import type { PatientState } from './simulation';

// ============================================
// Core Analytics Types
// ============================================

export interface SimulationSession {
  id: string;
  user_id: string;
  case_id: string;
  case_title: string | null;
  specialty: string | null;
  difficulty: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';

  // Timing
  started_at: string;
  completed_at: string | null;
  total_duration_seconds: number | null;

  // Performance metrics
  total_cost: number;
  optimal_path_deviation_score: number | null;
  stages_completed: number;
  decisions_made: number;
  critical_errors: number;
  warnings_ignored: number;

  // Adaptive data
  initial_difficulty: string | null;
  adapted_difficulty: string | null;
  adaptation_reason: string | null;

  // Learning analytics
  learning_objectives_achieved: string[];
  cognitive_biases_detected: string[];
  average_decision_time_seconds: number | null;
  decision_path: DecisionPathEntry[];

  // Instructor assignment
  instructor_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface DecisionPathEntry {
  decisionId: string;
  decisionLabel: string;
  stageId: string;
  timestamp: string;
  timeElapsed: number;
  cost: number;
}

export interface UserSkillProfile {
  id: string;
  user_id: string;

  // Specialty skills format:
  // {"cardiology": {"level": 7.5, "cases_completed": 12, "accuracy": 0.85, "avg_cost": 450}, ...}
  specialty_skills: Record<string, SpecialtySkill>;

  preferred_difficulty: string;
  average_completion_time_by_difficulty: Record<string, number>;

  weakness_areas: string[];
  strength_areas: string[];

  frequent_biases: Array<{
    bias: string;
    frequency: number;
    trend: 'improving' | 'stable' | 'worsening';
  }>;
  bias_improvement_trends: Record<string, number>;

  learning_style: {
    pace: 'slow' | 'moderate' | 'fast';
    feedback_frequency: 'immediate' | 'stage_end' | 'simulation_end';
  };

  total_simulations_completed: number;
  total_simulations_abandoned: number;
  overall_accuracy: number | null;

  updated_at: string;

  // ---- UML LearnerProfile extensions ----

  /** Competence state map: competencyNodeId → mastery (0–100). UML: LearnerProfile.competenceState */
  competence_state?: Record<string, number>;
  /** Preferred learning pace. UML: LearnerProfile.learningPace (alias of learning_style.pace) */
  learning_pace?: 'slow' | 'moderate' | 'fast';
}

export interface SpecialtySkill {
  level: number;
  cases_completed: number;
  accuracy: number;
  avg_cost: number;
  last_updated: string;
}

export interface LearningAnalyticsEvent {
  id: string;
  simulation_session_id: string;
  user_id: string;

  event_type:
  | 'decision_made'
  | 'stage_advanced'
  | 'info_revealed'
  | 'time_critical'
  | 'branch_triggered'
  | 'constraint_warning_shown'
  | 'constraint_warning_heeded'
  | 'constraint_warning_ignored'
  | 'whatif_explored'
  | 'simulation_completed'
  | 'simulation_abandoned'
  | 'patient_state_changed';

  event_data: Record<string, unknown>;

  stage_id: string | null;
  decision_id: string | null;
  decision_type: string | null;
  patient_state_snapshot: PatientState | null;
  time_elapsed_seconds: number;

  was_optimal: boolean | null;
  deviation_from_optimal: number | null;
  decision_time_seconds: number | null;

  created_at: string;
}

export interface ConstraintViolation {
  id: string;
  simulation_session_id: string;
  user_id: string;

  violation_type: string;
  severity: 'warning' | 'error' | 'critical';
  stage_id: string | null;
  decision_id: string | null;
  decision_label: string | null;
  violation_description: string;

  suggested_correction: string | null;
  clinical_rationale: string | null;

  was_heeded: boolean;
  alternative_chosen: string | null;

  created_at: string;
}

export interface WhatIfScenario {
  id: string;
  simulation_session_id: string;

  stage_id: string;
  decision_made: string;
  decision_made_label: string | null;

  alternative_decision: string;
  alternative_decision_label: string | null;

  scenario_title: string | null;
  scenario_description: string | null;
  predicted_outcome: 'better' | 'worse' | 'similar' | 'different' | null;
  predicted_patient_state: PatientState | null;
  explanation: string | null;

  learning_objective: string | null;
  key_insight: string | null;

  was_viewed: boolean;
  was_explored: boolean;
  explored_at: string | null;

  created_at: string;
}

export interface InstructorAssignment {
  id: string;
  instructor_id: string;
  student_id: string;
  assignment_type: 'manual' | 'course' | 'rotation';
  notes: string | null;
  assigned_at: string;
  assigned_by: string | null;
}

// ============================================
// Performance Analysis Types
// ============================================

export interface UserPerformanceSummary {
  userId: string;
  displayName: string;
  totalSimulations: number;
  completedSimulations: number;
  averageAccuracy: number;
  averageCost: number;
  topWeakness: string | null;
  topStrength: string | null;
  recentActivity: SimulationSession[];
  specialtyBreakdown: Record<string, SpecialtyPerformance>;
}

export interface SpecialtyPerformance {
  casesCompleted: number;
  averageAccuracy: number;
  averageCost: number;
  skillLevel: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface SessionDetails {
  session: SimulationSession;
  events: LearningAnalyticsEvent[];
  violations: ConstraintViolation[];
  whatIfScenarios: WhatIfScenario[];
  performanceMetrics: {
    decisionQuality: number;
    timeEfficiency: number;
    costEfficiency: number;
    clinicalAccuracy: number;
  };
}

export interface DecisionAnalysis {
  decisionId: string;
  decisionLabel: string;
  stageId: string;
  timestamp: string;
  wasOptimal: boolean;
  timeSpent: number;
  cost: number;
  patientStateBefore: PatientState;
  patientStateAfter: PatientState;
  newInformation: string | null;
  triggeredBranch: string | null;
}

export interface CohortPerformance {
  totalStudents: number;
  activeStudents: number;
  averageCompletionRate: number;
  averageAccuracy: number;
  commonErrors: Array<{
    violationType: string;
    count: number;
    percentage: number;
  }>;
  caseDifficultyEffectiveness: Array<{
    caseId: string;
    averageAccuracy: number;
    completionRate: number;
  }>;
}

export interface CommonError {
  violationType: string;
  caseId: string;
  caseTitle: string;
  count: number;
  severity: string;
  suggestedRemediation: string;
}

export interface MasteryStats {
  objectiveId: string;
  objectiveText: string;
  totalAttempts: number;
  masteryRate: number;
  averageAttemptsToMastery: number;
  strugglingStudents: string[];
}

// ============================================
// Adaptive Engine Types
// ============================================

export interface AdaptiveCaseRequest {
  userId: string;
  targetSpecialty?: string;
  preferredDifficulty?: string;
  focusAreas?: string[];
  avoidRecentCases?: string[];
  maxComplexity?: number;
}

export interface AdaptiveRecommendation {
  caseId: string;
  reason: string;
  expectedDifficulty: string;
  targetedObjectives: string[];
  targetedWeaknesses: string[];
}

// ============================================
// Analytics Service Input Types
// ============================================

export interface LogDecisionEventInput {
  event_type: 'decision_made';
  stage_id: string;
  decision_id: string;
  decision_type: string;
  patient_state_snapshot: PatientState;
  time_elapsed_seconds: number;
  was_optimal: boolean;
  deviation_from_optimal: number;
  decision_time_seconds: number;
  event_data?: Record<string, unknown>;
}

export interface LogConstraintViolationInput {
  violation_type: string;
  severity: 'warning' | 'error' | 'critical';
  stage_id: string;
  decision_id: string;
  decision_label: string;
  violation_description: string;
  suggested_correction?: string;
  clinical_rationale?: string;
}
