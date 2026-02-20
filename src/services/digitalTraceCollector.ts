/**
 * Digital Trace Collector Service
 *
 * Responsible for collecting and structuring `DigitalTrace` data from simulation events.
 * Aggregates behavioral signals (errors, hesitation, skipped steps, time spent) per stage.
 *
 * UML Responsibilities:
 * - Collects raw signals -> DigitalTrace
 * - Integrates with ErrorDetector
 * - Provides data for Feedback and Scaffolding logic
 */

import type { DigitalTrace } from '@/types/domainModel';
import type { ErrorClassification } from '@/services/errorDetector';
import type { SimulationStage, SimulationDecision } from '@/types/simulation';

export class DigitalTraceCollector {
    private traces: DigitalTrace[] = [];
    private currentStageTrace: DigitalTrace | null = null;
    private stageStartTime: number = 0;

    /**
     * Start tracking traces for a new stage.
     * Should be called when entering a stage.
     */
    public startStage(stageId: string): void {
        // If there was an active stage, finalize it first
        if (this.currentStageTrace) {
            this.finalizeStage();
        }

        this.stageStartTime = Date.now();
        this.currentStageTrace = {
            errors: [],
            hesitation: [],
            skippedSteps: [],
            timeSpent: 0,
            stageId: stageId,
            collectedAt: Date.now(),
        };
    }

    /**
     * Record a detected error in the current trace.
     */
    public recordError(error: ErrorClassification): void {
        if (!this.currentStageTrace) return;

        // Store error type/ID. In a real DB we might store a UUID, 
        // here we store "type:severity" or similar unique key if available, 
        // or just the type for analytics counting.
        // The DigitalTrace interface defines errors as string[].
        this.currentStageTrace.errors.push(`${error.type}:${error.severity}`);
    }

    /**
     * Record a hesitation event (seconds of inactivity).
     */
    public recordHesitation(durationSeconds: number): void {
        if (!this.currentStageTrace) return;
        this.currentStageTrace.hesitation.push(durationSeconds);
    }

    /**
     * Finalize the current stage trace.
     * Calculates time spent and identification of skipped steps.
     */
    public finalizeStage(
        finalizedStageData?: {
            stage: SimulationStage;
            decisionsMade: string[];
        }
    ): DigitalTrace | null {
        if (!this.currentStageTrace) return null;

        // Update time spent
        const now = Date.now();
        this.currentStageTrace.timeSpent = (now - this.stageStartTime) / 1000;
        this.currentStageTrace.collectedAt = now;

        // Calculate skipped steps if data provided
        if (finalizedStageData) {
            const { stage, decisionsMade } = finalizedStageData;
            const takenSet = new Set(decisionsMade);

            this.currentStageTrace.skippedSteps = stage.availableDecisions
                .filter(d => !takenSet.has(d.id))
                .map(d => d.id);
        }

        // Archive
        this.traces.push({ ...this.currentStageTrace });

        const finalized = this.currentStageTrace;
        this.currentStageTrace = null;

        return finalized;
    }

    /**
     * Get the accumulated history of traces for the session.
     */
    public getSessionTrace(): DigitalTrace[] {
        return [...this.traces];
    }

    /**
     * Get the current active trace (incomplete).
     */
    public getCurrentTrace(): DigitalTrace | null {
        if (!this.currentStageTrace) return null;

        // Return a snapshot with current time spent calculated
        return {
            ...this.currentStageTrace,
            timeSpent: (Date.now() - this.stageStartTime) / 1000
        };
    }
}

// Singleton instance for the session
export const digitalTraceCollector = new DigitalTraceCollector();
