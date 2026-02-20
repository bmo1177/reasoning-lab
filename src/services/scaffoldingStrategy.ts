/**
 * Scaffolding Strategy Service
 *
 * Implements the ScaffoldingStrategy class from the research paper's UML domain model.
 * Manages adaptive support levels (1-5) and support fading based on learner performance.
 *
 * UML Responsibilities:
 * - scaffoldLevel: Current support level
 * - fadeThreshold: Performance threshold to reduce scaffolding
 * - selectLevel(): Choose scaffold level based on digital traces
 * - fadeSupport(): Gradually reduce scaffolding as competency improves
 */

import type { ScaffoldingStrategyConfig, DigitalTrace } from '@/types/domainModel';
import type { LearnerCompetency } from '@/types/competency';

export class ScaffoldingStrategy {
    private config: ScaffoldingStrategyConfig;

    constructor(initialLevel: 1 | 2 | 3 | 4 | 5 = 1, fadeThreshold = 0.7) {
        this.config = {
            scaffoldLevel: initialLevel,
            fadeThreshold,
            active: true,
            label: 'Standard Scaffolding',
        };
    }

    /**
     * Get current configuration.
     */
    public getConfig(): ScaffoldingStrategyConfig {
        return { ...this.config };
    }

    /**
     * Select appropriate scaffold level based on recent digital traces.
     * UML: selectLevel()
     *
     * Logic:
     * - High error rate or hesitation -> Increase support (lower level number in some models,
     *   but here we'll assume Level 1 = High Support, Level 5 = Low Support).
     *   WAIT: Usually Level 1 is low support?
     *   Let's check the HintEngine: Level 1 (General) -> Level 3 (Direct).
     *   So higher number = more support in HintEngine.
     *
     *   However, "Scaffold Level" often implies "Amount of Scaffolding".
     *   Let's define:
     *   Level 5: Maximum Support (Explicit guidance, worked examples)
     *   Level 1: Minimum Support (Independent problem solving)
     */
    public selectLevel(trace: DigitalTrace): ScaffoldingStrategyConfig {
        const errorRate = trace.errors.length / (trace.timeSpent / 60 || 1); // Errors per minute approx
        const hesitationRatio = trace.hesitation.reduce((a, b) => a + b, 0) / trace.timeSpent;

        let newLevel = this.config.scaffoldLevel;

        // Adapt based on struggle detection
        if (errorRate > 2 || hesitationRatio > 0.3) {
            // Struggling -> Increase support
            newLevel = Math.min(5, newLevel + 1) as 1 | 2 | 3 | 4 | 5;
        } else if (errorRate === 0 && hesitationRatio < 0.1) {
            // Cruising -> Decrease support (Fade)
            newLevel = Math.max(1, newLevel - 1) as 1 | 2 | 3 | 4 | 5;
        }

        if (newLevel !== this.config.scaffoldLevel) {
            this.config.scaffoldLevel = newLevel;
            // Recalculate fade threshold if we just increased support
            if (newLevel > this.config.scaffoldLevel) {
                this.config.fadeThreshold = 0.8; // Require higher accuracy to fade again
            }
        }

        return this.config;
    }

    /**
     * Fade support based on competency node mastery.
     * UML: fadeSupport()
     */
    public fadeSupport(competency: LearnerCompetency): void {
        const masteryParam = competency.masteryLevel / 100; // 0 to 1

        if (masteryParam > this.config.fadeThreshold) {
            // Reduce scaffolding level by 1
            this.config.scaffoldLevel = Math.max(1, this.config.scaffoldLevel - 1) as 1 | 2 | 3 | 4 | 5;
        }
    }

    /**
     * Force set a specific level (e.g., instructor override).
     */
    public setLevel(level: 1 | 2 | 3 | 4 | 5): void {
        this.config.scaffoldLevel = level;
    }
}

/**
 * Factory to create a default strategy instance.
 */
export function createScaffoldingStrategy(): ScaffoldingStrategy {
    return new ScaffoldingStrategy(3, 0.7); // Start at medium support
}
