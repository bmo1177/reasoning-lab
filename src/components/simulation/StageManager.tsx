/**
 * StageManager — 4-Stage Clinical Reasoning Flow
 * 
 * Wraps the existing stage progression with a 4-stage meta-layer:
 *   1. Setting Test  → Establish context, gather initial patient data
 *   2. Task Test     → Make diagnostic and treatment decisions
 *   3. Process Test  → Reflect on reasoning process (self-assessment)
 *   4. Self-Level    → Metacognitive evaluation (confidence calibration)
 * 
 * Each simulation stage maps to one of these meta-stages.
 * The component shows a progress indicator and stage descriptions.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    ClipboardList,
    Stethoscope,
    Brain,
    Sparkles,
    Check,
} from 'lucide-react';

// ======================
// Types
// ======================

export type ClinicalReasoningStage =
    | 'setting-test'
    | 'task-test'
    | 'process-test'
    | 'self-level';

export interface MetaStageConfig {
    id: ClinicalReasoningStage;
    label: string;
    shortLabel: string;
    description: string;
    icon: typeof ClipboardList;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface StageManagerProps {
    /** Current simulation stage index (0-based) */
    currentStageIndex: number;
    /** Total number of simulation stages */
    totalStages: number;
    /** Whether the simulation is completed */
    isCompleted?: boolean;
    /** Optional class name */
    className?: string;
}

// ======================
// Constants
// ======================

export const META_STAGES: MetaStageConfig[] = [
    {
        id: 'setting-test',
        label: 'Setting Test',
        shortLabel: 'Setting',
        description: 'Establish context and gather initial patient information',
        icon: ClipboardList,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700',
    },
    {
        id: 'task-test',
        label: 'Task Test',
        shortLabel: 'Task',
        description: 'Make diagnostic and treatment decisions',
        icon: Stethoscope,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
        borderColor: 'border-emerald-300 dark:border-emerald-700',
    },
    {
        id: 'process-test',
        label: 'Process Test',
        shortLabel: 'Process',
        description: 'Reflect on your reasoning process and decisions',
        icon: Brain,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700',
    },
    {
        id: 'self-level',
        label: 'Self-Level Test',
        shortLabel: 'Self-Level',
        description: 'Evaluate your confidence and identify knowledge gaps',
        icon: Sparkles,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700',
    },
];

// ======================
// Mapping Logic
// ======================

/**
 * Map a simulation stage index to a clinical reasoning meta-stage.
 * Distributes stages proportionally across the 4 meta-stages.
 */
export function getMetaStageForIndex(
    stageIndex: number,
    totalStages: number,
): ClinicalReasoningStage {
    if (totalStages <= 1) return 'task-test';

    const fraction = stageIndex / totalStages;

    // Setting Test: first ~25% of stages
    if (fraction < 0.25) return 'setting-test';
    // Task Test: middle ~50% of stages
    if (fraction < 0.75) return 'task-test';
    // Process Test: ~15% before last stage
    if (fraction < 0.9) return 'process-test';
    // Self-Level: final stage(s)
    return 'self-level';
}

/**
 * Get the current meta-stage configuration
 */
export function getMetaStageConfig(stage: ClinicalReasoningStage): MetaStageConfig {
    return META_STAGES.find(s => s.id === stage) || META_STAGES[1];
}

/**
 * Get progress through the 4-stage flow (0-100)
 */
export function getMetaStageProgress(
    stageIndex: number,
    totalStages: number,
): number {
    if (totalStages <= 0) return 0;
    return Math.round((stageIndex / totalStages) * 100);
}

// ======================
// Component
// ======================

export function StageManager({
    currentStageIndex,
    totalStages,
    isCompleted = false,
    className,
}: StageManagerProps) {
    const currentMetaStage = useMemo(
        () => getMetaStageForIndex(currentStageIndex, totalStages),
        [currentStageIndex, totalStages],
    );

    const currentConfig = useMemo(
        () => getMetaStageConfig(currentMetaStage),
        [currentMetaStage],
    );

    const metaStageIndex = META_STAGES.findIndex(s => s.id === currentMetaStage);

    return (
        <div className={cn('w-full', className)}>
            {/* Progress steps */}
            <div className="flex items-center justify-between gap-1">
                {META_STAGES.map((stage, idx) => {
                    const isActive = stage.id === currentMetaStage && !isCompleted;
                    const isPast = idx < metaStageIndex || isCompleted;
                    const Icon = stage.icon;

                    return (
                        <div key={stage.id} className="flex-1 flex flex-col items-center relative">
                            {/* Connector line */}
                            {idx > 0 && (
                                <div
                                    className={cn(
                                        'absolute top-4 -left-1/2 w-full h-0.5',
                                        isPast ? 'bg-primary' : 'bg-muted',
                                    )}
                                />
                            )}

                            {/* Stage dot */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                }}
                                className={cn(
                                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                                    isPast && 'bg-primary border-primary text-primary-foreground',
                                    isActive && cn(stage.bgColor, stage.borderColor, stage.color),
                                    !isPast && !isActive && 'bg-muted border-muted-foreground/20 text-muted-foreground/40',
                                )}
                            >
                                {isPast ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </motion.div>

                            {/* Label */}
                            <span
                                className={cn(
                                    'text-[10px] font-medium mt-1 text-center leading-tight',
                                    isActive ? stage.color : isPast ? 'text-foreground' : 'text-muted-foreground/50',
                                )}
                            >
                                {stage.shortLabel}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Current stage description */}
            {!isCompleted && (
                <motion.div
                    key={currentMetaStage}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'mt-3 rounded-lg border px-3 py-2 text-xs',
                        currentConfig.bgColor,
                        currentConfig.borderColor,
                    )}
                >
                    <span className={cn('font-semibold', currentConfig.color)}>
                        {currentConfig.label}:
                    </span>{' '}
                    <span className="text-foreground/80">
                        {currentConfig.description}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
