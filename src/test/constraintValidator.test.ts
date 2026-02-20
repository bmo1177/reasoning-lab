/**
 * Unit tests for constraintValidator.ts
 * 
 * Tests clinical constraint rules, validateDecision, getApplicableConstraints,
 * and hasConstraint functions.
 */

import { describe, it, expect } from 'vitest';
import {
    validateDecision,
    getApplicableConstraints,
    hasConstraint,
    clinicalConstraintRules,
} from '@/services/constraintValidator';
import type { SimulationDecision, PatientState, BranchingCase } from '@/types/simulation';

// ======================
// Test Helpers
// ======================

function makeDecision(overrides: Partial<SimulationDecision> = {}): SimulationDecision {
    return {
        id: 'test-decision',
        label: 'Test Decision',
        type: 'test',
        cost: 50,
        timeRequired: 30,
        consequences: {},
        ...overrides,
    } as SimulationDecision;
}

function makePatientState(overrides: Partial<PatientState> = {}): PatientState {
    return {
        status: 'stable',
        vitalSigns: {
            bloodPressure: '120/80',
            heartRate: 80,
            respiratoryRate: 16,
            temperature: 37,
            oxygenSaturation: 98,
        },
        symptoms: [],
        timeElapsed: 0,
        ...overrides,
    };
}

function makeCaseData(id: string): BranchingCase {
    return {
        id,
        title: 'Test Case',
        specialty: 'emergency',
        difficulty: 'intermediate',
        stages: [],
        branches: [],
        initialPatientState: makePatientState(),
        optimalPath: { decisions: [], description: '' },
        learningObjectives: [],
    } as unknown as BranchingCase;
}

const defaultContext = {
    timeInStage: 0,
    decisionsInStage: 0,
    totalDecisions: 0,
};

// ======================
// Tests
// ======================

describe('constraintValidator', () => {
    describe('clinicalConstraintRules', () => {
        it('should have at least 10 clinical rules', () => {
            expect(clinicalConstraintRules.length).toBeGreaterThanOrEqual(10);
        });

        it('each rule should have an id', () => {
            clinicalConstraintRules.forEach(rule => {
                expect(rule.id).toBeDefined();
                expect(rule.id.length).toBeGreaterThan(0);
            });
        });

        it('each rule should have a check function', () => {
            clinicalConstraintRules.forEach(rule => {
                expect(typeof rule.check).toBe('function');
            });
        });
    });

    describe('DKA rules', () => {
        const dkaCase = makeCaseData('sim-007');

        it('should flag insulin bolus in DKA', () => {
            const decision = makeDecision({ id: 'insulin-bolus' });
            const result = validateDecision(decision, makePatientState(), dkaCase, defaultContext);
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('warning');
            expect(result.suggestedAlternative).toBe('insulin-drip');
        });

        it('should flag bicarbonate in non-critical DKA', () => {
            const decision = makeDecision({ id: 'bicarb' });
            const result = validateDecision(decision, makePatientState({ status: 'stable' }), dkaCase, defaultContext);
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('warning');
        });

        it('should NOT flag bicarbonate in critical DKA (pH < 6.9)', () => {
            const decision = makeDecision({ id: 'bicarb' });
            const result = validateDecision(decision, makePatientState({ status: 'critical' }), dkaCase, defaultContext);
            expect(result.isValid).toBe(true);
        });
    });

    describe('Stroke rules', () => {
        const strokeCase = makeCaseData('sim-005');

        it('should flag tPA with systolic > 185', () => {
            const decision = makeDecision({ id: 'tpa' });
            const patient = makePatientState({
                vitalSigns: { bloodPressure: '200/110', heartRate: 88, respiratoryRate: 18, temperature: 37, oxygenSaturation: 96 },
            });
            const result = validateDecision(decision, patient, strokeCase, defaultContext);
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('critical');
        });

        it('should allow tPA with controlled BP', () => {
            const decision = makeDecision({ id: 'tpa' });
            const patient = makePatientState({
                vitalSigns: { bloodPressure: '170/90', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
            });
            const result = validateDecision(decision, patient, strokeCase, defaultContext);
            expect(result.isValid).toBe(true);
        });

        it('should flag tPA when too many decisions made', () => {
            const decision = makeDecision({ id: 'tpa' });
            const result = validateDecision(decision, makePatientState(), strokeCase, { ...defaultContext, totalDecisions: 7 });
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('error');
        });
    });

    describe('Aortic Dissection rules', () => {
        const aorticCase = makeCaseData('sim-008');

        it('should flag vasodilators before beta-blockade', () => {
            const decision = makeDecision({ id: 'nitroprusside' });
            const result = validateDecision(decision, makePatientState(), aorticCase, { ...defaultContext, decisionsInStage: 0 });
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('critical');
        });

        it('should allow vasodilators after beta-blockade (>=2 decisions)', () => {
            const decision = makeDecision({ id: 'nitroprusside' });
            const result = validateDecision(decision, makePatientState(), aorticCase, { ...defaultContext, decisionsInStage: 3 });
            expect(result.isValid).toBe(true);
        });
    });

    describe('Hypoglycemia rules', () => {
        const hypoCase = makeCaseData('sim-003');

        it('should flag oral glucose in unresponsive patient', () => {
            const decision = makeDecision({ id: 'oral-glucose' });
            const patient = makePatientState({ status: 'critical' });
            const result = validateDecision(decision, patient, hypoCase, defaultContext);
            expect(result.isValid).toBe(false);
            expect(result.severity).toBe('critical');
            expect(result.suggestedAlternative).toBe('dextrose-iv');
        });

        it('should allow oral glucose in responsive patient', () => {
            const decision = makeDecision({ id: 'oral-glucose' });
            const result = validateDecision(decision, makePatientState({ status: 'stable' }), hypoCase, defaultContext);
            expect(result.isValid).toBe(true);
        });
    });

    describe('validateDecision', () => {
        it('should return safe for unknown case', () => {
            const decision = makeDecision({ id: 'any-decision' });
            const result = validateDecision(decision, makePatientState(), makeCaseData('sim-999'), defaultContext);
            expect(result.isValid).toBe(true);
            expect(result.severity).toBe('safe');
        });

        it('should return the first matching constraint', () => {
            // For a DKA case, insulin-bolus should match the first DKA rule
            const decision = makeDecision({ id: 'insulin-bolus' });
            const result = validateDecision(decision, makePatientState(), makeCaseData('sim-007'), defaultContext);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Insulin bolus');
        });
    });

    describe('getApplicableConstraints', () => {
        it('should return rules for a specific case', () => {
            const dkaRules = getApplicableConstraints('sim-007');
            expect(dkaRules.length).toBeGreaterThanOrEqual(2); // insulin-bolus + bicarbonate
            dkaRules.forEach(rule => {
                expect(!rule.caseTypes || rule.caseTypes.includes('sim-007')).toBe(true);
            });
        });

        it('should return all case-agnostic rules for unknown case', () => {
            const rules = getApplicableConstraints('unknown');
            rules.forEach(rule => {
                expect(rule.caseTypes).toBeUndefined();
            });
        });
    });

    describe('hasConstraint', () => {
        it('should return true for known constraint', () => {
            expect(hasConstraint('insulin-bolus', 'sim-007')).toBe(true);
        });

        it('should return false for unrelated case', () => {
            // insulin-bolus is specific to sim-007
            expect(hasConstraint('insulin-bolus', 'sim-001')).toBe(false);
        });
    });
});
