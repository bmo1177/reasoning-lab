/**
 * Competency Service
 * 
 * Manages the competency framework hierarchy, learner mastery tracking,
 * and case-to-competency mappings. Provides tree building, mastery
 * assessment, and trajectory analysis.
 */

import type {
    CompetencyNode,
    CompetencyLevel,
    LearnerCompetency,
    CaseCompetencyMapping,
    CompetencyTreeNode,
    CompetencySubtreeSummary,
} from '@/types/competency';

// ============================================
// Seed Data — Initial Competency Tree
// ============================================

/**
 * Base competency tree for medical clinical reasoning.
 * This will be stored in the database in production (seeded via migration).
 * Currently hardcoded for Phase 1; admin-editable in Phase 4.
 */
export const COMPETENCY_TREE: CompetencyNode[] = [
    // Domain: Clinical Reasoning
    {
        id: 'domain-clinical-reasoning',
        parentId: null,
        level: 'domain',
        name: 'Clinical Reasoning',
        description: 'Ability to systematically approach clinical problems',
        assessmentCriteria: { masteryThreshold: 70 },
        color: 'blue',
    },

    // Competency: Diagnostic Reasoning
    {
        id: 'comp-diagnostic-reasoning',
        parentId: 'domain-clinical-reasoning',
        level: 'competency',
        name: 'Diagnostic Reasoning',
        description: 'Formulating and refining differential diagnoses',
        assessmentCriteria: { masteryThreshold: 65, requiredAttempts: 3 },
    },
    {
        id: 'cap-history-taking',
        parentId: 'comp-diagnostic-reasoning',
        level: 'capability',
        name: 'History Taking',
        description: 'Gathering relevant patient history systematically',
        assessmentCriteria: { masteryThreshold: 60, metrics: ['questions_asked', 'relevant_info_gathered'] },
    },
    {
        id: 'skill-focused-questions',
        parentId: 'cap-history-taking',
        level: 'skill',
        name: 'Focused Questioning',
        description: 'Asking targeted questions based on differential diagnosis',
        assessmentCriteria: { masteryThreshold: 60 },
    },
    {
        id: 'cap-test-selection',
        parentId: 'comp-diagnostic-reasoning',
        level: 'capability',
        name: 'Test Selection',
        description: 'Choosing appropriate diagnostic tests cost-effectively',
        assessmentCriteria: { masteryThreshold: 60, metrics: ['test_appropriateness', 'cost_efficiency'] },
    },
    {
        id: 'skill-test-ordering',
        parentId: 'cap-test-selection',
        level: 'skill',
        name: 'Test Ordering Priority',
        description: 'Ordering tests from most to least informative',
        assessmentCriteria: { masteryThreshold: 60 },
    },
    {
        id: 'cap-pattern-recognition',
        parentId: 'comp-diagnostic-reasoning',
        level: 'capability',
        name: 'Pattern Recognition',
        description: 'Identifying clinical patterns from signs and symptoms',
        assessmentCriteria: { masteryThreshold: 65, metrics: ['correct_diagnosis', 'time_to_diagnosis'] },
    },

    // Competency: Therapeutic Decision-Making
    {
        id: 'comp-therapeutic-dm',
        parentId: 'domain-clinical-reasoning',
        level: 'competency',
        name: 'Therapeutic Decision-Making',
        description: 'Selecting and managing appropriate treatments',
        assessmentCriteria: { masteryThreshold: 70, requiredAttempts: 3 },
    },
    {
        id: 'cap-treatment-selection',
        parentId: 'comp-therapeutic-dm',
        level: 'capability',
        name: 'Treatment Selection',
        description: 'Choosing evidence-based treatment options',
        assessmentCriteria: { masteryThreshold: 65, metrics: ['treatment_appropriateness'] },
    },
    {
        id: 'skill-drug-selection',
        parentId: 'cap-treatment-selection',
        level: 'skill',
        name: 'Pharmacological Selection',
        description: 'Choosing appropriate medications considering contraindications',
        assessmentCriteria: { masteryThreshold: 65 },
    },
    {
        id: 'cap-urgency-assessment',
        parentId: 'comp-therapeutic-dm',
        level: 'capability',
        name: 'Urgency Assessment',
        description: 'Correctly triaging and prioritizing interventions',
        assessmentCriteria: { masteryThreshold: 70, metrics: ['triage_accuracy', 'time_management'] },
    },

    // Competency: Patient Safety
    {
        id: 'comp-patient-safety',
        parentId: 'domain-clinical-reasoning',
        level: 'competency',
        name: 'Patient Safety',
        description: 'Avoiding harm through safe clinical practice',
        assessmentCriteria: { masteryThreshold: 80, requiredAttempts: 2 },
    },
    {
        id: 'cap-contraindication-awareness',
        parentId: 'comp-patient-safety',
        level: 'capability',
        name: 'Contraindication Awareness',
        description: 'Identifying and avoiding contraindicated interventions',
        assessmentCriteria: { masteryThreshold: 80, metrics: ['constraint_violations'] },
    },
    {
        id: 'cap-monitoring',
        parentId: 'comp-patient-safety',
        level: 'capability',
        name: 'Patient Monitoring',
        description: 'Appropriately monitoring patient response to interventions',
        assessmentCriteria: { masteryThreshold: 70, metrics: ['monitoring_frequency', 'vital_sign_tracking'] },
    },

    // Competency: Clinical Communication
    {
        id: 'comp-communication',
        parentId: 'domain-clinical-reasoning',
        level: 'competency',
        name: 'Clinical Communication',
        description: 'Effective communication with patients and team members',
        assessmentCriteria: { masteryThreshold: 60, requiredAttempts: 2 },
    },
    {
        id: 'cap-consultation',
        parentId: 'comp-communication',
        level: 'capability',
        name: 'Consultation Skills',
        description: 'Knowing when and how to consult specialists',
        assessmentCriteria: { masteryThreshold: 60, metrics: ['consultation_appropriateness'] },
    },
];

