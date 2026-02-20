import { describe, it, expect } from 'vitest';
import {
    evaluateRules,
    getMatchedActions,
    DEFAULT_RULES,
    type MappingRule,
    type RuleEvent,
} from '@/services/mappingRulesEngine';

// ============================================
// Tests
// ============================================

describe('mappingRulesEngine', () => {
    describe('evaluateRules', () => {
        const testRules: MappingRule[] = [
            {
                id: 'rule-1',
                name: 'High severity error hint',
                description: 'Show hint on high severity errors',
                event: 'error_detected',
                conditions: [
                    { field: 'severity', operator: 'equals', value: 'high' },
                ],
                actions: [
                    { type: 'show_hint', params: { level: 3 } },
                    { type: 'log_error', params: {} },
                ],
                priority: 20,
                enabled: true,
            },
            {
                id: 'rule-2',
                name: 'Any error logging',
                description: 'Log all errors',
                event: 'error_detected',
                conditions: [],
                actions: [
                    { type: 'log_error', params: {} },
                ],
                priority: 10,
                enabled: true,
            },
            {
                id: 'rule-3',
                name: 'Disabled rule',
                description: 'This should be skipped',
                event: 'error_detected',
                conditions: [],
                actions: [
                    { type: 'flag_for_review', params: {} },
                ],
                priority: 30,
                enabled: false,
            },
        ];

        it('should match rules with all conditions met', () => {
            const event: RuleEvent = {
                type: 'error_detected',
                context: { severity: 'high' },
                timestamp: Date.now(),
            };
            const results = evaluateRules(testRules, event);
            expect(results).toHaveLength(2); // rule-1 and rule-2
        });

        it('should skip disabled rules', () => {
            const event: RuleEvent = {
                type: 'error_detected',
                context: { severity: 'high' },
                timestamp: Date.now(),
            };
            const results = evaluateRules(testRules, event);
            const ids = results.map((r) => r.rule.id);
            expect(ids).not.toContain('rule-3');
        });

        it('should sort results by priority (highest first)', () => {
            const event: RuleEvent = {
                type: 'error_detected',
                context: { severity: 'high' },
                timestamp: Date.now(),
            };
            const results = evaluateRules(testRules, event);
            expect(results[0].rule.id).toBe('rule-1'); // priority 20
            expect(results[1].rule.id).toBe('rule-2'); // priority 10
        });

        it('should only match rules for the correct event type', () => {
            const event: RuleEvent = {
                type: 'stage_advanced',
                context: {},
                timestamp: Date.now(),
            };
            const results = evaluateRules(testRules, event);
            expect(results).toHaveLength(0);
        });

        it('should not match when conditions are not met', () => {
            const event: RuleEvent = {
                type: 'error_detected',
                context: { severity: 'low' },
                timestamp: Date.now(),
            };
            const results = evaluateRules(testRules, event);
            // Only rule-2 matches (no conditions)
            expect(results).toHaveLength(1);
            expect(results[0].rule.id).toBe('rule-2');
        });
    });

    describe('condition operators', () => {
        function makeRule(conditions: MappingRule['conditions']): MappingRule[] {
            return [{
                id: 'test',
                name: 'test',
                description: 'test',
                event: 'error_detected',
                conditions,
                actions: [{ type: 'log_error', params: {} }],
                priority: 1,
                enabled: true,
            }];
        }

        it('should support "greater_than" operator', () => {
            const rules = makeRule([{ field: 'score', operator: 'greater_than', value: 50 }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { score: 75 }, timestamp: 0 })).toHaveLength(1);
            expect(evaluateRules(rules, { type: 'error_detected', context: { score: 30 }, timestamp: 0 })).toHaveLength(0);
        });

        it('should support "less_than" operator', () => {
            const rules = makeRule([{ field: 'score', operator: 'less_than', value: 50 }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { score: 30 }, timestamp: 0 })).toHaveLength(1);
        });

        it('should support "contains" operator on strings', () => {
            const rules = makeRule([{ field: 'message', operator: 'contains', value: 'error' }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { message: 'An error occurred' }, timestamp: 0 })).toHaveLength(1);
        });

        it('should support "contains" operator on arrays', () => {
            const rules = makeRule([{ field: 'tags', operator: 'contains', value: 'critical' }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { tags: ['critical', 'urgent'] }, timestamp: 0 })).toHaveLength(1);
        });

        it('should support "in" operator', () => {
            const rules = makeRule([{ field: 'severity', operator: 'in', value: ['high', 'critical'] }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { severity: 'high' }, timestamp: 0 })).toHaveLength(1);
            expect(evaluateRules(rules, { type: 'error_detected', context: { severity: 'low' }, timestamp: 0 })).toHaveLength(0);
        });

        it('should support "exists" operator', () => {
            const rules = makeRule([{ field: 'errorType', operator: 'exists' }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { errorType: 'syntax' }, timestamp: 0 })).toHaveLength(1);
            expect(evaluateRules(rules, { type: 'error_detected', context: {}, timestamp: 0 })).toHaveLength(0);
        });

        it('should support "not_equals" operator', () => {
            const rules = makeRule([{ field: 'status', operator: 'not_equals', value: 'resolved' }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { status: 'active' }, timestamp: 0 })).toHaveLength(1);
            expect(evaluateRules(rules, { type: 'error_detected', context: { status: 'resolved' }, timestamp: 0 })).toHaveLength(0);
        });

        it('should support nested field paths with dot notation', () => {
            const rules = makeRule([{ field: 'error.type', operator: 'equals', value: 'semantic' }]);
            expect(evaluateRules(rules, { type: 'error_detected', context: { error: { type: 'semantic' } }, timestamp: 0 })).toHaveLength(1);
        });
    });

    describe('getMatchedActions', () => {
        it('should deduplicate actions by type, keeping highest priority', () => {
            const rules: MappingRule[] = [
                {
                    id: 'high',
                    name: 'High priority',
                    description: '',
                    event: 'error_detected',
                    conditions: [],
                    actions: [{ type: 'show_hint', params: { level: 3 } }],
                    priority: 20,
                    enabled: true,
                },
                {
                    id: 'low',
                    name: 'Low priority',
                    description: '',
                    event: 'error_detected',
                    conditions: [],
                    actions: [{ type: 'show_hint', params: { level: 1 } }],
                    priority: 10,
                    enabled: true,
                },
            ];

            const actions = getMatchedActions(rules, { type: 'error_detected', context: {}, timestamp: 0 });
            expect(actions).toHaveLength(1);
            expect(actions[0].params.level).toBe(3); // from high-priority rule
        });
    });

    describe('DEFAULT_RULES', () => {
        it('should have 6 default rules', () => {
            expect(DEFAULT_RULES).toHaveLength(6);
        });

        it('should have all rules enabled', () => {
            expect(DEFAULT_RULES.every((r) => r.enabled)).toBe(true);
        });

        it('should match hesitation rule correctly', () => {
            const event: RuleEvent = {
                type: 'hesitation_detected',
                context: { timeSinceLastAction: 90 },
                timestamp: Date.now(),
            };
            const results = evaluateRules(DEFAULT_RULES, event);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.some((r) => r.rule.id === 'rule-hesitation-hint')).toBe(true);
        });

        it('should trigger ECA on critical errors', () => {
            const event: RuleEvent = {
                type: 'error_detected',
                context: { severity: 'high' },
                timestamp: Date.now(),
            };
            const results = evaluateRules(DEFAULT_RULES, event);
            expect(results.some((r) => r.rule.id === 'rule-critical-error-eca')).toBe(true);
        });
    });
});
