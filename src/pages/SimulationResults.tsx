import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Target,
    TrendingUp,
    ChevronRight,
    RotateCcw,
    Brain,
    Lightbulb,
    AlertTriangle,
    Zap,
    BarChart3,
    Activity,
    Stethoscope,
    Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BranchingCase, SimulationDecision, PatientState } from '@/types/simulation';

interface SessionState {
    branchingCase: BranchingCase;
    decisionsLog: Array<{ decision: SimulationDecision; timestamp: number }>;
    totalCost: number;
    patientState: PatientState;
    revealedInfo: string[];
    startTime: number;
    sessionId?: string;
}

// --- Helpers ---
function calculateScore(session: SessionState): number {
    const { branchingCase, decisionsLog, totalCost } = session;
    const optimal = branchingCase.optimalPath;

    // Decisions overlap with optimal
    const optimalDecisions = new Set(optimal.decisions);
    const madeDecisions = decisionsLog.map(d => d.decision.id);
    const correctCount = madeDecisions.filter(id => optimalDecisions.has(id)).length;
    const decisionScore = optimalDecisions.size > 0
        ? (correctCount / optimalDecisions.size) * 60
        : 60;

    // Cost efficiency (max 20 points)
    const costRatio = optimal.totalCost > 0 ? totalCost / optimal.totalCost : 1;
    const costScore = costRatio <= 1 ? 20 : Math.max(0, 20 - (costRatio - 1) * 20);

    // Information gathering (max 20 points)
    const infoScore = Math.min(20, (session.revealedInfo.length / Math.max(1, branchingCase.stages.length * 2)) * 20);

    return Math.round(Math.min(100, decisionScore + costScore + infoScore));
}

function getOutcomeLabel(state: PatientState): { label: string; color: string; icon: typeof CheckCircle2 } {
    switch (state.status) {
        case 'improving':
        case 'resolved':
            return { label: 'Good Outcome', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
        case 'stable':
            return { label: 'Stable Outcome', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20', icon: TrendingUp };
        case 'declining':
            return { label: 'Declining', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle };
        case 'critical':
            return { label: 'Critical', color: 'text-red-600 bg-red-500/10 border-red-500/20', icon: XCircle };
        default:
            return { label: 'Unknown', color: 'text-muted-foreground bg-muted', icon: Target };
    }
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
}

function CircularProgress({ score, size = 120, strokeWidth = 8, color = "text-primary" }: { score: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/20"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", color)}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={cn("text-3xl font-bold tracking-tight font-heading", color)}>{score}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Score</span>
            </div>
        </div>
    );
}

