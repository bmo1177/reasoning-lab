// Adaptive Case Selection Algorithm
// Selects optimal simulation cases based on learner profile and performance

import type { BranchingCase } from '@/types/simulation';
import type { UserSkillProfile, AdaptiveRecommendation } from '@/types/analytics';
import { sampleBranchingCases } from '@/data/sampleBranchingCases';
import { getUserSkillProfile, getUserSimulationHistory } from '@/services/analyticsService';

interface CaseSelectionCriteria {
  userId: string;
  targetSpecialty?: string;
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  avoidRecentCases?: boolean;
  focusOnWeaknesses?: boolean;
  maxComplexity?: number;
  excludeCaseIds?: string[];
}

interface ScoredCase {
  case: BranchingCase;
  score: number;
  reasons: string[];
}

/**
 * Main adaptive case selection function
 * Analyzes user profile and selects best matching cases
 */
export async function selectAdaptiveCase(
  criteria: CaseSelectionCriteria
): Promise<AdaptiveRecommendation | null> {
  const { userId } = criteria;
  
  // Get user data
  const [userProfile, recentSessions] = await Promise.all([
    getUserSkillProfile(userId),
    getUserSimulationHistory(userId, 20),
  ]);

  if (!userProfile) {
    // New user - return beginner case from random specialty
    // Pass excludeCaseIds to avoid duplicates
    return getDefaultRecommendation(criteria.excludeCaseIds);
  }

  // Get recently completed case IDs
  const recentCaseIds = new Set(
    recentSessions.map(s => s.case_id)
  );

  // Score all available cases
  const scoredCases: ScoredCase[] = sampleBranchingCases.map(caseData => {
    const score = calculateCaseScore(caseData, userProfile, recentCaseIds, criteria);
    return {
      case: caseData,
      score: score.totalScore,
      reasons: score.reasons,
    };
  });

  // Filter out excluded cases
  const filteredCases = scoredCases.filter(
    sc => !criteria.excludeCaseIds?.includes(sc.case.id)
  );

  // Filter out recent cases if requested
  if (criteria.avoidRecentCases !== false) {
    const filtered = filteredCases.filter(
      sc => !recentCaseIds.has(sc.case.id)
    );
    if (filtered.length > 0) {
      scoredCases.length = 0;
      scoredCases.push(...filtered);
    }
  }

  // Sort by score descending
  scoredCases.sort((a, b) => b.score - a.score);

  // Return top recommendation
  if (scoredCases.length === 0) {
    return null;
  }

  const topChoice = scoredCases[0];

  return {
    caseId: topChoice.case.id,
    reason: topChoice.reasons.join('. '),
    expectedDifficulty: calculateExpectedDifficulty(topChoice.case, userProfile),
    targetedObjectives: identifyTargetedObjectives(topChoice.case, userProfile),
    targetedWeaknesses: identifyTargetedWeaknesses(topChoice.case, userProfile),
  };
}

/**
 * Calculate comprehensive score for a case
 */
function calculateCaseScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile,
  recentCaseIds: Set<string>,
  criteria: CaseSelectionCriteria
): { totalScore: number; reasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // 1. Difficulty Match (0-25 points)
  const difficultyScore = calculateDifficultyScore(caseData, userProfile, criteria);
  score += difficultyScore.points;
  if (difficultyScore.reason) reasons.push(difficultyScore.reason);

  // 2. Specialty Relevance (0-20 points)
  const specialtyScore = calculateSpecialtyScore(caseData, userProfile, criteria);
  score += specialtyScore.points;
  if (specialtyScore.reason) reasons.push(specialtyScore.reason);

  // 3. Learning Objective Coverage (0-15 points)
  const objectiveScore = calculateObjectiveScore(caseData, userProfile);
  score += objectiveScore.points;
  if (objectiveScore.reason) reasons.push(objectiveScore.reason);

  // 4. Weakness Targeting (0-20 points)
  if (criteria.focusOnWeaknesses !== false) {
    const weaknessScore = calculateWeaknessScore(caseData, userProfile);
    score += weaknessScore.points;
    if (weaknessScore.reason) reasons.push(weaknessScore.reason);
  }

  // 5. Recency Penalty (-20 to 0 points)
  if (recentCaseIds.has(caseData.id)) {
    score -= 20;
    reasons.push('Recently completed');
  }

  // 6. Complexity Match (0-10 points)
  if (criteria.maxComplexity && caseData.complexityScore) {
    if (caseData.complexityScore <= criteria.maxComplexity) {
      score += 10;
    } else {
      score -= 10;
      reasons.push('Exceeds complexity limit');
    }
  }

  // 7. Diversity Bonus (0-10 points)
  const diversityScore = calculateDiversityScore(caseData, userProfile);
  score += diversityScore.points;
  if (diversityScore.reason) reasons.push(diversityScore.reason);

  return { totalScore: Math.max(0, Math.min(100, score)), reasons };
}

