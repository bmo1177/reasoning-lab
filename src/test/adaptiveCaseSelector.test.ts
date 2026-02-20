/**
 * Unit tests for adaptiveCaseSelector.ts
 * 
 * Tests the exported API: selectAdaptiveCase, getMultipleRecommendations,
 * and generateRecommendationExplanation.
 * 
 * `getDefaultRecommendation` is a private function (not exported),
 * so it's tested indirectly through `selectAdaptiveCase` when
 * no user profile exists.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock analyticsService — new user returns null profile
vi.mock('@/services/analyticsService', () => ({
    getUserSkillProfile: vi.fn().mockResolvedValue(null),
    getUserSimulationHistory: vi.fn().mockResolvedValue([]),
}));

// Mock sample data with controlled test cases
vi.mock('@/data/sampleBranchingCases', () => ({
    sampleBranchingCases: [
        {
            id: 'sim-001',
            title: 'Chest Pain',
            description: 'A patient with chest pain',
            specialty: 'cardiology',
            difficulty: 'beginner',
            stages: [{ id: 's1', availableDecisions: [], description: '', name: 'S1' }],
            branches: [],
            initialPatientState: { status: 'stable', vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 }, symptoms: [], timeElapsed: 0 },
            optimalPath: { decisions: [], description: '' },
            learningObjectives: ['ECG interpretation', 'Troponin ordering'],
            hasTimeLimit: false,
        },
        {
            id: 'sim-002',
            title: 'Pneumonia',
            description: 'A patient with pneumonia',
            specialty: 'pulmonology',
            difficulty: 'beginner',
            stages: [{ id: 's1', availableDecisions: [], description: '', name: 'S1' }],
            branches: [],
            initialPatientState: { status: 'stable', vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 }, symptoms: [], timeElapsed: 0 },
            optimalPath: { decisions: [], description: '' },
            learningObjectives: ['Antibiotic selection', 'CXR interpretation'],
            hasTimeLimit: false,
        },
        {
            id: 'sim-003',
            title: 'Hypoglycemia',
            description: 'A patient with hypoglycemia',
            specialty: 'endocrinology',
            difficulty: 'advanced',
            stages: [{ id: 's1', availableDecisions: [], description: '', name: 'S1' }],
            branches: [],
            initialPatientState: { status: 'stable', vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 }, symptoms: [], timeElapsed: 0 },
            optimalPath: { decisions: [], description: '' },
            learningObjectives: ['Blood glucose management', 'Insulin dosing'],
            hasTimeLimit: true,
        },
    ],
}));

import {
    selectAdaptiveCase,
    getMultipleRecommendations,
    generateRecommendationExplanation,
} from '@/services/adaptiveCaseSelector';

// ======================
// Tests
// ======================

describe('adaptiveCaseSelector', () => {
    describe('selectAdaptiveCase — new user (no profile)', () => {
        it('should return a recommendation for a new user with no profile', async () => {
            const result = await selectAdaptiveCase({ userId: 'brand-new-user' });
            // With null profile, falls back to getDefaultRecommendation
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result!.caseId).toBeDefined();
            expect(typeof result!.reason).toBe('string');
            expect(result!.reason.length).toBeGreaterThan(0);
        });

        it('should recommend a beginner case for new users', async () => {
            const result = await selectAdaptiveCase({ userId: 'new-user-2' });
            expect(result).not.toBeNull();
            // Default recs pick from beginner cases (sim-001, sim-002)
            expect(['sim-001', 'sim-002']).toContain(result!.caseId);
        });

        it('should include expectedDifficulty', async () => {
            const result = await selectAdaptiveCase({ userId: 'new-user-3' });
            expect(result).not.toBeNull();
            expect(result!.expectedDifficulty).toBeDefined();
            expect(typeof result!.expectedDifficulty).toBe('string');
        });
    });

    describe('selectAdaptiveCase — filtering', () => {
        it('should handle target specialty filter', async () => {
            const result = await selectAdaptiveCase({
                userId: 'test-user',
                targetSpecialty: 'cardiology',
            });
            // New user fallback might ignore specialty, but should still return something
            expect(result).toBeDefined();
        });
    });

    describe('getMultipleRecommendations', () => {
        it('should return recommendations up to the requested count', async () => {
            const recs = await getMultipleRecommendations({ userId: 'multi-user' }, 2);
            expect(recs.length).toBeLessThanOrEqual(2);
            expect(recs.length).toBeGreaterThan(0);
        });

        it('should each have required fields', async () => {
            const recs = await getMultipleRecommendations({ userId: 'multi-user-2' }, 1);
            recs.forEach(rec => {
                expect(rec.caseId).toBeDefined();
                expect(rec.reason).toBeDefined();
                expect(rec.expectedDifficulty).toBeDefined();
            });
        });

        it('should default to up to 3 recommendations', async () => {
            const recs = await getMultipleRecommendations({ userId: 'multi-user-3' });
            expect(recs.length).toBeLessThanOrEqual(3);
        });
    });

    describe('generateRecommendationExplanation', () => {
        it('should generate readable explanation', () => {
            const explanation = generateRecommendationExplanation({
                caseId: 'sim-001',
                reason: 'Starting with a beginner case',
                expectedDifficulty: 'appropriate for beginners',
                targetedObjectives: ['ECG interpretation'],
                targetedWeaknesses: [],
            });
            expect(explanation).toContain('Starting with a beginner case');
            expect(explanation).toContain('appropriate for beginners');
            expect(explanation).toContain('ECG interpretation');
        });

        it('should include weakness info when present', () => {
            const explanation = generateRecommendationExplanation({
                caseId: 'sim-001',
                reason: 'Targets your weak area',
                expectedDifficulty: 'moderate',
                targetedObjectives: [],
                targetedWeaknesses: ['cardiology'],
            });
            expect(explanation).toContain('cardiology');
        });

        it('should handle empty objectives and weaknesses', () => {
            const explanation = generateRecommendationExplanation({
                caseId: 'sim-001',
                reason: 'Default recommendation',
                expectedDifficulty: 'easy',
                targetedObjectives: [],
                targetedWeaknesses: [],
            });
            expect(explanation).toBeDefined();
            expect(explanation.length).toBeGreaterThan(0);
        });
    });
});
