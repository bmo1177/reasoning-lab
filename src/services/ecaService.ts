/**
 * ECA Service — Embedded Conversational Agent
 * 
 * Orchestrates the ECA's clinical tutoring intelligence by integrating:
 * - errorDetector.ts: Classifies learner errors after each decision
 * - hintEngine.ts: Generates graduated hints (L1→L3) for detected errors
 * - mappingRulesEngine.ts: Evaluates ECA rules to decide response type
 * 
 * Conversation state is managed client-side in the useEcaChat hook.
 * Responses are generated locally (rule-based) or via Claude API proxy (Task 2.3).
 */

import type {
    BranchingCase,
    PatientState,
    SimulationDecision,
    SimulationStage,
} from '@/types/simulation';
import {
    classifyError,
    buildDetectionContext,
    type ErrorClassification,
    type DetectionContext,
    getErrorTypeLabel,
} from '@/services/errorDetector';
import {
    createHintState,
    getHint,
    shouldEscalate,
    formatHintForDisplay,
    type HintState,
    type Hint,
    getHintStats,
} from '@/services/hintEngine';
import {
    evaluateRules,
    DEFAULT_RULES,
    type RuleEvent,
    type RuleAction,
} from '@/services/mappingRulesEngine';
import type { EcaMessage } from '@/components/simulation/EcaChatPanel';
import type { DialogueManagerState, AffectiveState, ScaffoldingStrategyConfig } from '@/types/domainModel';
import { createScaffoldingStrategy } from '@/services/scaffoldingStrategy';

// ======================
// Types
// ======================

export interface EcaContext {
    caseData: BranchingCase;
    currentStage: SimulationStage;
    patientState: PatientState;
    decisionsLog: DecisionLogEntry[];
    timeInStage: number;
    difficulty: string;
}

export interface DecisionLogEntry {
    decision: SimulationDecision;
    timestamp: Date;
    stageId: string;
    timeSpent: number;
}

export interface EcaResponse {
    /** Message text to display */
    content: string;
    /** Hint metadata if this is a hint response */
    hint?: EcaMessage['hint'];
    /** Suggested follow-up actions */
    suggestions?: string[];
    /** Rule actions that triggered this response */
    triggeredActions?: RuleAction[];
    /** The error classification, if any */
    error?: ErrorClassification;
}

export interface EcaSessionState {
    hintState: HintState;
    messageCount: number;
    errorsDetected: ErrorClassification[];
    lastResponseTime: number;
    /** Tracks Claude API calls for rate limiting */
    apiCallCount: number;

    // Domain Model Extensions
    dialogueState: DialogueManagerState;
    affectiveState: AffectiveState;
    scaffoldingConfig: ScaffoldingStrategyConfig;
}

// ======================
// Constants
// ======================

const MAX_API_CALLS_PER_SESSION = 10;
const MIN_RESPONSE_INTERVAL_MS = 3000; // Don't spam the learner

// ======================
// Session State Factory
// ======================

export function createEcaSession(): EcaSessionState {
    const defaultScaffolding = createScaffoldingStrategy().getConfig();

    return {
        hintState: createHintState(),
        messageCount: 0,
        errorsDetected: [],
        lastResponseTime: 0,
        apiCallCount: 0,
        dialogueState: {
            turnCount: 0,
            activeTopic: null,
            pendingQuestions: [],
            ecaInitiated: false,
        },
        affectiveState: {
            frustration: 0,
            confidence: 0.5,
            engagement: 1.0,
            updatedAt: Date.now(),
        },
        scaffoldingConfig: defaultScaffolding,
    };
}

// ======================
// Core Functions
// ======================

/**
 * Analyze a learner decision and generate an appropriate ECA response.
 * This is the main entry point called after each decision.
 */