/**
 * Calculate difficulty appropriateness score
 */
function calculateDifficultyScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile,
  criteria: CaseSelectionCriteria
): { points: number; reason: string | null } {
  const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 };
  const caseLevel = difficultyLevels[caseData.difficulty];
  
  // Determine user's appropriate level
  let userLevel = difficultyLevels[userProfile.preferred_difficulty as keyof typeof difficultyLevels] || 2;
  
  // Adjust based on overall accuracy
  if (userProfile.overall_accuracy !== null) {
    if (userProfile.overall_accuracy >= 85) userLevel = Math.min(3, userLevel + 1);
    else if (userProfile.overall_accuracy < 60) userLevel = Math.max(1, userLevel - 1);
  }

  // If specific difficulty requested, prioritize it
  if (criteria.preferredDifficulty) {
    const requestedLevel = difficultyLevels[criteria.preferredDifficulty];
    const diff = Math.abs(caseLevel - requestedLevel);
    
    if (diff === 0) return { points: 25, reason: `Matches requested ${caseData.difficulty} difficulty` };
    if (diff === 1) return { points: 15, reason: `Close to requested difficulty` };
    return { points: 5, reason: 'Difficulty mismatch' };
  }

  // Otherwise match to user level
  const diff = Math.abs(caseLevel - userLevel);
  
  if (diff === 0) return { points: 20, reason: `Appropriate ${caseData.difficulty} difficulty for your level` };
  if (diff === 1) return { points: 10, reason: 'Slightly challenging difficulty' };
  return { points: 0, reason: 'Difficulty not optimal' };
}

/**
 * Calculate specialty relevance score
 */
function calculateSpecialtyScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile,
  criteria: CaseSelectionCriteria
): { points: number; reason: string | null } {
  // If specific specialty requested
  if (criteria.targetSpecialty) {
    if (caseData.specialty === criteria.targetSpecialty) {
      return { points: 20, reason: `Matches requested ${caseData.specialty} specialty` };
    }
    return { points: 0, reason: 'Different specialty than requested' };
  }

  // Check if it's a weak area
  if (userProfile.weakness_areas.includes(caseData.specialty)) {
    return { points: 18, reason: `Targets your weak area: ${caseData.specialty}` };
  }

  // Check if it's a strong area
  if (userProfile.strength_areas.includes(caseData.specialty)) {
    return { points: 12, reason: `Builds on your strength: ${caseData.specialty}` };
  }

  // Check specialty skill level
  const specialtySkill = userProfile.specialty_skills[caseData.specialty];
  if (specialtySkill) {
    if (specialtySkill.accuracy < 70) {
      return { points: 15, reason: `Practice needed in ${caseData.specialty}` };
    }
    return { points: 10, reason: `Reinforces ${caseData.specialty} skills` };
  }

  // New specialty
  return { points: 14, reason: `Expands into ${caseData.specialty}` };
}

/**
 * Calculate learning objective coverage score
 */
function calculateObjectiveScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): { points: number; reason: string | null } {
  const caseObjectives = caseData.learningObjectives || [];
  
  // Count how many objectives would be new learning
  // In a real system, you'd track which objectives user has already achieved
  const newObjectives = caseObjectives.length;
  
  if (newObjectives >= 4) {
    return { points: 15, reason: 'Rich learning content with multiple objectives' };
  } else if (newObjectives >= 2) {
    return { points: 10, reason: 'Good learning objectives coverage' };
  }
  return { points: 5, reason: 'Limited new learning objectives' };
}

/**
 * Calculate weakness targeting score
 */
function calculateWeaknessScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): { points: number; reason: string | null } {
  let matches = 0;
  const caseText = `${caseData.title} ${caseData.description}`.toLowerCase();

  // Check if case addresses user's weaknesses
  for (const weakness of userProfile.weakness_areas) {
    if (caseText.includes(weakness.toLowerCase())) {
      matches++;
    }
  }

  // Check for cognitive bias targets
  for (const bias of userProfile.frequent_biases) {
    // Cases that challenge specific biases
    if (caseData.complexityScore && caseData.complexityScore > 7) {
      matches += 0.5; // Complex cases often challenge biases
    }
  }

  if (matches >= 2) {
    return { points: 20, reason: 'Directly addresses multiple areas for improvement' };
  } else if (matches === 1) {
    return { points: 12, reason: 'Targets an area for improvement' };
  }
  return { points: 5, reason: 'Limited connection to improvement areas' };
}