/**
 * Case-to-competency mappings for the existing 15 simulation cases.
 * Maps each case to the competencies it assesses.
 */
export const CASE_COMPETENCY_MAPPINGS: CaseCompetencyMapping[] = [
    {
        caseId: 'sim-001', // Chest Pain
        competencyNodeIds: ['comp-diagnostic-reasoning', 'cap-pattern-recognition', 'comp-therapeutic-dm', 'cap-urgency-assessment'],
        weights: { 'comp-diagnostic-reasoning': 0.3, 'cap-pattern-recognition': 0.3, 'comp-therapeutic-dm': 0.2, 'cap-urgency-assessment': 0.2 },
    },
    {
        caseId: 'sim-002', // Pneumonia
        competencyNodeIds: ['comp-diagnostic-reasoning', 'cap-test-selection', 'cap-treatment-selection'],
        weights: { 'comp-diagnostic-reasoning': 0.4, 'cap-test-selection': 0.3, 'cap-treatment-selection': 0.3 },
    },
    {
        caseId: 'sim-003', // Stroke
        competencyNodeIds: ['cap-urgency-assessment', 'cap-pattern-recognition', 'comp-patient-safety'],
        weights: { 'cap-urgency-assessment': 0.4, 'cap-pattern-recognition': 0.3, 'comp-patient-safety': 0.3 },
    },
    {
        caseId: 'sim-004', // Appendicitis
        competencyNodeIds: ['comp-diagnostic-reasoning', 'cap-history-taking', 'cap-treatment-selection'],
        weights: { 'comp-diagnostic-reasoning': 0.3, 'cap-history-taking': 0.4, 'cap-treatment-selection': 0.3 },
    },
    {
        caseId: 'sim-005', // Asthma Exacerbation
        competencyNodeIds: ['cap-urgency-assessment', 'cap-treatment-selection', 'cap-monitoring'],
        weights: { 'cap-urgency-assessment': 0.3, 'cap-treatment-selection': 0.4, 'cap-monitoring': 0.3 },
    },
    {
        caseId: 'sim-006', // Sepsis
        competencyNodeIds: ['cap-urgency-assessment', 'comp-patient-safety', 'cap-treatment-selection', 'cap-monitoring'],
        weights: { 'cap-urgency-assessment': 0.3, 'comp-patient-safety': 0.3, 'cap-treatment-selection': 0.2, 'cap-monitoring': 0.2 },
    },
    {
        caseId: 'sim-007', // DKA
        competencyNodeIds: ['comp-diagnostic-reasoning', 'cap-contraindication-awareness', 'cap-monitoring'],
        weights: { 'comp-diagnostic-reasoning': 0.3, 'cap-contraindication-awareness': 0.4, 'cap-monitoring': 0.3 },
    },
    {
        caseId: 'sim-008', // Heart Failure
        competencyNodeIds: ['cap-pattern-recognition', 'cap-treatment-selection', 'skill-drug-selection'],
        weights: { 'cap-pattern-recognition': 0.3, 'cap-treatment-selection': 0.3, 'skill-drug-selection': 0.4 },
    },
    {
        caseId: 'sim-009', // Meningitis
        competencyNodeIds: ['cap-urgency-assessment', 'cap-test-selection', 'comp-patient-safety'],
        weights: { 'cap-urgency-assessment': 0.4, 'cap-test-selection': 0.3, 'comp-patient-safety': 0.3 },
    },
    {
        caseId: 'sim-010', // GI Bleed
        competencyNodeIds: ['cap-urgency-assessment', 'cap-monitoring', 'cap-treatment-selection'],
        weights: { 'cap-urgency-assessment': 0.4, 'cap-monitoring': 0.3, 'cap-treatment-selection': 0.3 },
    },
    {
        caseId: 'sim-011', // Anaphylaxis
        competencyNodeIds: ['cap-urgency-assessment', 'cap-treatment-selection', 'comp-patient-safety'],
        weights: { 'cap-urgency-assessment': 0.4, 'cap-treatment-selection': 0.3, 'comp-patient-safety': 0.3 },
    },
    {
        caseId: 'sim-012', // Diabetic Emergency
        competencyNodeIds: ['comp-diagnostic-reasoning', 'cap-contraindication-awareness', 'cap-monitoring'],
        weights: { 'comp-diagnostic-reasoning': 0.3, 'cap-contraindication-awareness': 0.4, 'cap-monitoring': 0.3 },
    },
    {
        caseId: 'sim-013', // Trauma
        competencyNodeIds: ['cap-urgency-assessment', 'cap-monitoring', 'comp-patient-safety'],
        weights: { 'cap-urgency-assessment': 0.4, 'cap-monitoring': 0.3, 'comp-patient-safety': 0.3 },
    },
    {
        caseId: 'sim-014', // Pediatric Fever
        competencyNodeIds: ['cap-history-taking', 'skill-focused-questions', 'cap-test-selection'],
        weights: { 'cap-history-taking': 0.4, 'skill-focused-questions': 0.3, 'cap-test-selection': 0.3 },
    },
    {
        caseId: 'sim-015', // Mental Health Crisis
        competencyNodeIds: ['cap-history-taking', 'cap-consultation', 'comp-communication'],
        weights: { 'cap-history-taking': 0.3, 'cap-consultation': 0.3, 'comp-communication': 0.4 },
    },
];

