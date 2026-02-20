// Analytics Service Layer
// Handles all database operations for learning analytics

import { supabase } from '@/integrations/supabase/client';
import type {
  SimulationSession,
  UserSkillProfile,
  LearningAnalyticsEvent,
  ConstraintViolation,
  WhatIfScenario
} from '@/types/analytics';
import type { BranchingCase, SimulationDecision, PatientState } from '@/types/simulation';
import type { Database, Json } from '@/integrations/supabase/types';

type SimulationSessionInsert = Database['public']['Tables']['simulation_sessions']['Insert'];
type LearningAnalyticsInsert = Database['public']['Tables']['learning_analytics']['Insert'];


// Use native crypto.randomUUID() instead of uuid package

// ============================================
// Session Management
// ============================================

/**
 * Create a new simulation session
 */
export async function createSimulationSession(
  userId: string,
  caseData: BranchingCase,
  instructorId?: string
): Promise<string | null> {
  const session: Partial<SimulationSession> = {
    user_id: userId,
    case_id: caseData.id,
    case_title: caseData.title,
    specialty: caseData.specialty,
    difficulty: caseData.difficulty,
    status: 'in_progress',
    initial_difficulty: caseData.difficulty,
    instructor_id: instructorId,
    decision_path: [],
    learning_objectives_achieved: [],
    cognitive_biases_detected: [],
  };

  const { data, error } = await supabase
    .from('simulation_sessions')
    .insert(session as unknown as SimulationSessionInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating simulation session:', error);
    return null;
  }

  return data.id;
}

/**
 * Update simulation session with completion data
 */
