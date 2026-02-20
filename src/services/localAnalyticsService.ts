// LocalStorage Analytics Service
// Simulates Supabase database using browser localStorage
// Perfect for testing without database migrations

import type {
  CasePerformanceMetrics,
  LearningEvent,
  CrossCaseRecommendation,
  CrossCasePerformanceSummary,
  CaseType,
} from '@/types/unifiedAnalytics';

// Storage keys
const STORAGE_KEYS = {
  PERFORMANCE_METRICS: 'think_studio_performance_metrics',
  LEARNING_EVENTS: 'think_studio_learning_events',
  RECOMMENDATIONS: 'think_studio_recommendations',
  USER_PROFILES: 'think_studio_user_profiles',
} as const;

// Generate UUID
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============================================
// Performance Metrics
// ============================================

export function savePerformanceMetric(metric: Partial<CasePerformanceMetrics>): string {
  const id = metric.id || generateUUID();
  const metricWithId = { ...metric, id } as CasePerformanceMetrics;
  
  const existing = getAllPerformanceMetrics();
  const updated = existing.filter(m => m.id !== id);
  updated.push(metricWithId);
  
  localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(updated));
  return id;
}

export function updatePerformanceMetric(
  id: string, 
  updates: Partial<CasePerformanceMetrics>
): boolean {
  const existing = getAllPerformanceMetrics();
  const index = existing.findIndex(m => m.id === id);
  
  if (index === -1) return false;
  
  existing[index] = { ...existing[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(existing));
  return true;
}

export function getPerformanceMetric(id: string): CasePerformanceMetrics | null {
  const metrics = getAllPerformanceMetrics();
  return metrics.find(m => m.id === id) || null;
}

export function getAllPerformanceMetrics(): CasePerformanceMetrics[] {
  const data = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_METRICS);
  return data ? JSON.parse(data) : [];
}

export function getUserPerformanceMetrics(userId: string): CasePerformanceMetrics[] {
  return getAllPerformanceMetrics().filter(m => m.user_id === userId);
}

export function deletePerformanceMetric(id: string): boolean {
  const existing = getAllPerformanceMetrics();
  const filtered = existing.filter(m => m.id !== id);
  
  if (filtered.length === existing.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(filtered));
  return true;
}

// ============================================
// Learning Events
// ============================================

export function saveLearningEvent(event: Partial<LearningEvent>): string {
  const id = event.id || generateUUID();
  const eventWithId = { 
    ...event, 
    id,
    timestamp: event.timestamp || new Date().toISOString(),
  } as LearningEvent;
  
  const existing = getAllLearningEvents();
  existing.push(eventWithId);
  
  // Keep only last 1000 events to prevent storage overflow
  if (existing.length > 1000) {
    existing.splice(0, existing.length - 1000);
  }
  
  localStorage.setItem(STORAGE_KEYS.LEARNING_EVENTS, JSON.stringify(existing));
  return id;
}

export function saveLearningEvents(events: Partial<LearningEvent>[]): string[] {
  return events.map(e => saveLearningEvent(e));
}

export function getAllLearningEvents(): LearningEvent[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEARNING_EVENTS);
  return data ? JSON.parse(data) : [];
}

export function getUserLearningEvents(userId: string): LearningEvent[] {
  return getAllLearningEvents().filter(e => e.user_id === userId);
}

export function getSessionLearningEvents(sessionId: string): LearningEvent[] {
  return getAllLearningEvents().filter(e => e.session_id === sessionId);
}

export function clearLearningEvents(): void {
  localStorage.removeItem(STORAGE_KEYS.LEARNING_EVENTS);
}

// ============================================
// Cross-Case Performance
// ============================================

export function getUserCrossCasePerformance(userId: string): CrossCasePerformanceSummary[] {
  const metrics = getUserPerformanceMetrics(userId);
  
  // Group by case type
  const byType = metrics.reduce((acc, metric) => {
    const type = metric.case_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(metric);
    return acc;
  }, {} as Record<string, CasePerformanceMetrics[]>);
  
  // Calculate summaries
  return Object.entries(byType).map(([case_type, typeMetrics]) => {
    const completed = typeMetrics.filter(m => m.completion_status === 'completed');
    
    return {
      case_type: case_type as CaseType,
      total_cases: typeMetrics.length,
      completed_cases: completed.length,
      avg_accuracy: completed.length > 0
        ? completed.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / completed.length
        : null,
      avg_efficiency: completed.length > 0
        ? completed.reduce((sum, m) => sum + (m.efficiency_score || 0), 0) / completed.length
        : null,
      last_completed_at: completed.length > 0
        ? completed.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0].completed_at
        : null,
    };
  });
}

