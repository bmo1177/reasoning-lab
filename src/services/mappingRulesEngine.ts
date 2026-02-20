/**
 * Mapping Rules Engine
 * 
 * Implements an Event-Condition-Action (ECA) rules engine from the research paper.
 * Rules are evaluated when simulation events occur and trigger appropriate actions
 * (e.g., show hint, trigger ECA response, log error, update score).
 * 
 * Rules are defined as JSON for easy editing and future admin UI support.
 */

// ============================================
// Types
// ============================================

export type EventType =
    | 'decision_made'
    | 'stage_advanced'
    | 'hesitation_detected'
    | 'error_detected'
    | 'hint_given'
    | 'simulation_started'
    | 'simulation_completed'
    | 'constraint_violated'
    | 'whatif_explored';

export type ActionType =
    | 'show_hint'
    | 'trigger_eca_message'
    | 'log_error'
    | 'update_competency'
    | 'escalate_hint'
    | 'show_encouragement'
    | 'record_metric'
    | 'flag_for_review';

export interface RuleCondition {
    /** The field path to check (supports dot notation, e.g., "context.severity") */
    field: string;
    /** Comparison operator */
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'exists';
    /** Value to compare against. Omit for 'exists' operator */
    value?: unknown;
}

export interface RuleAction {
    type: ActionType;
    /** Params passed to the action handler */
    params: Record<string, unknown>;
}

export interface MappingRule {
    /** Unique identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Description of what this rule does */
    description: string;
    /** Event that triggers evaluation of this rule */
    event: EventType;
    /** All conditions must be true for the rule to fire (AND logic) */
    conditions: RuleCondition[];
    /** Actions to execute when the rule fires */
    actions: RuleAction[];
    /** Higher priority rules are evaluated first; ties broken by order */
    priority: number;
    /** Whether this rule is active */
    enabled: boolean;
}

export interface RuleEvent {
    type: EventType;
    /** Context data available for condition evaluation */
    context: Record<string, unknown>;
    /** Timestamp of the event */
    timestamp: number;
}

export interface RuleEvaluationResult {
    rule: MappingRule;
    actions: RuleAction[];
    /** Whether all conditions were met */
    matched: boolean;
}

// ============================================
// Condition Evaluation
// ============================================

/**
 * Resolve a dot-notation field path on an object.
 * e.g., getNestedValue({ a: { b: 3 } }, "a.b") => 3
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

/**
 * Evaluate a single condition against the event context.
 */
function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
    const fieldValue = getNestedValue(context, condition.field);

    switch (condition.operator) {
        case 'exists':
            return fieldValue !== undefined && fieldValue !== null;

        case 'equals':
            return fieldValue === condition.value;

        case 'not_equals':
            return fieldValue !== condition.value;

        case 'greater_than':
            return typeof fieldValue === 'number' && typeof condition.value === 'number'
                && fieldValue > condition.value;

        case 'less_than':
            return typeof fieldValue === 'number' && typeof condition.value === 'number'
                && fieldValue < condition.value;

        case 'contains':
            if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
                return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
            }
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(condition.value);
            }
            return false;

        case 'in':
            if (Array.isArray(condition.value)) {
                return condition.value.includes(fieldValue);
            }
            return false;

        default:
            return false;
    }
}

// ============================================
// Rule Engine
// ============================================

/**
 * Evaluate all matching rules for a given event.
 * Rules are sorted by priority (highest first).
 * All conditions must match for a rule to fire (AND logic).
 */
export function evaluateRules(
    rules: MappingRule[],
    event: RuleEvent
): RuleEvaluationResult[] {
    // Filter to enabled rules matching this event type, sorted by priority
    const applicableRules = rules
        .filter((rule) => rule.enabled && rule.event === event.type)
        .sort((a, b) => b.priority - a.priority);

    const results: RuleEvaluationResult[] = [];

    for (const rule of applicableRules) {
        const allConditionsMet = rule.conditions.every((condition) =>
            evaluateCondition(condition, event.context)
        );

        if (allConditionsMet) {
            results.push({
                rule,
                actions: rule.actions,
                matched: true,
            });
        }
    }

    return results;
}

/**
 * Get all actions from matching rules, deduplicated by action type.
 * When multiple rules produce the same action type, the highest-priority
 * rule's action takes precedence.
 */
export function getMatchedActions(
    rules: MappingRule[],
    event: RuleEvent
): RuleAction[] {
    const results = evaluateRules(rules, event);
    const seenTypes = new Set<ActionType>();
    const actions: RuleAction[] = [];

    for (const result of results) {
        for (const action of result.actions) {
            if (!seenTypes.has(action.type)) {
                seenTypes.add(action.type);
                actions.push(action);
            }
        }
    }

    return actions;
}

// ============================================
// Default Rules
// ============================================

/**
 * Default mapping rules that implement the core simulation scaffolding behavior.
 * These can be extended or overridden by instructor-defined rules.
 */
export const DEFAULT_RULES: MappingRule[] = [
    {
        id: 'rule-hesitation-hint',
        name: 'Show hint on hesitation',
        description: 'When hesitation is detected, show a level-appropriate hint',
        event: 'hesitation_detected',
        conditions: [
            { field: 'timeSinceLastAction', operator: 'greater_than', value: 45 },
        ],
        actions: [
            { type: 'show_hint', params: { errorType: 'hesitation' } },
        ],
        priority: 10,
        enabled: true,
    },
    {
        id: 'rule-error-hint',
        name: 'Show hint on error detection',
        description: 'When an error is classified, show an appropriate hint',
        event: 'error_detected',
        conditions: [
            { field: 'severity', operator: 'in', value: ['medium', 'high'] },
        ],
        actions: [
            { type: 'show_hint', params: {} },
            { type: 'log_error', params: {} },
        ],
        priority: 20,
        enabled: true,
    },
    {
        id: 'rule-critical-error-eca',
        name: 'Trigger ECA on critical error',
        description: 'When a high-severity error occurs, trigger an ECA conversation',
        event: 'error_detected',
        conditions: [
            { field: 'severity', operator: 'equals', value: 'high' },
        ],
        actions: [
            { type: 'trigger_eca_message', params: { urgency: 'high' } },
            { type: 'show_hint', params: {} },
            { type: 'log_error', params: {} },
        ],
        priority: 30,
        enabled: true,
    },
    {
        id: 'rule-stage-encouragement',
        name: 'Encourage on stage advance',
        description: 'Show encouragement when learner successfully advances a stage',
        event: 'stage_advanced',
        conditions: [],
        actions: [
            { type: 'show_encouragement', params: { message: 'Great progress! Moving to the next stage.' } },
            { type: 'update_competency', params: {} },
        ],
        priority: 5,
        enabled: true,
    },
    {
        id: 'rule-whatif-competency',
        name: 'Update competency on what-if exploration',
        description: 'Record competency improvement when learner explores what-if scenarios',
        event: 'whatif_explored',
        conditions: [],
        actions: [
            { type: 'record_metric', params: { metric: 'whatif_exploration', value: 1 } },
        ],
        priority: 5,
        enabled: true,
    },
    {
        id: 'rule-constraint-flag',
        name: 'Flag constraint violations for review',
        description: 'When a constraint is violated, flag the session for instructor review',
        event: 'constraint_violated',
        conditions: [
            { field: 'severity', operator: 'in', value: ['critical', 'error'] },
        ],
        actions: [
            { type: 'flag_for_review', params: {} },
            { type: 'log_error', params: {} },
        ],
        priority: 25,
        enabled: true,
    },
];
