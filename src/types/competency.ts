/**
 * Competency Framework Types
 * 
 * Implements the hierarchical competency model from the research paper:
 * Domain → Competency → Capability → Skill → Challenge
 * 
 * Each node in the tree can have assessment criteria and mastery tracking.
 */

// ============================================
// Competency Tree Types
// ============================================

export type CompetencyLevel = 'domain' | 'competency' | 'capability' | 'skill' | 'challenge';

/**
 * A single node in the competency hierarchy.
 */
export interface CompetencyNode {
    id: string;
    parentId: string | null;
    level: CompetencyLevel;
    name: string;
    description: string;
    /** Criteria used to assess this competency */
    assessmentCriteria: {
        /** Minimum score (0-100) to consider mastered */
        masteryThreshold?: number;
        /** Minimum number of successful attempts */
        requiredAttempts?: number;
        /** Specific skills or metrics to evaluate */
        metrics?: string[];
    };
    /** Visual configuration */
    color?: string;
    icon?: string;

    // ---- UML Domain Model extensions ----

    /** Proficiency level (0–100) — used for Skill-level nodes. UML: Skill.proficiency */
    proficiency?: number;
    /** Difficulty level — used for Challenge-level nodes. UML: Challenge.difficultyLevel */
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    /** Clinical context — used for Challenge-level nodes. UML: Challenge.clinicalContext */
    clinicalContext?: string;
}

/**
 * A learner's progress on a specific competency node.
 */
export interface LearnerCompetency {
    userId: string;
    competencyNodeId: string;
    /** Current mastery level (0-100) */
    masteryLevel: number;
    /** Number of assessment attempts */
    attempts: number;
    /** Last assessment timestamp */
    lastAssessedAt: string | null;
    /** Historical scores for trajectory visualization */
    trajectory: Array<{
        date: string;
        score: number;
        sessionId?: string;
    }>;
}

/**
 * Mapping between a simulation case and the competency nodes it assesses.
 */
export interface CaseCompetencyMapping {
    caseId: string;
    competencyNodeIds: string[];
    /** Weight per competency (how much this case contributes to that competency) */
    weights: Record<string, number>;
}

// ============================================
// Competency Tree Helpers
// ============================================

/**
 * Flattened view of a competency tree with depth info.
 */
export interface CompetencyTreeNode extends CompetencyNode {
    depth: number;
    children: CompetencyTreeNode[];
    mastery?: number; // populated from learner data
}

/**
 * Summary statistics for a competency subtree.
 */
export interface CompetencySubtreeSummary {
    nodeId: string;
    nodeName: string;
    level: CompetencyLevel;
    avgMastery: number;
    totalAttempts: number;
    childCount: number;
    lowestChild?: { name: string; mastery: number };
}

// ============================================
// UML Domain Model Utility Functions
// ============================================

/**
 * Evaluate a competency node against a learner's mastery.
 * UML: Competency.evaluate()
 */
export function evaluateCompetency(
    node: CompetencyNode,
    learner: LearnerCompetency,
): { mastered: boolean; gap: number } {
    const threshold = node.assessmentCriteria.masteryThreshold ?? 70;
    const required = node.assessmentCriteria.requiredAttempts ?? 1;
    const mastered = learner.masteryLevel >= threshold && learner.attempts >= required;
    const gap = Math.max(0, threshold - learner.masteryLevel);
    return { mastered, gap };
}

/**
 * Mobilize a Capability node — determine if prerequisites are met.
 * UML: Capability.mobilize()
 */
export function mobilizeCapability(
    node: CompetencyNode,
    childMasteries: number[],
): { ready: boolean; avgChildMastery: number } {
    if (node.level !== 'capability') {
        return { ready: false, avgChildMastery: 0 };
    }
    const avg = childMasteries.length > 0
        ? childMasteries.reduce((a, b) => a + b, 0) / childMasteries.length
        : 0;
    const threshold = node.assessmentCriteria.masteryThreshold ?? 60;
    return { ready: avg >= threshold, avgChildMastery: avg };
}

/**
 * Perform a Skill-level check — returns proficiency status.
 * UML: Skill.perform()
 */
export function performSkill(
    node: CompetencyNode,
): { proficiency: number; performable: boolean } {
    const proficiency = node.proficiency ?? 0;
    const threshold = node.assessmentCriteria.masteryThreshold ?? 50;
    return { proficiency, performable: proficiency >= threshold };
}