export function analyzeDecision(
    decision: SimulationDecision,
    context: EcaContext,
    sessionState: EcaSessionState,
): { response: EcaResponse | null; updatedState: EcaSessionState } {
    const now = Date.now();

    // Rate limit: don't respond too frequently
    if (now - sessionState.lastResponseTime < MIN_RESPONSE_INTERVAL_MS) {
        return { response: null, updatedState: sessionState };
    }

    // Build detection context from decisions log
    const lastInteraction = context.decisionsLog.length > 0
        ? context.decisionsLog[context.decisionsLog.length - 1].timestamp
        : new Date();

    // 4. Update error detection context
    const detectionContext = buildDetectionContext(
        context.decisionsLog.map(d => ({
            decision: d.decision,
            timestamp: d.timestamp.getTime()
        })),
        context.currentStage,
        context.difficulty as any,
        sessionState.lastResponseTime,
        Date.now() - sessionState.lastResponseTime < 30000
    );

    // 1. Classify errors
    const error = classifyError(
        decision,
        context.patientState,
        context.caseData,
        context.currentStage,
        detectionContext,
    );

    // 2. Evaluate mapping rules
    const ruleEvent: RuleEvent = {
        type: error ? 'error_detected' : 'decision_made',
        context: {
            decision_type: decision.type,
            error_type: error?.type,
            error_severity: error?.severity,
            stage_id: context.currentStage.id,
            decisions_count: context.decisionsLog.length,
            time_in_stage: context.timeInStage,
        },
        timestamp: now,
    };

    const ruleResults = evaluateRules(DEFAULT_RULES, ruleEvent);
    const triggeredActions = ruleResults
        .filter(r => r.matched)
        .flatMap(r => r.actions);

    // 3. Generate response based on error + rules
    let response: EcaResponse | null = null;
    let updatedHintState = sessionState.hintState;

    if (error) {
        // Error detected → generate hint
        const { hint, updatedState: newHintState } = getHint(error, sessionState.hintState);
        updatedHintState = newHintState;

        const hints = getHintStats(updatedHintState);
        console.log(`[ECA] Hint stats: ${hints.totalHints} total, max level ${hints.maxLevelReached}`);

        // If max hint level reached for this error type, trigger specific intervention rule
        if (updatedHintState.levels[error.type] >= 3) {
            // This would trigger a specific rule if we were fully using the rules engine
            // For now, we rely on the hint system's fallback messages
        }

        const formatted = formatHintForDisplay(hint);

        response = {
            content: `${formatted.title}\n\n${formatted.message}`,
            hint: {
                level: hint.level as 1 | 2 | 3,
                errorType: error.type,
                icon: formatted.icon,
            },
            suggestions: getSuggestionsForError(error, context),
            triggeredActions,
            error,
        };

        // Log to console for debugging
        console.log(`[ECA] Error detected: ${error.type} (${error.severity})`);

        // Update session state
        sessionState.errorsDetected.push(error);

    } else if (shouldProvideEncouragement(context, sessionState)) {
        // No error — provide positive reinforcement occasionally
        response = {
            content: getEncouragementMessage(context),
            suggestions: getContextualSuggestions(context),
        };
    }

    // Update session state
    const updatedState: EcaSessionState = {
        ...sessionState,
        hintState: updatedHintState,
        messageCount: sessionState.messageCount + (response ? 1 : 0),
        errorsDetected: error
            ? [...sessionState.errorsDetected, error]
            : sessionState.errorsDetected,
        lastResponseTime: response ? now : sessionState.lastResponseTime,
    };

    return { response, updatedState };
}

/**
 * Generate a Claude API response for a learner question.
 * Requires the Supabase Edge Function (Task 2.3) to be deployed.
 * Falls back to local response if API is unavailable.
 */
export async function generateAIResponse(
    userMessage: string,
    context: EcaContext,
    sessionState: EcaSessionState,
): Promise<{ response: EcaResponse; updatedState: EcaSessionState }> {
    // Check rate limit
    if (sessionState.apiCallCount >= MAX_API_CALLS_PER_SESSION) {
        return {
            response: {
                content: 'I\'ve reached my response limit for this session. Continue working through the case — you\'re doing great! Review the hints I\'ve already provided for guidance.',
                suggestions: ['Review my previous hints', 'Continue with the case'],
            },
            updatedState: sessionState,
        };
    }

    // Phase 2.2: Local fallback (Claude integration via Edge Function in Task 2.3)
    const localResponse = generateLocalResponse(userMessage, context);

    const updatedState: EcaSessionState = {
        ...sessionState,
        messageCount: sessionState.messageCount + 1,
        lastResponseTime: Date.now(),
        // apiCallCount incremented when actual API call is made
    };

    return { response: localResponse, updatedState };
}

/**
 * Build a summary of the ECA session for persistence.
 * Called when simulation ends.
 */
export function buildSessionSummary(sessionState: EcaSessionState): {
    totalMessages: number;
    errorsDetected: number;
    errorTypes: Record<string, number>;
    hintLevelsReached: Record<string, number>;
    apiCallsUsed: number;
} {
    const errorTypes: Record<string, number> = {};
    const hintLevelsReached: Record<string, number> = {};
    for (const error of sessionState.errorsDetected) {
        if (!errorTypes[error.type]) {
            errorTypes[error.type] = 0;
        }
        errorTypes[error.type]++;

        // Track max hint level reached for this error
        const level = sessionState.hintState.levels[error.type] || 0;
        if (!hintLevelsReached[error.type] || level > hintLevelsReached[error.type]) {
            hintLevelsReached[error.type] = level;
        }
    }

    return {
        totalMessages: sessionState.messageCount,
        errorsDetected: sessionState.errorsDetected.length,
        errorTypes,
        hintLevelsReached,
        apiCallsUsed: sessionState.apiCallCount,
    };
}