// ============================================
// Tree Operations
// ============================================

/**
 * Build a tree structure from the flat nodes array.
 */
export function buildCompetencyTree(
    nodes: CompetencyNode[],
    learnerData?: LearnerCompetency[]
): CompetencyTreeNode[] {
    const nodeMap = new Map<string, CompetencyTreeNode>();
    const masteryMap = new Map<string, number>();

    // Build mastery lookup
    if (learnerData) {
        for (const lc of learnerData) {
            masteryMap.set(lc.competencyNodeId, lc.masteryLevel);
        }
    }

    // Create tree nodes
    for (const node of nodes) {
        nodeMap.set(node.id, {
            ...node,
            depth: 0,
            children: [],
            mastery: masteryMap.get(node.id),
        });
    }

    // Build parent-child relationships
    const roots: CompetencyTreeNode[] = [];
    for (const node of nodeMap.values()) {
        if (node.parentId && nodeMap.has(node.parentId)) {
            nodeMap.get(node.parentId)!.children.push(node);
        } else if (!node.parentId) {
            roots.push(node);
        }
    }

    // Calculate depths
    function setDepth(node: CompetencyTreeNode, depth: number) {
        node.depth = depth;
        for (const child of node.children) {
            setDepth(child, depth + 1);
        }
    }
    for (const root of roots) {
        setDepth(root, 0);
    }

    return roots;
}