export default function SimulationResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { caseId } = useParams();
    const session = location.state as SessionState | null;

    useEffect(() => {
        if (!session) {
            navigate('/simulations', { replace: true });
        }
    }, [session, navigate]);

    if (!session) return null;

    const { branchingCase, decisionsLog, totalCost, patientState, revealedInfo, startTime } = session;
    const score = calculateScore(session);
    const outcome = getOutcomeLabel(patientState);
    const OutcomeIcon = outcome.icon;
    const optimalDecisions = new Set(branchingCase.optimalPath.decisions);
    const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);

    // Analysis logic
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (totalCost <= branchingCase.optimalPath.totalCost * 1.2) strengths.push('Cost-efficient decision making');
    else improvements.push('Consider more cost-effective diagnostic approaches');

    const correctDecisions = decisionsLog.filter(d => optimalDecisions.has(d.decision.id));
    if (correctDecisions.length >= optimalDecisions.size * 0.7) strengths.push('Strong clinical reasoning');
    else improvements.push('Review evidence-based guidelines');

    if (revealedInfo.length >= branchingCase.stages.length) strengths.push('Thorough information gathering');
    else improvements.push('Gather more clinical data before treating');

    if (patientState.status === 'improving' || patientState.status === 'resolved') strengths.push('Achieved a positive patient outcome');

    const scoreColor = getScoreColor(score);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />

            <main className="flex-1 container py-6 max-w-7xl">
                {/* ── Top Bar ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <span>Simulation Complete</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="font-medium text-foreground">{branchingCase.title}</span>
                        </div>
                        <h1 className="text-2xl font-bold font-heading tracking-tight">Case Performance Review</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={cn("text-sm px-3 py-1 border gap-1.5", outcome.color)} variant="outline">
                            <OutcomeIcon className="h-4 w-4" />
                            {outcome.label}
                        </Badge>
                        <Badge variant="secondary" className="text-sm px-3 py-1 gap-1.5">
                            <Activity className="h-4 w-4 text-primary" />
                            {branchingCase.stages.length} Stages
                        </Badge>
                    </div>
                </div>

                {/* ── Dashboard Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">

                    {/* ── Left Column: Metrics (3/12) ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-3 space-y-4"
                    >
                        {/* Score Card */}
                        <Card className="glass-card shadow-sm overflow-hidden">
                            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
                                <CircularProgress score={score} color={scoreColor} />
                            </CardContent>
                        </Card>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="glass-card bg-card/50">
                                <CardContent className="p-3 text-center">
                                    <Target className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <div className="text-lg font-bold">{decisionsLog.length}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Decisions</div>
                                </CardContent>
                            </Card>
                            <Card className="glass-card bg-card/50">
                                <CardContent className="p-3 text-center">
                                    <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <div className="text-lg font-bold">${totalCost}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Cost</div>
                                </CardContent>
                            </Card>
                            <Card className="glass-card bg-card/50">
                                <CardContent className="p-3 text-center">
                                    <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <div className="text-lg font-bold">{elapsedMinutes}m</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</div>
                                </CardContent>
                            </Card>
                            <Card className="glass-card bg-card/50">
                                <CardContent className="p-3 text-center">
                                    <Stethoscope className="h-4 w-4 text-primary mx-auto mb-1" />
                                    <div className="text-lg font-bold">{session.revealedInfo.length}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Findings</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Breakdown */}
                        <Card className="glass-card">
                            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                <CardTitle className="text-sm font-medium">Performance Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-medium text-muted-foreground">Decisions</span>
                                        <span className="text-foreground font-mono">{correctDecisions.length}/{optimalDecisions.size} optimal</span>
                                    </div>
                                    <Progress value={(correctDecisions.length / Math.max(1, optimalDecisions.size)) * 100} className="h-1.5" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-medium text-muted-foreground">Cost Efficiency</span>
                                        <span className="text-foreground font-mono">${totalCost} / ${branchingCase.optimalPath.totalCost}</span>
                                    </div>
                                    <Progress value={(branchingCase.optimalPath.totalCost / Math.max(1, totalCost)) * 100} className="h-1.5" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-medium text-muted-foreground">Info Gathering</span>
                                        <span className="text-foreground font-mono">{revealedInfo.length} findings</span>
                                    </div>
                                    <Progress value={(revealedInfo.length / Math.max(1, branchingCase.stages.length * 2)) * 100} className="h-1.5" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>


                    {/* ── Center Column: Timeline (5/12) ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-5 h-[calc(100vh-140px)] min-h-[500px]"
                    >
                        <Card className="h-full flex flex-col glass-card border-primary/10 shadow-md">
                            <CardHeader className="py-3 px-5 border-b sticky top-0 bg-card/80 backdrop-blur-md z-10">
                                <CardTitle className="text-base font-heading flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-primary" />
                                    Your Decision Path
                                </CardTitle>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                <div className="relative pl-4">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-border/60" />

                                    <div className="space-y-6">
                                        {decisionsLog.map((entry, idx) => {
                                            const isOptimal = optimalDecisions.has(entry.decision.id);
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 + idx * 0.05 }}
                                                    className="relative pl-12"
                                                >
                                                    {/* Timeline Dot */}
                                                    <div className={cn(
                                                        "absolute left-[11px] top-3 w-[18px] h-[18px] rounded-full border-[3px] z-10 bg-background transition-colors",
                                                        isOptimal ? "border-emerald-500" : "border-amber-500"
                                                    )} />

                                                    {/* Content Card */}
                                                    <div className={cn(
                                                        "rounded-xl border p-3.5 transition-all text-left group hover:shadow-md",
                                                        isOptimal
                                                            ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                                                            : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                                                    )}>
                                                        <div className="flex justify-between items-start mb-1 gap-2">
                                                            <h4 className="font-semibold text-sm leading-tight text-foreground/90">
                                                                {entry.decision.label}
                                                            </h4>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] h-5 px-1.5 shrink-0 border-0",
                                                                isOptimal ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                            )}>
                                                                {isOptimal ? 'Optimal' : 'Suboptimal'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                                            {entry.decision.description}
                                                        </p>
                                                        <div className="flex gap-4 text-[10px] font-mono text-muted-foreground/80 border-t border-border/50 pt-2">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> {entry.decision.timeRequired}m
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <DollarSign className="h-3 w-3" /> ${entry.decision.cost}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>


                    {/* ── Right Column: Feedback (4/12) ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 flex flex-col gap-4 h-full"
                    >
                        {/* Strengths Card */}
                        <Card className="glass-card border-l-4 border-l-emerald-500">
                            <CardHeader className="py-3 px-4 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                                    <Zap className="h-4 w-4" /> Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-1">
                                <ul className="space-y-2">
                                    {strengths.map((s, i) => (
                                        <li key={i} className="text-xs flex gap-2 items-start text-muted-foreground">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                    {strengths.length === 0 && <li className="text-xs italic text-muted-foreground">Keep practicing to identify strengths!</li>}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Improvements Card */}
                        <Card className="glass-card border-l-4 border-l-amber-500">
                            <CardHeader className="py-3 px-4 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                                    <Lightbulb className="h-4 w-4" /> Areas to Improve
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-1">
                                <ul className="space-y-2">
                                    {improvements.map((s, i) => (
                                        <li key={i} className="text-xs flex gap-2 items-start text-muted-foreground">
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                    {improvements.length === 0 && <li className="text-xs italic text-muted-foreground">Great job! No major flags.</li>}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Learning Objectives - Flex Grow to fill space */}
                        <Card className="glass-card flex-1 flex flex-col min-h-[200px]">
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" /> Learning Objectives
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <ul className="space-y-3">
                                    {branchingCase.learningObjectives.map((obj, i) => (
                                        <li key={i} className="flex gap-2.5 items-start text-xs text-muted-foreground">
                                            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                            {obj}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                            <Button variant="outline" className="h-9 text-xs" onClick={() => navigate(`/simulation/${caseId}`)}>
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Try Again
                            </Button>
                            {session.sessionId && (
                                <Button variant="secondary" className="h-9 text-xs" onClick={() => navigate(`/analytics/session/${session.sessionId}`)}>
                                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Analytics
                                </Button>
                            )}
                            <Button className="col-span-2 h-10 text-sm bg-primary hover:bg-primary/90 shadow-md" onClick={() => navigate(`/simulation/${caseId}/reflection`, { state: { branchingCase, score, decisionsLog, strengths, improvements } })}>
                                Reflect on This Case <ChevronRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
