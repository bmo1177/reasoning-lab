// Mock Data Service
// Generates realistic test data for analytics demonstration

import type {
  CasePerformanceMetrics,
  LearningEvent,
  CrossCaseRecommendation,
  CaseType,
  ClinicalMetrics,
  SimulationMetrics,
  ErrorMetrics,
  UncertaintyMetrics,
} from '@/types/unifiedAnalytics';
import {
  savePerformanceMetric,
  saveLearningEvents,
  saveRecommendation,
} from './localAnalyticsService';

// Generate random date within last 30 days
const randomDate = (daysBack = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
};

// Generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Sample data
const SAMPLE_CASES: Record<CaseType, Array<{ id: string; title: string; specialty: string }>> = {
  clinical: [
    { id: 'clin-001', title: 'Chest Pain Evaluation', specialty: 'cardiology' },
    { id: 'clin-002', title: 'Shortness of Breath', specialty: 'pulmonology' },
    { id: 'clin-003', title: 'Confusion in Elderly', specialty: 'neurology' },
    { id: 'clin-004', title: 'Abdominal Pain', specialty: 'gastroenterology' },
    { id: 'clin-005', title: 'Fever and Joint Pain', specialty: 'infectious-disease' },
  ],
  simulation: [
    { id: 'sim-001', title: 'Emergency: Chest Pain Triage', specialty: 'emergency' },
    { id: 'sim-002', title: 'Pediatric Fever', specialty: 'pediatrics' },
    { id: 'sim-003', title: 'Hypoglycemia Emergency', specialty: 'endocrinology' },
    { id: 'sim-004', title: 'Sepsis Recognition', specialty: 'emergency' },
    { id: 'sim-005', title: 'Acute Stroke', specialty: 'emergency' },
  ],
  error: [
    { id: 'err-001', title: 'Missed Ectopic Pregnancy', specialty: 'emergency' },
    { id: 'err-002', title: 'PE Masquerading as Anxiety', specialty: 'emergency' },
    { id: 'err-003', title: 'Delayed Diagnosis of Meningitis', specialty: 'neurology' },
    { id: 'err-004', title: 'Missed Compartment Syndrome', specialty: 'orthopedics' },
  ],
  uncertainty: [
    { id: 'unc-001', title: 'Fatigue and Weight Loss', specialty: 'internal-medicine' },
    { id: 'unc-002', title: 'Fever and Cough', specialty: 'emergency' },
    { id: 'unc-003', title: 'Chest Pain with Normal ECG', specialty: 'cardiology' },
  ],
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const BIASES = ['anchoring', 'availability', 'confirmation', 'premature-closure', 'overconfidence'];

// ============================================
// Generate Single Case Session
// ============================================

export function generateMockCaseSession(
  userId: string,
  caseType: CaseType,
  options?: {
    accuracy?: number; // 0-100
    completed?: boolean;
    recent?: boolean;
  }
): { metric: Partial<CasePerformanceMetrics>; events: Partial<LearningEvent>[] } {
  const caseData = SAMPLE_CASES[caseType][Math.floor(Math.random() * SAMPLE_CASES[caseType].length)];
  const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
  const sessionId = generateUUID();
  const startedAt = options?.recent ? randomDate(7) : randomDate(30);
  
  // Calculate accuracy (randomized around target)
  const targetAccuracy = options?.accuracy ?? Math.random() * 40 + 50; // 50-90%
  const actualAccuracy = Math.max(0, Math.min(100, targetAccuracy + (Math.random() * 20 - 10)));
  
  const isCompleted = options?.completed ?? Math.random() > 0.1; // 90% completion rate
  const duration = Math.floor(Math.random() * 600) + 300; // 5-15 minutes
  
  // Generate type-specific metrics
  let typeSpecificMetrics: ClinicalMetrics | SimulationMetrics | ErrorMetrics | UncertaintyMetrics;
  
  switch (caseType) {
    case 'clinical':
      typeSpecificMetrics = {
        tests_ordered: Math.floor(Math.random() * 8) + 3,
        appropriate_tests_percentage: actualAccuracy,
        time_to_diagnosis: Math.floor(Math.random() * 300) + 60,
        correct_diagnosis: actualAccuracy > 70,
        reasoning_map_accuracy: actualAccuracy,
        test_ordering_efficiency: Math.random() * 30 + 60,
        socratic_prompts_used: Math.floor(Math.random() * 3),
      } as ClinicalMetrics;
      break;
      
    case 'simulation':
      const warningsTotal = Math.floor(Math.random() * 4);
      const warningsHeeded = Math.floor(warningsTotal * (actualAccuracy / 100));
      typeSpecificMetrics = {
        stages_completed: Math.floor(Math.random() * 3) + 2,
        optimal_path_deviation: 100 - actualAccuracy,
        critical_errors: Math.floor((100 - actualAccuracy) / 25),
        warnings_heeded: warningsHeeded,
        warnings_ignored: warningsTotal - warningsHeeded,
        patient_final_status: actualAccuracy > 80 ? 'improved' : actualAccuracy > 50 ? 'stable' : 'critical',
        whatif_scenarios_explored: Math.floor(Math.random() * 3),
      } as SimulationMetrics;
      break;
      
    case 'error':
      const totalBiases = 3;
      const identifiedBiases = Math.floor(totalBiases * (actualAccuracy / 100));
      typeSpecificMetrics = {
        biases_correctly_identified: identifiedBiases,
        biases_missed: totalBiases - identifiedBiases,
        red_flags_detected: Math.floor(Math.random() * 4) + 2,
        red_flags_missed: Math.floor(Math.random() * 2),
        correct_diagnosis_identified: actualAccuracy > 75,
        reflection_quality_score: actualAccuracy,
      } as ErrorMetrics;
      break;
      
    case 'uncertainty':
      typeSpecificMetrics = {
        probabilities_assigned: Math.floor(Math.random() * 5) + 3,
        calibration_score: actualAccuracy,
        brier_score: Math.random() * 0.3,
        overconfidence_instances: Math.floor(Math.random() * 3),
        underconfidence_instances: Math.floor(Math.random() * 2),
        bayesian_updates_correct: Math.floor(Math.random() * 4) + 1,
      } as UncertaintyMetrics;
      break;
      
    default:
      typeSpecificMetrics = {} as ClinicalMetrics;
  }
  
  const metric: Partial<CasePerformanceMetrics> = {
    id: sessionId,
    user_id: userId,
    case_id: caseData.id,
    case_type: caseType,
    case_title: caseData.title,
    specialty: caseData.specialty,
    difficulty: difficulty,
    started_at: startedAt,
    completed_at: isCompleted ? new Date(new Date(startedAt).getTime() + duration * 1000).toISOString() : null,
    total_duration_seconds: isCompleted ? duration : Math.floor(duration * 0.7),
    completion_status: isCompleted ? 'completed' : 'abandoned',
    accuracy_score: isCompleted ? actualAccuracy : null,
    total_cost: Math.floor(Math.random() * 500) + 100,
    efficiency_score: Math.random() * 30 + 60,
    hints_used: Math.floor(Math.random() * 3),
    hints_available: 5,
    decisions_made: Math.floor(Math.random() * 8) + 3,
    interactions_count: Math.floor(Math.random() * 20) + 10,
    type_specific_metrics: typeSpecificMetrics,
    learning_objectives_achieved: ['Objective 1', 'Objective 2'].slice(0, Math.floor(Math.random() * 2) + 1),
    cognitive_biases_detected: actualAccuracy < 70 ? [BIASES[Math.floor(Math.random() * BIASES.length)]] : [],
  };
  
  // Generate learning events
  const events: Partial<LearningEvent>[] = [];
  
  // Case started event
  events.push({
    user_id: userId,
    session_id: sessionId,
    case_type: caseType,
    case_id: caseData.id,
    event_type: 'case_started',
    timestamp: startedAt,
    time_elapsed_seconds: 0,
  });
  
  // Generate case-type specific events
  if (caseType === 'clinical') {
    const tests = ['CBC', 'ECG', 'Chest X-ray', 'Troponin', 'D-dimer', 'CT scan'];
    tests.slice(0, (typeSpecificMetrics as ClinicalMetrics).tests_ordered).forEach((test, i) => {
      events.push({
        user_id: userId,
        session_id: sessionId,
        case_type: caseType,
        case_id: caseData.id,
        event_type: 'test_ordered',
        event_data: { test_name: test },
        timestamp: new Date(new Date(startedAt).getTime() + (i + 1) * 30000).toISOString(),
        time_elapsed_seconds: (i + 1) * 30,
      });
    });
  } else if (caseType === 'simulation') {
    const simMetrics = typeSpecificMetrics as SimulationMetrics;
    // Decision events
    for (let i = 0; i < (metric.decisions_made || 3); i++) {
      events.push({
        user_id: userId,
        session_id: sessionId,
        case_type: caseType,
        case_id: caseData.id,
        event_type: 'decision_made',
        timestamp: new Date(new Date(startedAt).getTime() + (i + 1) * 45000).toISOString(),
        time_elapsed_seconds: (i + 1) * 45,
        was_optimal: Math.random() < (actualAccuracy / 100),
      });
    }
    // Warning events
    for (let i = 0; i < simMetrics.warnings_ignored; i++) {
      events.push({
        user_id: userId,
        session_id: sessionId,
        case_type: caseType,
        case_id: caseData.id,
        event_type: 'constraint_warning_shown',
        timestamp: new Date(new Date(startedAt).getTime() + (i + 1) * 60000).toISOString(),
        time_elapsed_seconds: (i + 1) * 60,
      });
    }
  }
  
  // Case completed/abandoned event
  events.push({
    user_id: userId,
    session_id: sessionId,
    case_type: caseType,
    case_id: caseData.id,
    event_type: isCompleted ? 'case_completed' : 'case_abandoned',
    timestamp: metric.completed_at || new Date().toISOString(),
    time_elapsed_seconds: metric.total_duration_seconds || 0,
    was_correct: actualAccuracy > 70,
  });
  
  return { metric, events };
}

// ============================================
// Generate Multiple Sessions
// ============================================

export function generateMockHistory(
  userId: string,
  options?: {
    totalCases?: number;
    caseTypeDistribution?: Record<CaseType, number>;
    averageAccuracy?: number;
  }
): { metrics: Partial<CasePerformanceMetrics>[]; events: Partial<LearningEvent>[] } {
  const totalCases = options?.totalCases ?? 20;
  const distribution = options?.caseTypeDistribution ?? {
    clinical: 0.3,
    simulation: 0.4,
    error: 0.2,
    uncertainty: 0.1,
  };
  const avgAccuracy = options?.averageAccuracy ?? 70;
  
  const allMetrics: Partial<CasePerformanceMetrics>[] = [];
  const allEvents: Partial<LearningEvent>[] = [];
  
  // Generate cases by distribution
  Object.entries(distribution).forEach(([caseType, ratio]) => {
    const count = Math.floor(totalCases * ratio);
    
    for (let i = 0; i < count; i++) {
      // Vary accuracy to create realistic pattern
      const accuracyVariation = Math.random() * 40 - 20; // ±20%
      const session = generateMockCaseSession(userId, caseType as CaseType, {
        accuracy: avgAccuracy + accuracyVariation,
        completed: Math.random() > 0.15, // 85% completion
        recent: i < count * 0.3, // 30% recent cases
      });
      
      allMetrics.push(session.metric);
      allEvents.push(...session.events);
    }
  });
  
  return { metrics: allMetrics, events: allEvents };
}

// ============================================
// Generate Recommendations
// ============================================

export function generateMockRecommendations(userId: string): Partial<CrossCaseRecommendation>[] {
  const recommendations: Partial<CrossCaseRecommendation>[] = [
    {
      user_id: userId,
      recommendation_type: 'skill_gap',
      recommended_case_id: 'sim-004',
      recommended_case_type: 'simulation',
      recommended_case_title: 'Sepsis Recognition: The 1-Hour Bundle',
      primary_reason: 'Your accuracy in emergency cases (65%) is below your overall average (78%). This case will help improve time-critical decision making.',
      supporting_data: { current_accuracy: 65, target_accuracy: 80 },
      priority_score: 85,
    },
    {
      user_id: userId,
      recommendation_type: 'variety',
      recommended_case_id: 'err-001',
      recommended_case_type: 'error',
      recommended_case_title: 'Missed Ectopic Pregnancy',
      primary_reason: 'You have completed 8 simulations but only 1 error case. Diversifying case types improves pattern recognition.',
      supporting_data: { simulation_count: 8, error_count: 1 },
      priority_score: 70,
    },
    {
      user_id: userId,
      recommendation_type: 'mastery',
      recommended_case_id: 'clin-005',
      recommended_case_type: 'clinical',
      recommended_case_title: 'Fever and Joint Pain',
      primary_reason: 'You excel in clinical cases (87% accuracy). This challenging case will push your skills further.',
      supporting_data: { current_accuracy: 87, case_difficulty: 'advanced' },
      priority_score: 60,
    },
  ];
  
  return recommendations;
}

// ============================================
// Save Generated Data
// ============================================

export function saveMockHistoryToStorage(
  userId: string,
  options?: Parameters<typeof generateMockHistory>[1]
): { metricsCount: number; eventsCount: number } {
  const { metrics, events } = generateMockHistory(userId, options);
  
  // Save metrics
  metrics.forEach(metric => savePerformanceMetric(metric));
  
  // Save events
  saveLearningEvents(events);
  
  // Save recommendations
  const recommendations = generateMockRecommendations(userId);
  recommendations.forEach(rec => saveRecommendation(rec));
  
  return {
    metricsCount: metrics.length,
    eventsCount: events.length,
  };
}

// ============================================
// Demo Scenarios
// ============================================

export const DEMO_SCENARIOS = {
  // Beginner student - struggling, needs support
  beginner: {
    totalCases: 15,
    averageAccuracy: 55,
    caseTypeDistribution: { clinical: 0.4, simulation: 0.4, error: 0.1, uncertainty: 0.1 } as Record<CaseType, number>,
    description: 'New student with mixed performance, needs foundational support',
  },
  
  // Intermediate student - improving steadily
  intermediate: {
    totalCases: 25,
    averageAccuracy: 72,
    caseTypeDistribution: { clinical: 0.3, simulation: 0.35, error: 0.2, uncertainty: 0.15 } as Record<CaseType, number>,
    description: 'Improving student showing good progress across case types',
  },
  
  // Advanced student - high performer
  advanced: {
    totalCases: 40,
    averageAccuracy: 88,
    caseTypeDistribution: { clinical: 0.25, simulation: 0.3, error: 0.25, uncertainty: 0.2 } as Record<CaseType, number>,
    description: 'High-performing student ready for challenging cases',
  },
  
  // Specialist - focused on one area, weak in others
  specialist: {
    totalCases: 30,
    averageAccuracy: 85,
    caseTypeDistribution: { clinical: 0.6, simulation: 0.3, error: 0.05, uncertainty: 0.05 } as Record<CaseType, number>,
    description: 'Strong in clinical cases but needs variety in other types',
  },
  
  // Struggling - needs intervention
  struggling: {
    totalCases: 12,
    averageAccuracy: 42,
    caseTypeDistribution: { clinical: 0.5, simulation: 0.3, error: 0.1, uncertainty: 0.1 } as Record<CaseType, number>,
    description: 'Student having difficulty, needs targeted support',
  },
};

export function applyDemoScenario(
  userId: string,
  scenarioKey: keyof typeof DEMO_SCENARIOS
): { message: string; stats: { metricsCount: number; eventsCount: number } } {
  const scenario = DEMO_SCENARIOS[scenarioKey];
  const stats = saveMockHistoryToStorage(userId, {
    totalCases: scenario.totalCases,
    averageAccuracy: scenario.averageAccuracy,
    caseTypeDistribution: scenario.caseTypeDistribution,
  });
  
  return {
    message: `Applied "${scenarioKey}" scenario: ${scenario.description}`,
    stats,
  };
}

// ============================================
// Data Export/Import
// ============================================

export function exportAnalyticsData(): string {
  const data = {
    performanceMetrics: getAllPerformanceMetrics(),
    learningEvents: getAllLearningEvents(),
    recommendations: getAllRecommendations(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAnalyticsData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.performanceMetrics) {
      localStorage.setItem('think_studio_performance_metrics', JSON.stringify(data.performanceMetrics));
    }
    if (data.learningEvents) {
      localStorage.setItem('think_studio_learning_events', JSON.stringify(data.learningEvents));
    }
    if (data.recommendations) {
      localStorage.setItem('think_studio_recommendations', JSON.stringify(data.recommendations));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing analytics data:', error);
    return false;
  }
}

// Helper functions for export/import
function getAllPerformanceMetrics() {
  const data = localStorage.getItem('think_studio_performance_metrics');
  return data ? JSON.parse(data) : [];
}

function getAllLearningEvents() {
  const data = localStorage.getItem('think_studio_learning_events');
  return data ? JSON.parse(data) : [];
}

function getAllRecommendations() {
  const data = localStorage.getItem('think_studio_recommendations');
  return data ? JSON.parse(data) : [];
}

// ============================================
// Clear Data
// ============================================

export function clearMockData(): void {
  localStorage.removeItem('think_studio_performance_metrics');
  localStorage.removeItem('think_studio_learning_events');
  localStorage.removeItem('think_studio_recommendations');
}