/**
 * Calculate subtree summary for a given node.
 */
export function getSubtreeSummary(
    node: CompetencyTreeNode
): CompetencySubtreeSummary {
    const allDescendants = flattenTree(node);
    const withMastery = allDescendants.filter((n) => n.mastery !== undefined);

    const avgMastery = withMastery.length > 0
        ? withMastery.reduce((sum, n) => sum + (n.mastery || 0), 0) / withMastery.length
        : 0;

    const lowestChild = withMastery.length > 0
        ? withMastery.reduce((min, n) => (n.mastery || 0) < (min.mastery || Infinity) ? n : min)
        : undefined;

    return {
        nodeId: node.id,
        nodeName: node.name,
        level: node.level,
        avgMastery: Math.round(avgMastery),
        totalAttempts: 0, // Would be populated from learner data
        childCount: allDescendants.length - 1, // exclude self
        lowestChild: lowestChild
            ? { name: lowestChild.name, mastery: lowestChild.mastery || 0 }
            : undefined,
    };
}

/**
 * Flatten a tree into an array (breadth-first).
 */
export function flattenTree(node: CompetencyTreeNode): CompetencyTreeNode[] {
    const result: CompetencyTreeNode[] = [node];
    for (const child of node.children) {
        result.push(...flattenTree(child));
    }
    return result;
}

// ============================================
// Mastery Assessment
// ============================================

/**
 * Calculate updated mastery level based on a simulation session performance.
 * Uses exponential moving average to weight recent performance more heavily.
 */
export function calculateMasteryUpdate(
    currentMastery: number,
    sessionScore: number,
    attempts: number,
    alpha: number = 0.3
): number {
    if (attempts === 0) {
        return sessionScore;
    }
    // Exponential moving average
    const newMastery = alpha * sessionScore + (1 - alpha) * currentMastery;
    return Math.round(Math.min(100, Math.max(0, newMastery)));
}

/**
 * Get competency nodes that need remediation (below mastery threshold).
 */
export function getRemediationTargets(
    nodes: CompetencyNode[],
    learnerData: LearnerCompetency[]
): Array<{ node: CompetencyNode; mastery: number; gap: number }> {
    const targets: Array<{ node: CompetencyNode; mastery: number; gap: number }> = [];
    const masteryMap = new Map(learnerData.map((lc) => [lc.competencyNodeId, lc.masteryLevel]));

    for (const node of nodes) {
        const mastery = masteryMap.get(node.id) ?? 0;
        const threshold = node.assessmentCriteria.masteryThreshold ?? 60;

        if (mastery < threshold) {
            targets.push({
                node,
                mastery,
                gap: threshold - mastery,
            });
        }
    }

    // Sort by largest gap first
    return targets.sort((a, b) => b.gap - a.gap);
}

/**
 * Get the competency nodes assessed by a given case ID.
 */
export function getCompetenciesForCase(caseId: string): CaseCompetencyMapping | undefined {
    return CASE_COMPETENCY_MAPPINGS.find((m) => m.caseId === caseId);
}
