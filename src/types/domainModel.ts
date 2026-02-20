/**
 * Domain Model Types
 *
 * Central type definitions for all domain model entities from the research paper's
 * UML class diagrams. Maps the three core layers:
 *
 *   1. Learning Design   → MedicalDomain, Competency, Capability, Skill, Challenge
 *   2. Learning Analytics → DigitalTrace, LearnerProfile extensions
 *   3. Scaffolding Feedback → Feedback, FeedbackType, LearningPurposeType,
 *                             ScaffoldingStrategy, FeedbackToSimulation, FeedbackToProfile
 *
 * Plus standalone entities: WhatQuestion, WhatIfThinking
 */

// ============================================
// Enums & Union Types
// ============================================

/**
 * FeedbackType — Diagnostic, Formative, Predictive
 * From the UML «enumeration» FeedbackType.
 */
export type FeedbackType = 'diagnostic' | 'formative' | 'predictive';

/**
 * LearningPurposeType — 8 categories of feedback purpose.
 * From the UML «enumeration» LearningPurposeType.
 */
export type LearningPurposeType =
    | 'clarification'
    | 'what-if'
    | 'comparative'
    | 'process-oriented'
    | 'error-detection'
    | 'confidence-calibration'
    | 'next-step-guidance'
    | 'reflection';

/**
 * Cognitive level of a question (Bloom's taxonomy alignment).
 */
export type CognitiveLevel =
    | 'remember'
    | 'understand'
    | 'apply'
    | 'analyze'
    | 'evaluate'
    | 'create';

// ============================================
// Digital Trace
// ============================================

/**
 * DigitalTrace — captures learner behavioural signals during simulation.
 * From UML class: DigitalTrace { errors, hesitation, skippedSteps, timeSpent }
 */
export interface DigitalTrace {
    /** Error IDs detected during this trace window */
    errors: string[];
    /** Hesitation events — seconds of inactivity before acting */
    hesitation: number[];
    /** Decision IDs that were available but skipped */
    skippedSteps: string[];
    /** Total time spent in this trace window (seconds) */
    timeSpent: number;
    /** Stage ID this trace belongs to */
    stageId: string;
    /** Timestamp of trace collection */
    collectedAt: number;
}

// ============================================
// What-If Entities
// ============================================

/**
 * WhatQuestion — a structured what-if question with metacognitive metadata.
 * From UML class: WhatQuestion { cognitiveLevel, clinicalFocus, hintLevel }
 */
export interface WhatQuestion {
    /** Bloom's cognitive level this question targets */
    cognitiveLevel: CognitiveLevel;
    /** Clinical domain this question focuses on (e.g., 'diagnosis', 'treatment') */
    clinicalFocus: string;
    /** Associated hint level (1–3) for graduated scaffolding */
    hintLevel: 1 | 2 | 3;
    /** The question text */
    question: string;
    /** Optional alternative decision ID this question references */
    alternativeDecisionId?: string;
}

/**
 * WhatIfThinking — learner's reasoning trace when exploring what-if scenarios.
 * From UML association: Feedback → [0..*] WhatIfThinking
 */
export interface WhatIfThinking {
    /** The what-if scenario ID being explored */
    scenarioId: string;
    /** Learner's reasoning notes */
    reasoning: string;
    /** Time spent exploring this what-if (seconds) */
    timeSpent: number;
    /** Whether the learner changed their decision after exploration */
    changedDecision: boolean;
}

// ============================================
// Feedback
// ============================================

/**
 * LearningPurpose — purpose classification for a feedback item.
 * From UML class: LearningPurpose { purpose: LearningPurposeType }
 */
export interface LearningPurpose {
    purpose: LearningPurposeType;
    /** Optional context for why this purpose was selected */
    rationale?: string;
}

/**
 * Feedback — a single feedback item delivered to the learner.
 * From UML class: Feedback { type: FeedbackType = Diagnostic }
 *   with associations: [0..*] strategy → ScaffoldingStrategy
 *                      [0..1] has → LearningPurpose
 *                      [0..*] whatIfThinking → WhatIfThinking
 *                      [0..*] whatIfQuestion → WhatQuestion
 */
