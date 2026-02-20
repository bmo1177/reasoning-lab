import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Clock,
    DollarSign,
    ChevronRight,
    Layers,
} from 'lucide-react';
import { WhatIfButton } from '@/components/simulation/WhatIfPanel';
import type { BranchingCase } from '@/types/simulation';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface SimulationHeaderProps {
    branchingCase: BranchingCase;
    currentStageIndex: number;
    timeRemaining: number | null;
    totalCost: number;
    whatIfCount: number;
    exploredCount: number;
    onShowWhatIf: () => void;
}

export function SimulationHeader({
    branchingCase,
    currentStageIndex,
    timeRemaining,
    totalCost,
    whatIfCount,
    exploredCount,
    onShowWhatIf,
}: SimulationHeaderProps) {
    const navigate = useNavigate();
    const isCriticalTime = timeRemaining !== null && timeRemaining < 60;
    const totalStages = branchingCase.stages.length;
    const progressPercent = ((currentStageIndex + 1) / totalStages) * 100;
    const isFinal = currentStageIndex === totalStages - 1;

    return (
        <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-sm">
            <div className="flex items-center h-12 px-4 gap-3">

                {/* ─── Left: Back + Breadcrumb ─── */}
                <div className="flex items-center gap-2 min-w-0 shrink">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/simulations')}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                        <span className="hidden sm:inline">Simulations</span>
                        <ChevronRight className="h-3 w-3 shrink-0 hidden sm:inline" />
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                            {branchingCase.title}
                        </span>
                    </div>
                </div>

                {/* ─── Center: Stage Progress ─── */}
                <div className="flex-1 flex items-center justify-center gap-3">
                    {/* Stage dots */}
                    <div className="flex items-center gap-1.5">
                        {branchingCase.stages.map((_, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <div
                                    className={cn(
                                        "h-2 w-2 rounded-full transition-all duration-500",
                                        idx < currentStageIndex
                                            ? "bg-primary scale-100"
                                            : idx === currentStageIndex
                                                ? "bg-primary ring-[3px] ring-primary/20 scale-110"
                                                : "bg-muted-foreground/20"
                                    )}
                                />
                                {idx < totalStages - 1 && (
                                    <div
                                        className={cn(
                                            "h-[1.5px] w-4 rounded-full transition-all duration-500",
                                            idx < currentStageIndex ? "bg-primary" : "bg-muted-foreground/15"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Stage label */}
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        isFinal
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-primary/8 text-primary border border-primary/15"
                    )}>
                        <Layers className="h-3 w-3" />
                        <span>
                            {isFinal ? 'Final' : `Stage ${currentStageIndex + 1}`}
                            <span className="text-muted-foreground font-normal ml-0.5">/ {totalStages}</span>
                        </span>
                    </div>
                </div>

                {/* ─── Right: Timer + Cost + What-If ─── */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Timer pill */}
                    {timeRemaining !== null && (
                        <div
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border transition-all",
                                isCriticalTime
                                    ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse"
                                    : "bg-muted/50 border-border/60 text-foreground"
                            )}
                        >
                            <Clock className={cn("h-3 w-3", isCriticalTime && "animate-pulse")} />
                            <span className="tabular-nums">{formatTime(timeRemaining)}</span>
                        </div>
                    )}

                    {/* Cost pill */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-muted/50 border border-border/60">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="tabular-nums">{totalCost}</span>
                    </div>

                    {/* What-If button */}
                    {whatIfCount > 0 && (
                        <WhatIfButton
                            scenarioCount={whatIfCount}
                            exploredCount={exploredCount}
                            onClick={onShowWhatIf}
                        />
                    )}
                </div>
            </div>

            {/* ─── Progress bar ─── */}
            <div className="h-[2px] bg-muted/30">
                <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </header>
    );
}
