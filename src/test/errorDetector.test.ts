import { describe, it, expect } from 'vitest';
import {
    classifyError,
    detectHesitation,
    detectPrematureClosure,
    detectSyntaxError,
    detectSemanticError,
    buildDetectionContext,
    getErrorTypeLabel,
    type DetectionContext,
} from '@/services/errorDetector';
import type { SimulationDecision, PatientState, BranchingCase, SimulationStage } from '@/types/simulation';

// ============================================
// Test Helpers
// ============================================

function makeDecision(overrides: Partial<SimulationDecision> = {}): SimulationDecision {
    return {
        id: 'test-decision',
        label: 'Test Decision',
        description: 'A test decision',
        type: 'test',
        cost: 50,
        timeRequired: 30,
        consequences: {
            revealedInfo: [],
            patientStateChange: { status: 'stable' },
        },
        ...overrides,
    } as SimulationDecision;
}

function makePatientState(overrides: Partial<PatientState> = {}): PatientState {
    return {
        status: 'stable',
        symptoms: ['chest pain'],
        vitalSigns: {
            heartRate: 80,
            bloodPressure: '120/80',
            respiratoryRate: 16,
            temperature: 37,
            oxygenSaturation: 98,
        },
        ...overrides,
    } as PatientState;
}

function makeStage(overrides: Partial<SimulationStage> = {}): SimulationStage {
    return {
        id: 'stage-1',
        name: 'Initial Assessment',
        description: 'Assess the patient',
        availableDecisions: [
            makeDecision({ id: 'order-labs', type: 'test' }),
            makeDecision({ id: 'take-history', type: 'question' }),
            makeDecision({ id: 'start-treatment', type: 'treatment' }),
        ],
        requiredDecisionsToProgress: ['order-labs', 'take-history'],
        ...overrides,
    } as SimulationStage;
}

function makeContext(overrides: Partial<DetectionContext> = {}): DetectionContext {
    return {
        timeSinceLastAction: 30,
        decisionsInStage: 1,
        totalDecisions: 3,
        completedDiagnosticSteps: ['order-labs'],
        requiredDiagnosticSteps: ['order-labs', 'take-history', 'check-ecg'],
        difficulty: 'intermediate',
        hasRecentInteraction: false,
        decisionHistory: ['order-labs'],
        ...overrides,
    };
}

// ============================================
// Tests
// ============================================

