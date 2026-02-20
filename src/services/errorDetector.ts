/**
 * Error Detector Service
 * 
 * Classifies learner errors into 4 types based on the research paper's error taxonomy:
 * - syntax: wrong action type for context (e.g., ordering treatment before diagnosis)
 * - semantic: right type, wrong application (action worsens patient)
 * - hesitation: extended inaction without interaction
 * - premature_closure: jumping to conclusions without sufficient diagnostic workup
 */

import type { SimulationDecision, PatientState, BranchingCase, SimulationStage } from '@/types/simulation';

// ============================================
// Types
// ============================================

export type ErrorType = 'syntax' | 'semantic' | 'hesitation' | 'premature_closure';

export interface ErrorClassification {
    type: ErrorType;
    severity: 'low' | 'medium' | 'high';
    description: string;
    context: Record<string, unknown>;
    /** Timestamp when the error was detected */
    detectedAt: number;
}

export interface DetectionContext {
    /** Seconds since last learner action */
    timeSinceLastAction: number;
    /** Number of decisions made in current stage */
    decisionsInStage: number;
    /** Total decisions in entire simulation */
    totalDecisions: number;
    /** IDs of required diagnostic steps that have been completed */
    completedDiagnosticSteps: string[];
    /** IDs of all required diagnostic steps for this stage */
    requiredDiagnosticSteps: string[];
    /** Learner proficiency level */
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    /** Whether there has been mouse/keyboard activity during inaction period */
    hasRecentInteraction: boolean;
    /** IDs of decisions made so far (to detect patterns) */
    decisionHistory: string[];
}

// ============================================
// Constants
// ============================================

/** Seconds of inactivity before hesitation is flagged, by difficulty */
const HESITATION_THRESHOLDS: Record<string, number> = {
    beginner: 90,
    intermediate: 60,
    advanced: 45,
};

/** Decision types that are considered diagnostic (ordering tests, gathering info) */
const DIAGNOSTIC_TYPES = new Set(['test', 'observation', 'question', 'consultation']);

/** Decision types that are considered interventional (treatment, procedures) */
const INTERVENTIONAL_TYPES = new Set(['treatment', 'procedure']);

/** Minimum diagnostic completion ratio before treatment is appropriate */
const MIN_DIAGNOSTIC_RATIO = 0.4;

// ============================================
// Core Detection Functions
// ============================================

/**
 * Detect hesitation error (extended inaction).
 * Distinguishes between genuine hesitation (no activity) and deliberation
 * (active engagement without committing to a decision).
 */
export function detectHesitation(context: DetectionContext): ErrorClassification | null {
    const threshold = HESITATION_THRESHOLDS[context.difficulty] ?? 60;

    // Only flag if truly inactive (no mouse/keyboard events)
    if (context.timeSinceLastAction <= threshold || context.hasRecentInteraction) {
        return null;
    }

    const severity = context.timeSinceLastAction > threshold * 2 ? 'high' : 'medium';

    return {
        type: 'hesitation',
        severity,
        description: 'Extended period of inactivity detected. Consider reviewing the available patient information to guide your next step.',
        context: {
            inactiveSeconds: context.timeSinceLastAction,
            threshold,
            difficulty: context.difficulty,
        },
        detectedAt: Date.now(),
    };
}

/**
 * Detect premature closure error (jumping to treatment before adequate diagnosis).
 * Triggered when a learner selects an interventional action before completing
 * enough diagnostic steps.
 */
export function detectPrematureClosure(
    decision: SimulationDecision,
    context: DetectionContext
): ErrorClassification | null {
    // Only check for interventional decisions
    if (!INTERVENTIONAL_TYPES.has(decision.type)) {
        return null;
    }

    // If no required diagnostic steps defined, can't detect premature closure
    if (context.requiredDiagnosticSteps.length === 0) {
        return null;
    }

    const completionRatio =
        context.completedDiagnosticSteps.length / context.requiredDiagnosticSteps.length;

    if (completionRatio >= MIN_DIAGNOSTIC_RATIO) {
        return null;
    }

    const missingSteps = context.requiredDiagnosticSteps.filter(
        (step) => !context.completedDiagnosticSteps.includes(step)
    );

    return {
        type: 'premature_closure',
        severity: completionRatio < 0.2 ? 'high' : 'medium',
        description: 'Treatment initiated before sufficient diagnostic workup. Important information may still need to be gathered.',
        context: {
            completionRatio: Math.round(completionRatio * 100),
            completedSteps: context.completedDiagnosticSteps.length,
            requiredSteps: context.requiredDiagnosticSteps.length,
            missingSteps,
        },
        detectedAt: Date.now(),
    };
}

/**
 * Detect syntax error (wrong action type for the current clinical context).
 * For example, ordering a treatment when the stage expects diagnostic actions.
 */
