import { describe, it, expect } from 'vitest';
import {
    createHintState,
    getHint,
    shouldEscalate,
    resetErrorHintLevel,
    getHintStats,
    formatHintForDisplay,
    type HintState,
} from '@/services/hintEngine';
import type { ErrorClassification } from '@/services/errorDetector';

// ============================================
// Test Helpers
// ============================================

function makeError(overrides: Partial<ErrorClassification> = {}): ErrorClassification {
    return {
        type: 'hesitation',
        severity: 'medium',
        description: 'Test error',
        context: {},
        detectedAt: Date.now(),
        ...overrides,
    };
}

// ============================================
// Tests
// ============================================

describe('hintEngine', () => {
    describe('createHintState', () => {
        it('should create a fresh hint state with all levels at 0', () => {
            const state = createHintState();
            expect(state.totalHintsGiven).toBe(0);
            expect(state.levels.syntax).toBe(0);
            expect(state.levels.semantic).toBe(0);
            expect(state.levels.hesitation).toBe(0);
            expect(state.levels.premature_closure).toBe(0);
            expect(state.history).toHaveLength(0);
        });
    });

    describe('getHint', () => {
        it('should return level 1 hint on first call', () => {
            const state = createHintState();
            const error = makeError({ type: 'hesitation' });
            const { hint, updatedState } = getHint(error, state);

            expect(hint.level).toBe(1);
            expect(hint.errorType).toBe('hesitation');
            expect(hint.message).toContain('review');
            expect(updatedState.levels.hesitation).toBe(1);
            expect(updatedState.totalHintsGiven).toBe(1);
        });

        it('should escalate to level 2 on second call for same error type', () => {
            let state = createHintState();
            const error = makeError({ type: 'hesitation' });

            // First hint
            const result1 = getHint(error, state);
            state = result1.updatedState;

            // Second hint
            const result2 = getHint(error, state);
            expect(result2.hint.level).toBe(2);
            expect(result2.updatedState.levels.hesitation).toBe(2);
        });

        it('should escalate to level 3 on third call', () => {
            let state = createHintState();
            const error = makeError({ type: 'premature_closure' });

            // First three hints
            const r1 = getHint(error, state);
            const r2 = getHint(error, r1.updatedState);
            const r3 = getHint(error, r2.updatedState);

            expect(r3.hint.level).toBe(3);
        });

        it('should not exceed level 3', () => {
            let state = createHintState();
            const error = makeError({ type: 'syntax' });

            // Give 4 hints
            let result = getHint(error, state);
            result = getHint(error, result.updatedState);
            result = getHint(error, result.updatedState);
            result = getHint(error, result.updatedState);

            expect(result.hint.level).toBe(3);
            expect(result.updatedState.levels.syntax).toBe(3);
        });

        it('should track different error types independently', () => {
            let state = createHintState();

            // Give hint for hesitation
            const r1 = getHint(makeError({ type: 'hesitation' }), state);
            state = r1.updatedState;

            // Give hint for syntax
            const r2 = getHint(makeError({ type: 'syntax' }), state);
            state = r2.updatedState;

            expect(state.levels.hesitation).toBe(1);
            expect(state.levels.syntax).toBe(1);
            expect(state.totalHintsGiven).toBe(2);
        });

        it('should mark high severity errors as error corrections', () => {
            const error = makeError({ severity: 'high' });
            const { hint } = getHint(error, createHintState());
            expect(hint.isErrorCorrection).toBe(true);
        });

        it('should not mark non-high severity as error correction', () => {
            const error = makeError({ severity: 'medium' });
            const { hint } = getHint(error, createHintState());
            expect(hint.isErrorCorrection).toBe(false);
        });
    });

    describe('shouldEscalate', () => {
        it('should return true when level is below 3', () => {
            const state = createHintState();
            expect(shouldEscalate('hesitation', state)).toBe(true);
        });

        it('should return false when level is at 3', () => {
            const state: HintState = {
                ...createHintState(),
                levels: { syntax: 0, semantic: 0, hesitation: 3, premature_closure: 0 },
            };
            expect(shouldEscalate('hesitation', state)).toBe(false);
        });
    });

    describe('resetErrorHintLevel', () => {
        it('should reset a specific error type to level 0', () => {
            const state: HintState = {
                ...createHintState(),
                levels: { syntax: 2, semantic: 1, hesitation: 3, premature_closure: 0 },
                totalHintsGiven: 6,
            };
            const reset = resetErrorHintLevel('hesitation', state);
            expect(reset.levels.hesitation).toBe(0);
            expect(reset.levels.syntax).toBe(2); // unchanged
            expect(reset.totalHintsGiven).toBe(6); // history preserved
        });
    });

    describe('getHintStats', () => {
        it('should compute stats from history', () => {
            let state = createHintState();
            const r1 = getHint(makeError({ type: 'hesitation' }), state);
            const r2 = getHint(makeError({ type: 'syntax' }), r1.updatedState);
            const r3 = getHint(makeError({ type: 'hesitation' }), r2.updatedState);

            const stats = getHintStats(r3.updatedState);
            expect(stats.totalHints).toBe(3);
            expect(stats.hintsByType.hesitation).toBe(2);
            expect(stats.hintsByType.syntax).toBe(1);
            expect(stats.maxLevelReached).toBe(2); // hesitation escalated to 2
        });
    });

    describe('formatHintForDisplay', () => {
        it('should format level 1 as info', () => {
            const result = formatHintForDisplay({
                level: 1,
                message: 'test',
                isErrorCorrection: false,
                errorType: 'hesitation',
            });
            expect(result.icon).toBe('info');
            expect(result.title).toContain('Consider');
        });

        it('should format level 3 as alert', () => {
            const result = formatHintForDisplay({
                level: 3,
                message: 'test',
                isErrorCorrection: true,
                errorType: 'semantic',
            });
            expect(result.icon).toBe('alert');
            expect(result.title).toContain('Clinical');
        });
    });
});