describe('errorDetector', () => {
    describe('detectHesitation', () => {
        it('should not detect hesitation when time is under threshold', () => {
            const result = detectHesitation(makeContext({ timeSinceLastAction: 30, difficulty: 'intermediate' }));
            expect(result).toBeNull();
        });

        it('should detect hesitation for intermediate when time exceeds 60s', () => {
            const result = detectHesitation(makeContext({ timeSinceLastAction: 65, difficulty: 'intermediate' }));
            expect(result).not.toBeNull();
            expect(result!.type).toBe('hesitation');
            expect(result!.severity).toBe('medium');
        });

        it('should detect high severity hesitation when time exceeds 2x threshold', () => {
            const result = detectHesitation(makeContext({ timeSinceLastAction: 130, difficulty: 'intermediate' }));
            expect(result!.severity).toBe('high');
        });

        it('should not detect hesitation when there is recent interaction', () => {
            const result = detectHesitation(makeContext({
                timeSinceLastAction: 100,
                hasRecentInteraction: true,
            }));
            expect(result).toBeNull();
        });

        it('should use beginner threshold (90s)', () => {
            const result = detectHesitation(makeContext({ timeSinceLastAction: 70, difficulty: 'beginner' }));
            expect(result).toBeNull(); // Under 90s threshold for beginners
        });

        it('should use advanced threshold (45s)', () => {
            const result = detectHesitation(makeContext({ timeSinceLastAction: 50, difficulty: 'advanced' }));
            expect(result).not.toBeNull();
        });
    });

    describe('detectPrematureClosure', () => {
        it('should detect premature closure when treatment started with low diagnostic completion', () => {
            const decision = makeDecision({ type: 'treatment' });
            const context = makeContext({
                completedDiagnosticSteps: [],
                requiredDiagnosticSteps: ['lab', 'history', 'ecg'],
            });
            const result = detectPrematureClosure(decision, context);
            expect(result).not.toBeNull();
            expect(result!.type).toBe('premature_closure');
            expect(result!.severity).toBe('high');
        });

        it('should not flag premature closure for diagnostic decisions', () => {
            const decision = makeDecision({ type: 'test' });
            const result = detectPrematureClosure(decision, makeContext());
            expect(result).toBeNull();
        });

        it('should not flag when enough diagnostics are completed', () => {
            const decision = makeDecision({ type: 'treatment' });
            const context = makeContext({
                completedDiagnosticSteps: ['lab', 'history'],
                requiredDiagnosticSteps: ['lab', 'history', 'ecg'],
            });
            const result = detectPrematureClosure(decision, context);
            expect(result).toBeNull(); // 66% > 40% threshold
        });

        it('should detect procedure actions as interventional', () => {
            const decision = makeDecision({ type: 'procedure' });
            const context = makeContext({
                completedDiagnosticSteps: [],
                requiredDiagnosticSteps: ['lab', 'history'],
            });
            const result = detectPrematureClosure(decision, context);
            expect(result).not.toBeNull();
        });
    });

    describe('detectSyntaxError', () => {
        it('should detect syntax error when wrong action type is chosen', () => {
            const decision = makeDecision({ id: 'start-treatment', type: 'treatment' });
            const stage = makeStage();
            const result = detectSyntaxError(decision, stage);
            expect(result).not.toBeNull();
            expect(result!.type).toBe('syntax');
        });

        it('should not flag when action type matches expected types', () => {
            const decision = makeDecision({ id: 'order-labs', type: 'test' });
            const stage = makeStage();
            const result = detectSyntaxError(decision, stage);
            expect(result).toBeNull();
        });

        it('should not flag when stage has no required decisions', () => {
            const decision = makeDecision({ type: 'treatment' });
            const stage = makeStage({ requiredDecisionsToProgress: [] });
            const result = detectSyntaxError(decision, stage);
            expect(result).toBeNull();
        });
    });

    describe('detectSemanticError', () => {
        it('should detect when decision worsens patient to critical', () => {
            const decision = makeDecision({
                consequences: {
                    revealedInfo: [],
                    patientStateChange: { status: 'critical' },
                },
            });
            const result = detectSemanticError(decision, makePatientState());
            expect(result).not.toBeNull();
            expect(result!.type).toBe('semantic');
            expect(result!.severity).toBe('high');
        });

        it('should detect declining status as medium severity', () => {
            const decision = makeDecision({
                consequences: {
                    revealedInfo: [],
                    patientStateChange: { status: 'declining' },
                },
            });
            const result = detectSemanticError(decision, makePatientState());
            expect(result!.severity).toBe('medium');
        });

        it('should not flag stable or improving outcomes', () => {
            const decision = makeDecision({
                consequences: {
                    revealedInfo: [],
                    patientStateChange: { status: 'improving' },
                },
            });
            const result = detectSemanticError(decision, makePatientState());
            expect(result).toBeNull();
        });
    });

    describe('classifyError', () => {
        it('should prioritize high-severity semantic errors', () => {
            const decision = makeDecision({
                type: 'treatment',
                consequences: {
                    revealedInfo: [],
                    patientStateChange: { status: 'critical' },
                },
            });
            const result = classifyError(
                decision,
                makePatientState(),
                {} as BranchingCase,
                makeStage(),
                makeContext({ completedDiagnosticSteps: [], requiredDiagnosticSteps: ['lab'] })
            );
            expect(result).not.toBeNull();
            expect(result!.type).toBe('semantic');
        });

        it('should return null when no errors detected', () => {
            const decision = makeDecision({ type: 'test' });
            const result = classifyError(
                decision,
                makePatientState(),
                {} as BranchingCase,
                makeStage({ requiredDecisionsToProgress: [] }),
                makeContext()
            );
            expect(result).toBeNull();
        });
    });

    describe('getErrorTypeLabel', () => {
        it('should return readable labels', () => {
            expect(getErrorTypeLabel('syntax')).toBe('Action Type Mismatch');
            expect(getErrorTypeLabel('semantic')).toBe('Potential Patient Harm');
            expect(getErrorTypeLabel('hesitation')).toBe('Decision Delay');
            expect(getErrorTypeLabel('premature_closure')).toBe('Premature Closure');
        });
    });
});
