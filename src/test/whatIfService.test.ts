/**
 * Unit tests for whatIfService.ts
 * 
 * Tests scenario generation, filtering, and statistics.
 */

import { describe, it, expect } from 'vitest';
import {
    generateWhatIfScenarios,
    filterScenarios,
    getScenarioStats,
} from '@/services/whatIfService';
import type { SimulationDecision, BranchingCase, SimulationStage } from '@/types/simulation';

// ======================
// Test Helpers
// ======================

function makeDecision(overrides: Partial<SimulationDecision> = {}): SimulationDecision {
    return {
        id: 'decision-1',
        label: 'Order ECG',
        type: 'test',
        cost: 50,
        timeRequired: 30,
        consequences: {},
        ...overrides,
    } as SimulationDecision;
}

function makeStage(decisions: SimulationDecision[]): SimulationStage {
    return {
        id: 'stage-1',
        name: 'Initial Assessment',
        availableDecisions: decisions,
        description: '',
    } as SimulationStage;
}

function makeCaseData(optimalDecisions: string[] = [], stages: SimulationStage[] = []): BranchingCase {
    return {
        id: 'sim-001',
        title: 'Chest Pain',
        specialty: 'cardiology',
        difficulty: 'intermediate',
        stages,
        branches: [],
        initialPatientState: {
            status: 'stable',
            vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
            symptoms: [],
            timeElapsed: 0,
        },
        optimalPath: { decisions: optimalDecisions, description: 'Optimal path' },
        learningObjectives: [],
    } as unknown as BranchingCase;
}

// ======================
// Tests
// ======================

describe('whatIfService', () => {
    describe('generateWhatIfScenarios', () => {
        it('should generate scenarios for alternative decisions in stage', () => {
            const actual = makeDecision({ id: 'ecg', label: 'Order ECG' });
            const alt1 = makeDecision({ id: 'troponin', label: 'Order Troponin', cost: 30 });
            const alt2 = makeDecision({ id: 'aspirin', label: 'Give Aspirin', type: 'treatment', cost: 5 });
            const stage = makeStage([actual, alt1, alt2]);
            const caseData = makeCaseData(['ecg', 'troponin'], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);

            expect(scenarios.length).toBe(2);
            expect(scenarios[0].alternative_decision).toBe('troponin');
            expect(scenarios[1].alternative_decision).toBe('aspirin');
        });

        it('should limit to 3 alternative scenarios', () => {
            const actual = makeDecision({ id: 'main' });
            const alternatives = Array.from({ length: 5 }, (_, i) =>
                makeDecision({ id: `alt-${i}`, label: `Alt ${i}` })
            );
            const stage = makeStage([actual, ...alternatives]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios.length).toBe(3);
        });

        it('should return empty array if no alternatives', () => {
            const actual = makeDecision({ id: 'only-one' });
            const stage = makeStage([actual]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios.length).toBe(0);
        });

        it('should predict "better" when alternative is on optimal path but actual is not', () => {
            const actual = makeDecision({ id: 'non-optimal' });
            const alt = makeDecision({ id: 'optimal', label: 'Optimal Choice' });
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData(['optimal'], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].predicted_outcome).toBe('better');
        });

        it('should predict "worse" when alternative is NOT on optimal path but actual IS', () => {
            const actual = makeDecision({ id: 'optimal' });
            const alt = makeDecision({ id: 'non-optimal', label: 'Non-Optimal' });
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData(['optimal'], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].predicted_outcome).toBe('worse');
        });

        it('should predict "similar" when both are on optimal path', () => {
            const actual = makeDecision({ id: 'opt-1' });
            const alt = makeDecision({ id: 'opt-2', label: 'Also Optimal' });
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData(['opt-1', 'opt-2'], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].predicted_outcome).toBe('similar');
        });

        it('should include scenario description with patient state change info', () => {
            const actual = makeDecision({ id: 'actual' });
            const alt = makeDecision({
                id: 'alt',
                label: 'Alternative',
                consequences: {
                    patientStateChange: { status: 'critical' },
                },
            } as any);
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].scenario_description).toContain('deteriorated');
        });

        it('should include new information revealed in description', () => {
            const actual = makeDecision({ id: 'actual' });
            const alt = makeDecision({
                id: 'alt',
                label: 'Alt',
                consequences: {
                    newInformationRevealed: 'Blood glucose is 40 mg/dL',
                },
            } as any);
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].scenario_description).toContain('Blood glucose');
        });

        it('should generate scenario title with alternative label', () => {
            const actual = makeDecision({ id: 'a' });
            const alt = makeDecision({ id: 'b', label: 'Give Morphine' });
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].scenario_title).toBe('Alternative: Give Morphine');
        });

        it('should populate decision references correctly', () => {
            const actual = makeDecision({ id: 'chosen', label: 'Chosen Action' });
            const alt = makeDecision({ id: 'alt', label: 'Alt Action' });
            const stage = makeStage([actual, alt]);
            const caseData = makeCaseData([], [stage]);

            const scenarios = generateWhatIfScenarios(actual, caseData, stage);
            expect(scenarios[0].decision_made).toBe('chosen');
            expect(scenarios[0].decision_made_label).toBe('Chosen Action');
            expect(scenarios[0].alternative_decision).toBe('alt');
            expect(scenarios[0].alternative_decision_label).toBe('Alt Action');
        });
    });

    describe('filterScenarios', () => {
        const scenarios = [
            { predicted_outcome: 'better' },
            { predicted_outcome: 'worse' },
            { predicted_outcome: 'similar' },
            { predicted_outcome: 'better' },
        ] as any[];

        it('should filter by predicted outcome', () => {
            expect(filterScenarios(scenarios, 'better').length).toBe(2);
            expect(filterScenarios(scenarios, 'worse').length).toBe(1);
            expect(filterScenarios(scenarios, 'similar').length).toBe(1);
            expect(filterScenarios(scenarios, 'different').length).toBe(0);
        });
    });

    describe('getScenarioStats', () => {
        it('should calculate correct stats', () => {
            const scenarios = [
                { predicted_outcome: 'better', was_explored: true },
                { predicted_outcome: 'worse', was_explored: false },
                { predicted_outcome: 'better', was_explored: true },
                { predicted_outcome: 'different', was_explored: false },
            ] as any[];

            const stats = getScenarioStats(scenarios);
            expect(stats.total).toBe(4);
            expect(stats.better).toBe(2);
            expect(stats.worse).toBe(1);
            expect(stats.similar).toBe(0);
            expect(stats.different).toBe(1);
            expect(stats.explored).toBe(2);
        });

        it('should handle empty array', () => {
            const stats = getScenarioStats([]);
            expect(stats.total).toBe(0);
            expect(stats.explored).toBe(0);
        });
    });
});