/**
 * Calculate diversity score to ensure variety
 */
function calculateDiversityScore(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): { points: number; reason: string | null } {
  const completedSpecialties = Object.keys(userProfile.specialty_skills);
  
  // Bonus for specialties with fewer attempts
  if (!completedSpecialties.includes(caseData.specialty)) {
    return { points: 10, reason: 'New specialty for variety' };
  }

  const specialtyCount = userProfile.specialty_skills[caseData.specialty]?.cases_completed || 0;
  
  if (specialtyCount < 3) {
    return { points: 8, reason: 'Builds experience in this specialty' };
  } else if (specialtyCount > 10) {
    return { points: 2, reason: 'Familiar specialty' };
  }
  return { points: 5, reason: 'Moderate variety' };
}

/**
 * Calculate expected difficulty based on user performance
 */
function calculateExpectedDifficulty(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): string {
  const baseDifficulty = caseData.difficulty;
  const userAccuracy = userProfile.overall_accuracy || 70;
  const specialtyAccuracy = userProfile.specialty_skills[caseData.specialty]?.accuracy || 70;

  // If user is performing well in this specialty
  if (specialtyAccuracy > 80) {
    if (baseDifficulty === 'beginner') return 'easy';
    if (baseDifficulty === 'intermediate') return 'moderate';
    return 'challenging but achievable';
  }

  // If user is struggling
  if (specialtyAccuracy < 60) {
    if (baseDifficulty === 'advanced') return 'very challenging';
    if (baseDifficulty === 'intermediate') return 'challenging';
    return 'appropriate';
  }

  return 'appropriate';
}

/**
 * Identify which learning objectives will be targeted
 */
function identifyTargetedObjectives(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): string[] {
  // In production, you'd track which objectives user has already mastered
  // For now, return first 3 objectives
  return caseData.learningObjectives?.slice(0, 3) || [];
}

/**
 * Identify which weaknesses will be addressed
 */
function identifyTargetedWeaknesses(
  caseData: BranchingCase,
  userProfile: UserSkillProfile
): string[] {
  const targeted: string[] = [];
  const caseText = `${caseData.title} ${caseData.description}`.toLowerCase();

  for (const weakness of userProfile.weakness_areas) {
    if (caseText.includes(weakness.toLowerCase())) {
      targeted.push(weakness);
    }
  }

  return targeted.slice(0, 3);
}

/**
 * Get default recommendation for new users
 * Respects excludeCaseIds to avoid duplicates
 */
function getDefaultRecommendation(excludeCaseIds?: string[]): AdaptiveRecommendation {
  const beginnerCases = sampleBranchingCases.filter(
    c => c.difficulty === 'beginner' && !excludeCaseIds?.includes(c.id)
  );
  
  // If all beginner cases excluded, try any difficulty
  const availableCases = beginnerCases.length > 0 
    ? beginnerCases 
    : sampleBranchingCases.filter(c => !excludeCaseIds?.includes(c.id));
  
  // If no cases available at all, return random from all cases
  const casesToChoose = availableCases.length > 0 ? availableCases : sampleBranchingCases;
  const randomCase = casesToChoose[Math.floor(Math.random() * casesToChoose.length)];

  return {
    caseId: randomCase.id,
    reason: 'Starting with a beginner case to assess your baseline performance',
    expectedDifficulty: 'appropriate for beginners',
    targetedObjectives: randomCase.learningObjectives?.slice(0, 2) || [],
    targetedWeaknesses: [],
  };
}

/**
 * Get multiple recommendations (for "Choose Your Case" feature)
 */
export async function getMultipleRecommendations(
  criteria: CaseSelectionCriteria,
  count: number = 3
): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];
  const excludeIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const recommendation = await selectAdaptiveCase({
      ...criteria,
      excludeCaseIds: [...excludeIds, ...(criteria.excludeCaseIds || [])],
    });

    if (recommendation) {
      recommendations.push(recommendation);
      excludeIds.push(recommendation.caseId);
    }
  }

  return recommendations;
}

/**
 * Generate explanation for why a case was selected
 */
export function generateRecommendationExplanation(
  recommendation: AdaptiveRecommendation
): string {
  const parts: string[] = [];

  parts.push(recommendation.reason);

  if (recommendation.targetedWeaknesses.length > 0) {
    parts.push(
      `This case will help you improve: ${recommendation.targetedWeaknesses.join(', ')}`
    );
  }

  if (recommendation.targetedObjectives.length > 0) {
    parts.push(
      `You'll practice: ${recommendation.targetedObjectives.join(', ')}`
    );
  }

  parts.push(`Expected difficulty: ${recommendation.expectedDifficulty}`);

  return parts.join('. ');
}
