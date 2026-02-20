import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    DollarSign,
    CheckCircle2,
    ChevronRight,
    Stethoscope,
    Syringe,
    MessageSquare,
    Eye,
    Users,
    Beaker,
    Activity,
    LayoutGrid,
    List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstraintWarning } from '@/components/simulation/ConstraintWarning';
import type { SimulationDecision, SimulationStage, BranchingCase } from '@/types/simulation';
import type { ConstraintValidation } from '@/services/constraintValidator';
import { cn } from '@/lib/utils';

const decisionTypeIcons: Record<string, any> = {
    test: Beaker,
    treatment: Syringe,
    consultation: Users,
    observation: Eye,
    question: MessageSquare,
    procedure: Stethoscope,
};

interface DecisionPanelProps {
    branchingCase: BranchingCase;
    currentStage: SimulationStage;
    currentStageIndex: number;
    decisionsLog: Array<{ decision: SimulationDecision; timestamp: number }>;
    currentWarning: ConstraintValidation | null;
    onDecision: (decision: SimulationDecision) => void;
    onAdvanceStage: () => void;
    onComplete: () => void;
    onProceedWithWarning: () => void;
    onChooseAlternative: (alternativeId?: string) => void;
}

export function DecisionPanel({
    branchingCase,
    currentStage,
    currentStageIndex,
    decisionsLog,
    currentWarning,
    onDecision,
    onAdvanceStage,
    onComplete,
    onProceedWithWarning,
    onChooseAlternative,
}: DecisionPanelProps) {
    const isFinalStage = currentStageIndex === branchingCase.stages.length - 1;
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <section className="lg:col-span-2 space-y-4 h-full flex flex-col">
            {/* Constraint Warning Overlay */}
            <AnimatePresence>
                {currentWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    >
                        <div className="w-full max-w-lg">
                            <ConstraintWarning
                                validation={currentWarning}
                                onProceed={onProceedWithWarning}
                                onChooseAlternative={onChooseAlternative}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage Header with View Toggle */}
            <div className="shrink-0">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold font-heading tracking-tight">
                        {currentStage.name}
                    </h2>
                    <div className="flex items-center gap-2">
                        {isFinalStage && (
                            <Badge variant="default" className="bg-success hover:bg-success/90 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Final Stage
                            </Badge>
                        )}
                        {/* View toggle */}
                        <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-1 rounded-md transition-all",
                                    viewMode === 'grid'
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-1 rounded-md transition-all",
                                    viewMode === 'list'
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="List view"
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {currentStage.description}
                </p>
            </div>

            {/* Decision cards */}
            <div className={cn(
                viewMode === 'grid'
                    ? "grid gap-3 sm:grid-cols-2"
                    : "flex flex-col gap-1.5"
            )}>
                <AnimatePresence mode="popLayout">
                    {currentStage.availableDecisions.map((decision, idx) => {
                        const Icon = decisionTypeIcons[decision.type] || Activity;
                        const isChosen = decisionsLog.some(d => d.decision.id === decision.id);

                        if (viewMode === 'list') {
                            // ── LIST VIEW ──
                            return (
                                <motion.button
                                    key={decision.id}
                                    layout
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ delay: idx * 0.02 }}
                                    onClick={() => !isChosen && onDecision(decision)}
                                    disabled={isChosen}
                                    className={cn(
                                        "group flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-all duration-150",
                                        "focus-visible:ring-2 focus-visible:ring-primary focus:outline-none",
                                        isChosen
                                            ? "opacity-50 bg-muted/50 border border-border/50 cursor-not-allowed"
                                            : "bg-card/60 border border-border/40 hover:bg-card hover:shadow-md hover:border-primary/30"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "p-1.5 rounded-md shrink-0 transition-colors",
                                        isChosen
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-primary/10 text-primary group-hover:bg-primary/15"
                                    )}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>

                                    {/* Label + Description */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-xs leading-tight truncate">
                                            {decision.label}
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {decision.description}
                                        </p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground shrink-0">
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="h-2.5 w-2.5" />
                                            {decision.timeRequired}m
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <DollarSign className="h-2.5 w-2.5" />
                                            {decision.cost}
                                        </span>
                                    </div>

                                    {/* Check */}
                                    {isChosen && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                                </motion.button>
                            );
                        }

                        // ── GRID VIEW (original cards) ──
                        return (
                            <motion.button
                                key={decision.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.04 }}
                                onClick={() => !isChosen && onDecision(decision)}
                                disabled={isChosen}
                                className={cn(
                                    "group flex flex-col items-start text-left p-4 rounded-xl transition-all duration-200",
                                    "focus-visible:ring-2 focus-visible:ring-primary focus:outline-none",
                                    isChosen
                                        ? "opacity-50 bg-muted border border-border cursor-not-allowed"
                                        : "glass-card hover:shadow-lg hover:-translate-y-0.5"
                                )}
                            >
                                {/* Icon + check */}
                                <div className="flex w-full justify-between items-start mb-2">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {isChosen && <CheckCircle2 className="h-4 w-4 text-success" />}
                                </div>

                                {/* Label */}
                                <h3 className="font-semibold text-sm mb-0.5 leading-snug">
                                    {decision.label}
                                </h3>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-grow">
                                    {decision.description}
                                </p>

                                {/* Time + cost */}
                                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground mt-auto pt-2 border-t border-border/50 w-full">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {decision.timeRequired}m
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {decision.cost}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Stage navigation */}
            <div className="flex justify-end mt-auto pt-3 border-t border-border/50 shrink-0">
                {!isFinalStage ? (
                    <Button onClick={onAdvanceStage} className="gap-2">
                        Next Stage
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={onComplete}
                        className="bg-success hover:bg-success/90 gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete Case
                    </Button>
                )}
            </div>
        </section>
    );
}