export function getUserWeakestCaseType(userId: string): CaseType | null {
  const performance = getUserCrossCasePerformance(userId);
  
  // Filter types with at least 3 completed cases
  const qualified = performance.filter(p => p.completed_cases >= 3 && p.avg_accuracy !== null);
  
  if (qualified.length === 0) return null;
  
  // Return type with lowest accuracy
  return qualified.sort((a, b) => (a.avg_accuracy || 100) - (b.avg_accuracy || 100))[0].case_type;
}

export function calculateLearningVelocity(userId: string, caseType: CaseType): number {
  const metrics = getUserPerformanceMetrics(userId)
    .filter(m => m.case_type === caseType && m.completion_status === 'completed')
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  
  if (metrics.length < 6) return 0; // Need at least 6 cases for meaningful velocity
  
  const earlyCases = metrics.slice(0, 3);
  const recentCases = metrics.slice(-3);
  
  const earlyAvg = earlyCases.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / 3;
  const recentAvg = recentCases.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / 3;
  
  if (earlyAvg === 0) return 0;
  
  return ((recentAvg - earlyAvg) / earlyAvg) * 100;
}

// ============================================
// Recommendations
// ============================================

export function saveRecommendation(recommendation: Partial<CrossCaseRecommendation>): string {
  const id = recommendation.id || generateUUID();
  const recWithId = { 
    ...recommendation, 
    id,
    created_at: recommendation.created_at || new Date().toISOString(),
  } as CrossCaseRecommendation;
  
  const existing = getAllRecommendations();
  const updated = existing.filter(r => r.id !== id);
  updated.push(recWithId);
  
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(updated));
  return id;
}

export function getAllRecommendations(): CrossCaseRecommendation[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS);
  return data ? JSON.parse(data) : [];
}

export function getUserRecommendations(userId: string): CrossCaseRecommendation[] {
  return getAllRecommendations()
    .filter(r => r.user_id === userId && !r.was_viewed)
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5);
}

export function markRecommendationViewed(id: string): boolean {
  const existing = getAllRecommendations();
  const index = existing.findIndex(r => r.id === id);
  
  if (index === -1) return false;
  
  existing[index].was_viewed = true;
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(existing));
  return true;
}

export function markRecommendationAccepted(id: string): boolean {
  const existing = getAllRecommendations();
  const index = existing.findIndex(r => r.id === id);
  
  if (index === -1) return false;
  
  existing[index].was_accepted = true;
  existing[index].accepted_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(existing));
  return true;
}

// ============================================
// Statistics & Analytics
// ============================================

export function getUserStats(userId: string) {
  const metrics = getUserPerformanceMetrics(userId);
  const completed = metrics.filter(m => m.completion_status === 'completed');
  
  return {
    totalCases: metrics.length,
    completedCases: completed.length,
    abandonedCases: metrics.filter(m => m.completion_status === 'abandoned').length,
    averageAccuracy: completed.length > 0
      ? completed.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / completed.length
      : 0,
    totalTimeSpent: completed.reduce((sum, m) => sum + (m.total_duration_seconds || 0), 0),
    totalCost: completed.reduce((sum, m) => sum + (m.total_cost || 0), 0),
    hintsUsed: completed.reduce((sum, m) => sum + (m.hints_used || 0), 0),
    byCaseType: getUserCrossCasePerformance(userId),
  };
}

export function getGlobalStats() {
  const allMetrics = getAllPerformanceMetrics();
  const allEvents = getAllLearningEvents();
  
  return {
    totalUsers: new Set(allMetrics.map(m => m.user_id)).size,
    totalCases: allMetrics.length,
    totalEvents: allEvents.length,
    byCaseType: Object.values(CASE_TYPES).map(type => ({
      type: type.id,
      count: allMetrics.filter(m => m.case_type === type.id).length,
    })),
  };
}

// ============================================
// Data Management
// ============================================

export function clearAllAnalyticsData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

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
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(data.performanceMetrics));
    }
    if (data.learningEvents) {
      localStorage.setItem(STORAGE_KEYS.LEARNING_EVENTS, JSON.stringify(data.learningEvents));
    }
    if (data.recommendations) {
      localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(data.recommendations));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing analytics data:', error);
    return false;
  }
}

export function getStorageUsage(): Record<string, number> {
  return Object.entries(STORAGE_KEYS).reduce((acc, [key, storageKey]) => {
    const data = localStorage.getItem(storageKey);
    acc[key] = data ? new Blob([data]).size : 0;
    return acc;
  }, {} as Record<string, number>);
}

// Import CASE_TYPES
import { CASE_TYPES } from '@/types/unifiedAnalytics';

// Re-export for convenience
export { CASE_TYPES };