export interface Feedback {
    id: string;
    /** Feedback classification */
    type: FeedbackType;
    /** Content displayed to the learner */
    content: string;
    /** Learning purpose for this feedback */
    learningPurpose: LearningPurpose;
    /** Scaffolding strategies applied */
    strategies: ScaffoldingStrategyConfig[];
    /** Associated what-if explorations */
    whatIfThinking: WhatIfThinking[];
    /** Associated what-if questions */
    whatIfQuestions: WhatQuestion[];
    /** Timestamp */
    createdAt: number;
}

// ============================================
// Scaffolding Strategy
// ============================================

/**
 * ScaffoldingStrategyConfig — configuration for adaptive scaffolding.
 * From UML class: ScaffoldingStrategy { scaffoldLevel, fadeThreshold, selectLevel(), fadeSupport() }
 */
export interface ScaffoldingStrategyConfig {
    /** Current scaffold support level (1 = maximum support, 5 = minimal/faded) */
    scaffoldLevel: 1 | 2 | 3 | 4 | 5;
    /** Performance threshold (0–1) above which scaffolding fades */
    fadeThreshold: number;
    /** Whether this strategy is currently active */
    active: boolean;
    /** Strategy label for logging */
    label: string;
}

// ============================================
// Feedback Routing Bridges
// ============================================

/**
 * FeedbackToSimulation — routes feedback to the active simulation context.
 * From UML class: FeedbackToSimulation { [0..1] digitalTrace }
 */
export interface FeedbackToSimulation {
    feedbackId: string;
    /** The digital trace that triggered this feedback */
    digitalTrace: DigitalTrace | null;
    /** Simulation session ID */
    simulationSessionId: string;
    /** Stage where feedback was delivered */
    stageId: string;
}

/**
 * FeedbackToProfile — routes feedback outcomes to the learner profile.
 * From UML class: FeedbackToProfile { [0..1] learnerProfile }
 */
export interface FeedbackToProfile {
    feedbackId: string;
    /** User ID for profile update */
    userId: string;
    /** Whether the learner acted on this feedback */
    wasActedUpon: boolean;
    /** Competency delta resulting from this feedback (-1 to 1) */
    competencyDelta: number;
}

// ============================================
// ECA Extensions
// ============================================

/**
 * Affective state signals detected from learner traces.
 * Used by ECA.affectiveState from the UML.
 */
export interface AffectiveState {
    /** Frustration level inferred from repeated errors and hesitation (0–1) */
    frustration: number;
    /** Confidence level inferred from decision speed and accuracy (0–1) */
    confidence: number;
    /** Engagement level inferred from interaction frequency (0–1) */
    engagement: number;
    /** Last updated timestamp */
    updatedAt: number;
}

/**
 * DialogueManager state for the ECA.
 * Tracks conversation context and history.
 */
export interface DialogueManagerState {
    /** Current conversation turn count */
    turnCount: number;
    /** Active topic being discussed */
    activeTopic: string | null;
    /** Stack of unresolved learner questions */
    pendingQuestions: string[];
    /** Whether the ECA initiated the current exchange */
    ecaInitiated: boolean;
}

// ============================================
// LLM Simulation Generator
// ============================================

/**
 * LLMSimulationGenerator configuration.
 * From UML class: LLMSimulationGenerator { modelType, generateScenario(), adaptDifficulty() }
 */
export interface LLMGeneratorConfig {
    /** LLM model identifier (e.g., 'claude-3-sonnet') */
    modelType: string;
    /** Maximum tokens for scenario generation */
    maxTokens: number;
    /** Temperature for creative variation */
    temperature: number;
}

/**
 * Request to generate a new simulation scenario.
 */
export interface GenerateScenarioRequest {
    /** Medical domain to generate for */
    medicalDomain: string;
    /** Target difficulty */
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    /** Learning objectives to target */
    learningObjectives: string[];
    /** Competency nodes to assess */
    competencyNodeIds?: string[];
}

/**
 * Request to adapt difficulty of an existing case.
 */
export interface AdaptDifficultyRequest {
    /** Current case ID */
    caseId: string;
    /** Learner's current competence state */
    competenceState: Record<string, number>;
    /** Learner's preferred pace */
    learningPace: 'slow' | 'moderate' | 'fast';
    /** Recent performance scores */
    recentScores: number[];
}