// ======================
// Helpers
// ======================

function shouldProvideEncouragement(
    context: EcaContext,
    sessionState: EcaSessionState,
): boolean {
    const decisionsCount = context.decisionsLog.length;
    // Encourage after every 3rd correct decision, but not too often
    return decisionsCount > 0
        && decisionsCount % 3 === 0
        && sessionState.messageCount < 10;
}

function getEncouragementMessage(context: EcaContext): string {
    const messages = [
        'Good clinical reasoning! You\'re systematically gathering information before making treatment decisions.',
        'Nice approach — you\'re following a logical diagnostic process. Keep considering the differential diagnoses.',
        'You\'re making well-ordered decisions. Think about what additional data might confirm or rule out your top hypothesis.',
        'Good work so far! Consider: have you addressed the most urgent clinical priority for this patient?',
        'You\'re progressing well through this case. Remember to integrate all findings before narrowing your differential.',
    ];
    return messages[context.decisionsLog.length % messages.length];
}

function getSuggestionsForError(
    error: ErrorClassification,
    context: EcaContext,
): string[] {
    // Filter for suggestions related to this error type
    const relevantDecisions = context.currentStage.availableDecisions.filter(d => {
        // This is a heuristic - in a real system we'd have explicit mapping
        // between errors and corrective actions.
        // For now, suggestions are generic based on error type.
        return true;
    });

    switch (error.type) {
        case 'hesitation':
            return ['What should I do next?', 'Show me the vitals again'];
        case 'premature_closure':
            return ['What else could this be?', 'What tests did I miss?'];
        case 'syntax':
            return ['Guide me to the next step', 'Review stage goals'];
        case 'semantic':
            return ['Why might this be risky?', 'What is the physiology here?'];
        default:
            return ['Help', 'Hint'];
    }
}

function getContextualSuggestions(context: EcaContext): string[] {
    const stage = context.currentStage;
    const decisionsCount = context.decisionsLog.length;

    if (decisionsCount < 2) {
        return ['What information do I need?', 'What are the priorities?'];
    }
    if (decisionsCount < 5) {
        return ['Am I on the right track?', 'What should I do next?'];
    }
    return ['Should I move to treatment?', 'Am I missing anything?'];
}

function generateLocalResponse(
    userMessage: string,
    context: EcaContext,
): EcaResponse {
    const lower = userMessage.toLowerCase();
    const stageName = context.currentStage.name || context.currentStage.id;

    if (lower.includes('help') || lower.includes('what should')) {
        return {
            content: `During the **${stageName}** stage, focus on the most clinically urgent concerns first. Review the patient's current vital signs and symptoms carefully — what findings stand out to you as most significant?`,
            suggestions: ['Show me the vitals', 'What are the differentials?'],
        };
    }

    if (lower.includes('hint') || lower.includes('stuck')) {
        return {
            content: 'Let me give you a structured approach: **1)** Review all available data, **2)** Identify the most critical finding, **3)** Consider what additional information would help narrow your differential. What have you gathered so far?',
            suggestions: ['What data do I have?', 'What\'s most critical?'],
        };
    }

    if (lower.includes('why') || lower.includes('explain')) {
        return {
            content: 'Clinical reasoning involves connecting findings to possible diagnoses. Look at the **pattern** of findings — which conditions would explain all of them together? Consider both common and serious causes.',
            suggestions: ['Tell me more', 'What should I do next?'],
        };
    }

    if (lower.includes('vitals') || lower.includes('vital')) {
        const vs = context.patientState.vitalSigns;
        return {
            content: `Current vitals: **BP** ${vs.bloodPressure}, **HR** ${vs.heartRate}, **RR** ${vs.respiratoryRate}, **Temp** ${vs.temperature}°C, **SpO₂** ${vs.oxygenSaturation}%. Do any of these values concern you?`,
            suggestions: ['What\'s abnormal?', 'What does this suggest?'],
        };
    }

    return {
        content: `That's a thoughtful question about this ${context.caseData.specialty} case. Consider: what is the **single most important** piece of information you need right now to move forward? Clinical prioritization is key.`,
        suggestions: ['What\'s the priority?', 'Am I on track?'],
    };
}