export function detectSyntaxError(
    decision: SimulationDecision,
    currentStage: SimulationStage
): ErrorClassification | null {
    // If stage has required decisions, check if this decision type matches expectations
    const requiredDecisions = currentStage.requiredDecisionsToProgress;
    if (!requiredDecisions || requiredDecisions.length === 0) {
        return null;
    }

    // Get the types of required decisions
    const requiredDecisionTypes = currentStage.availableDecisions
        .filter((d) => requiredDecisions.includes(d.id))
        .map((d) => d.type);

    // If no specific types are expected, skip check
    if (requiredDecisionTypes.length === 0) {
        return null;
    }

    // Check if the decision type matches any expected type
    const isExpectedType = requiredDecisionTypes.includes(decision.type);
    if (isExpectedType) {
        return null;
    }

    // It's a syntax error only if the action categories are fundamentally different
    const isDiagnostic = DIAGNOSTIC_TYPES.has(decision.type);
    const expectedDiagnostic = requiredDecisionTypes.some((t) => DIAGNOSTIC_TYPES.has(t));

    if (isDiagnostic === expectedDiagnostic) {
        return null; // Same broad category, not a syntax error
    }

    return {
        type: 'syntax',
        severity: 'low',
        description: `This type of action ("${decision.type}") may not be the most appropriate at this stage. Consider what information you still need.`,
        context: {
            actualType: decision.type,
            expectedTypes: [...new Set(requiredDecisionTypes)],
            stageName: currentStage.name,
        },
        detectedAt: Date.now(),
    };
}

/**
 * Detect semantic error (right type of action, but wrong application).
 * Detected when an action is predicted to worsen patient condition.
 */
export function detectSemanticError(
    decision: SimulationDecision,
    patientState: PatientState
): ErrorClassification | null {
    const statusChange = decision.consequences?.patientStateChange?.status;

    if (!statusChange) {
        return null;
    }

    // Check if the decision leads to patient deterioration
    const worseningStatuses = ['declining', 'critical'];
    if (!worseningStatuses.includes(statusChange)) {
        return null;
    }

    return {
        type: 'semantic',
        severity: statusChange === 'critical' ? 'high' : 'medium',
        description: 'This action may adversely affect the patient. Consider the current clinical picture before proceeding.',
        context: {
            currentStatus: patientState.status,
            predictedStatus: statusChange,
            decisionType: decision.type,
            decisionLabel: decision.label,
        },
        detectedAt: Date.now(),
    };
}

// ============================================
// Main Classification Function
// ============================================

/**
 * Classify a learner's decision for potential errors.
 * Returns the most severe error found, or null if no errors detected.
 * 
 * Error priority (highest to lowest):
 * 1. semantic (patient safety)
 * 2. premature_closure (clinical reasoning)
 * 3. syntax (action type mismatch)
 * 4. hesitation (inaction — checked separately via detectHesitation)
 */
export function classifyError(
    decision: SimulationDecision,
    patientState: PatientState,
    caseData: BranchingCase,
    currentStage: SimulationStage,
    context: DetectionContext
): ErrorClassification | null {
    // 1. Check semantic error first (patient safety is highest priority)
    const semanticError = detectSemanticError(decision, patientState);
    if (semanticError && semanticError.severity === 'high') {
        return semanticError;
    }

    // 2. Check premature closure
    const prematureError = detectPrematureClosure(decision, context);
    if (prematureError) {
        return prematureError;
    }

    // 3. Check syntax error
    const syntaxError = detectSyntaxError(decision, currentStage);
    if (syntaxError) {
        return syntaxError;
    }

    // 4. Return non-critical semantic error if found
    if (semanticError) {
        return semanticError;
    }

    return null;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Build a DetectionContext from simulation state.
 * Convenience function for callers who have raw simulation data.
 */
export function buildDetectionContext(
    decisionsLog: Array<{ decision: SimulationDecision; timestamp: number }>,
    currentStage: SimulationStage,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    lastInteractionTime: number,
    hasRecentInteraction: boolean
): DetectionContext {
    const now = Date.now();
    const lastActionTime = decisionsLog.length > 0
        ? decisionsLog[decisionsLog.length - 1].timestamp
        : lastInteractionTime;

    // Identify diagnostic decisions already made
    const completedDiagnostics = decisionsLog
        .filter((d) => DIAGNOSTIC_TYPES.has(d.decision.type))
        .map((d) => d.decision.id);

    // Identify required diagnostic steps from current stage
    const requiredDiagnostics = currentStage.availableDecisions
        .filter((d) => DIAGNOSTIC_TYPES.has(d.type))
        .map((d) => d.id);

    return {
        timeSinceLastAction: Math.floor((now - lastActionTime) / 1000),
        decisionsInStage: decisionsLog.filter((d) =>
            currentStage.availableDecisions.some((ad) => ad.id === d.decision.id)
        ).length,
        totalDecisions: decisionsLog.length,
        completedDiagnosticSteps: completedDiagnostics,
        requiredDiagnosticSteps: requiredDiagnostics,
        difficulty,
        hasRecentInteraction,
        decisionHistory: decisionsLog.map((d) => d.decision.id),
    };
}

/**
 * Get a human-readable label for an error type.
 */
export function getErrorTypeLabel(type: ErrorType): string {
    const labels: Record<ErrorType, string> = {
        syntax: 'Action Type Mismatch',
        semantic: 'Potential Patient Harm',
        hesitation: 'Decision Delay',
        premature_closure: 'Premature Closure',
    };
    return labels[type];
}