export async function completeSimulationSession(
  sessionId: string,
  outcome: {
    totalCost: number;
    totalDuration: number;
    stagesCompleted: number;
    decisionsMade: number;
    criticalErrors: number;
    warningsIgnored: number;
    optimalPathDeviation: number;
    learningObjectivesAchieved: string[];
    biasesDetected: string[];
    decisionPath: unknown[];
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('simulation_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_duration_seconds: outcome.totalDuration,
      total_cost: outcome.totalCost,
      stages_completed: outcome.stagesCompleted,
      decisions_made: outcome.decisionsMade,
      critical_errors: outcome.criticalErrors,
      warnings_ignored: outcome.warningsIgnored,
      optimal_path_deviation_score: outcome.optimalPathDeviation,
      learning_objectives_achieved: outcome.learningObjectivesAchieved,
      cognitive_biases_detected: outcome.biasesDetected,
      decision_path: outcome.decisionPath as unknown as Json,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error completing simulation session:', error);
    return false;
  }

  return true;
}

/**
 * Mark session as abandoned
 */
export async function abandonSimulationSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('simulation_sessions')
    .update({
      status: 'abandoned',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error abandoning simulation session:', error);
    return false;
  }

  return true;
}

// ============================================
// Analytics Event Logging (Real-time with batching)
// ============================================

// In-memory buffer for batching analytics writes
let analyticsBuffer: LearningAnalyticsInsert[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 5000; // 5 seconds
const BUFFER_SIZE_LIMIT = 10;

/**
 * Log an analytics event (buffered for performance)
 */
export function logAnalyticsEvent(
  sessionId: string,
  userId: string,
  event: Omit<LearningAnalyticsEvent, 'id' | 'created_at' | 'user_id' | 'simulation_session_id'>
): void {
  const eventData: LearningAnalyticsInsert = {
    simulation_session_id: sessionId,
    user_id: userId,
    event_type: event.event_type,
    event_data: event.event_data as unknown as Json,
    stage_id: event.stage_id,
    decision_id: event.decision_id,
    decision_type: event.decision_type,
    patient_state_snapshot: event.patient_state_snapshot as unknown as Json,
    time_elapsed_seconds: event.time_elapsed_seconds,
    was_optimal: event.was_optimal,
    deviation_from_optimal: event.deviation_from_optimal,
    decision_time_seconds: event.decision_time_seconds,
  };

  analyticsBuffer.push(eventData);

  // Flush immediately if buffer is full
  if (analyticsBuffer.length >= BUFFER_SIZE_LIMIT) {
    flushAnalyticsBuffer();
  } else if (!flushTimeout) {
    // Schedule flush
    flushTimeout = setTimeout(flushAnalyticsBuffer, FLUSH_INTERVAL);
  }
}

/**
 * Flush buffered analytics to database
 */
async function flushAnalyticsBuffer(): Promise<void> {
  if (analyticsBuffer.length === 0) return;

  const eventsToFlush = [...analyticsBuffer];
  analyticsBuffer = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const { error } = await supabase
    .from('learning_analytics')
    .insert(eventsToFlush);

  if (error) {
    console.error('Error flushing analytics buffer:', error);
    // Re-add failed events to buffer
    analyticsBuffer = [...eventsToFlush, ...analyticsBuffer];
  }
}

/**
 * Force immediate flush (call on simulation end)
 */
export async function forceFlushAnalytics(): Promise<void> {
  await flushAnalyticsBuffer();
}

// ============================================
// Constraint Violations
// ============================================

/**
 * Log a constraint violation
 */
export async function logConstraintViolation(
  sessionId: string,
  userId: string,
  violation: Omit<ConstraintViolation, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('constraint_violations')
    .insert({
      simulation_session_id: sessionId,
      user_id: userId,
      violation_type: violation.violation_type,
      severity: violation.severity,
      stage_id: violation.stage_id,
      decision_id: violation.decision_id,
      decision_label: violation.decision_label,
      violation_description: violation.violation_description,
      suggested_correction: violation.suggested_correction,
      clinical_rationale: violation.clinical_rationale,
      was_heeded: violation.was_heeded,
      alternative_chosen: violation.alternative_chosen,
    });

  if (error) {
    console.error('Error logging constraint violation:', error);
  }
}

/**
 * Update constraint violation outcome
 */
export async function updateConstraintViolationOutcome(
  violationId: string,
  wasHeeded: boolean,
  alternativeChosen?: string
): Promise<void> {
  const { error } = await supabase
    .from('constraint_violations')
    .update({
      was_heeded: wasHeeded,
      alternative_chosen: alternativeChosen,
    })
    .eq('id', violationId);

  if (error) {
    console.error('Error updating constraint violation:', error);
  }
}

// ============================================
// User Skill Profiles
// ============================================

/**
 * Get or create user skill profile
 */
export async function getUserSkillProfile(userId: string): Promise<UserSkillProfile | null> {
  // Try to get existing profile
  const { data, error } = await supabase
    .from('user_skill_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching user skill profile:', error);
    return null;
  }

  if (data) {
    return data as unknown as UserSkillProfile;
  }

  // Create new profile
  const { data: newProfile, error: insertError } = await supabase
    .from('user_skill_profiles')
    .insert({
      user_id: userId,
      specialty_skills: {} as unknown as Json,
      preferred_difficulty: 'intermediate',
      weakness_areas: [] as unknown as Json,
      strength_areas: [] as unknown as Json,
      frequent_biases: [] as unknown as Json,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user skill profile:', insertError);
    return null;
  }

  return newProfile as unknown as UserSkillProfile;
}

/**
 * Update user skill profile
 */
export async function updateUserSkillProfile(
  userId: string,
  updates: Partial<UserSkillProfile>
): Promise<boolean> {
  const { error } = await supabase
    .from('user_skill_profiles')
    .update({
      ...updates as any,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user skill profile:', error);
    return false;
  }

  return true;
}

/**
 * Trigger skill profile recalculation
 */
export async function recalculateUserSkillProfile(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('update_user_skill_profile', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error recalculating skill profile:', error);
    return false;
  }

  return true;
}

// ============================================
// Instructor Assignments
// ============================================

/**
 * Assign student to instructor
 */
export async function assignStudentToInstructor(
  instructorId: string,
  studentId: string,
  assignedBy: string,
  notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('instructor_assignments')
    .insert({
      instructor_id: instructorId,
      student_id: studentId,
      assigned_by: assignedBy,
      notes: notes,
    });

  if (error) {
    console.error('Error assigning student:', error);
    return false;
  }

  return true;
}

/**
 * Remove student assignment
 */
export async function removeInstructorAssignment(
  instructorId: string,
  studentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('instructor_assignments')
    .delete()
    .eq('instructor_id', instructorId)
    .eq('student_id', studentId);

  if (error) {
    console.error('Error removing assignment:', error);
    return false;
  }

  return true;
}

/**
 * Get instructor's assigned students
 */
export async function getInstructorStudents(instructorId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('instructor_assignments')
    .select('student_id')
    .eq('instructor_id', instructorId);

  if (error) {
    console.error('Error fetching instructor students:', error);
    return [];
  }

  return data.map(row => row.student_id);
}

/**
 * Check if instructor has access to student data
 */
export async function checkInstructorAccess(
  instructorId: string,
  studentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('instructor_assignments')
    .select('id')
    .eq('instructor_id', instructorId)
    .eq('student_id', studentId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// ============================================
// What-If Scenarios (For future use)
// ============================================

/**
 * Save what-if scenarios
 */
export async function saveWhatIfScenarios(
  sessionId: string,
  scenarios: Omit<WhatIfScenario, 'id' | 'created_at'>[]
): Promise<void> {
  const { error } = await supabase
    .from('whatif_scenarios')
    .insert(scenarios.map(s => ({
      simulation_session_id: sessionId,
      ...s,
      predicted_patient_state: s.predicted_patient_state as unknown as Json,
    })));

  if (error) {
    console.error('Error saving what-if scenarios:', error);
  }
}

/**
 * Mark what-if scenario as explored
 */
export async function markWhatIfExplored(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from('whatif_scenarios')
    .update({
      was_explored: true,
      explored_at: new Date().toISOString(),
    })
    .eq('id', scenarioId);

  if (error) {
    console.error('Error marking what-if as explored:', error);
  }
}

// ============================================
// Analytics Queries
// ============================================

/**
 * Get simulation session details with full analytics
 */
export async function getSimulationSessionDetails(
  sessionId: string
): Promise<{ session: SimulationSession | null; events: LearningAnalyticsEvent[] }> {
  const [sessionResult, eventsResult] = await Promise.all([
    supabase
      .from('simulation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single(),
    supabase
      .from('learning_analytics')
      .select('*')
      .eq('simulation_session_id', sessionId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    session: sessionResult.data as unknown as SimulationSession | null,
    events: (eventsResult.data || []) as unknown as LearningAnalyticsEvent[],
  };
}

/**
 * Get user's simulation history
 */
export async function getUserSimulationHistory(
  userId: string,
  limit: number = 20
): Promise<SimulationSession[]> {
  const { data, error } = await supabase
    .from('simulation_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching simulation history:', error);
    return [];
  }

  return (data || []) as unknown as SimulationSession[];
}

/**
 * Get cohort performance summary (for instructors)
 */
export async function getCohortPerformanceSummary(
  instructorId: string
): Promise<{
  student_id: string;
  student_name: string;
  total_simulations: number;
  completed_simulations: number;
  average_accuracy: number;
  top_weakness: string;
  last_active: string;
}[]> {
  const { data, error } = await supabase.rpc('get_instructor_students_summary', {
    p_instructor_id: instructorId,
  });

  if (error) {
    console.error('Error fetching cohort summary:', error);
    return [];
  }

  return data || [];
}

/**
 * Get common errors across all sessions
 */
export async function getCommonErrors(
  caseId?: string
): Promise<{ violation_type: string; count: number; severity: string }[]> {
  let query = supabase
    .from('constraint_violations')
    .select('violation_type, severity')
    .eq('was_heeded', false);

  if (caseId) {
    query = query.eq('simulation_sessions.case_id', caseId);
  }

  // This requires a join, let's do it differently
  const { data, error } = await supabase
    .rpc('get_common_constraint_violations', {
      p_case_id: caseId || null,
    });

  if (error) {
    console.error('Error fetching common errors:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Performance Calculations
// ============================================

/**
 * Calculate optimal path deviation
 */
export function calculateOptimalPathDeviation(
  actualDecisions: string[],
  optimalDecisions: string[]
): number {
  if (optimalDecisions.length === 0) return 100;

  let matches = 0;
  const maxLength = Math.max(actualDecisions.length, optimalDecisions.length);

  for (let i = 0; i < Math.min(actualDecisions.length, optimalDecisions.length); i++) {
    if (actualDecisions[i] === optimalDecisions[i]) {
      matches++;
    }
  }

  // Calculate percentage, penalize for extra/missing decisions
  const baseScore = (matches / optimalDecisions.length) * 100;
  const lengthPenalty = Math.abs(actualDecisions.length - optimalDecisions.length) * 5;

  return Math.max(0, baseScore - lengthPenalty);
}

/**
 * Calculate learning objectives achieved
 */
export function calculateLearningObjectivesAchieved(
  decisionPath: { decisionId: string }[],
  caseData: BranchingCase
): string[] {
  const achieved: string[] = [];
  const decisionIds = new Set(decisionPath.map(d => d.decisionId));

  // Map decisions to learning objectives
  // This is a simplified version - you might want more sophisticated logic
  caseData.learningObjectives.forEach((objective, index) => {
    // Check if key decisions for this objective were made
    const keyDecisions = getKeyDecisionsForObjective(caseData, index);
    const hasKeyDecisions = keyDecisions.some(d => decisionIds.has(d));

    if (hasKeyDecisions) {
      achieved.push(objective);
    }
  });

  return achieved;
}

/**
 * Helper: Get key decisions for a learning objective
 */
function getKeyDecisionsForObjective(
  caseData: BranchingCase,
  objectiveIndex: number
): string[] {
  // This would need to be customized per case
  // For now, return optimal path decisions
  return caseData.optimalPath?.decisions.slice(0, 3) || [];
}

// ============================================
// Cleanup
// ============================================

/**
 * Clean up on app unload
 */
export function cleanupAnalytics(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  // Force final flush
  flushAnalyticsBuffer();
}

// Attach cleanup to window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupAnalytics);
}

// ============================================
// Reflection Management
// ============================================

export interface ReflectionData {
  what_learned: string;
  what_would_do_differently: string;
  strongest_area: string;
  area_to_improve: string;
  confidence_level: number;
}

/**
 * Save user reflection for a simulation session
 */
export async function saveReflection(
  sessionId: string,
  userId: string,
  reflection: ReflectionData
): Promise<boolean> {
  try {
    // First, log the reflection as an analytics event
    await logAnalyticsEvent(sessionId, userId, {
      event_type: 'simulation_completed',
      stage_id: 'reflection',
      time_elapsed_seconds: 0,
      was_optimal: null,
      deviation_from_optimal: 0,
      decision_time_seconds: 0,
      decision_id: null,
      decision_type: null,
      patient_state_snapshot: null,
      event_data: {
        type: 'user_reflection',
        reflection: {
          what_learned: reflection.what_learned,
          what_would_do_differently: reflection.what_would_do_differently,
          strongest_area: reflection.strongest_area,
          area_to_improve: reflection.area_to_improve,
          confidence_level: reflection.confidence_level,
        },
      },
    });

    // Also update the simulation session with reflection summary
    const { error } = await supabase
      .from('simulation_sessions')
      .update({
        reflection: JSON.stringify({
          what_learned: reflection.what_learned.substring(0, 500),
          confidence_level: reflection.confidence_level,
          reflected_at: new Date().toISOString(),
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving reflection to session:', error);
      // Still return true since we logged the event
    }

    return true;
  } catch (error) {
    console.error('Error saving reflection:', error);
    return false;
  }
}
