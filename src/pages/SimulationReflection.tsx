import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
    Lightbulb,
    Brain,
    Target,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Send,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BranchingCase, SimulationDecision } from '@/types/simulation';

interface ReflectionState {
    branchingCase: BranchingCase;
    score: number;
    decisionsLog: Array<{ decision: SimulationDecision; timestamp: number }>;
    strengths: string[];
    improvements: string[];
}

const reflectionSteps = [
    {
        id: 'whatLearned',
        icon: Lightbulb,
        title: 'What did you learn?',
        description: 'Reflect on the key clinical concepts or skills you gained from this case.',
        placeholder: 'In this case, I learned that...',
    },
    {
        id: 'whatWouldChange',
        icon: Brain,
        title: 'What would you do differently?',
        description: 'Thinking back, how would you change your approach if you encountered this patient again?',
        placeholder: 'If I could redo this case, I would...',
    },
    {
        id: 'strongestArea',
        icon: Target,
        title: 'What was your strongest decision?',
        description: 'Identify the decision you feel most confident about and explain why.',
        placeholder: 'My strongest moment was when I decided to...',
    },
    {
        id: 'areaToImprove',
        icon: MessageSquare,
        title: 'What needs more practice?',
        description: 'What specific skill or knowledge area would you like to strengthen?',
        placeholder: 'I want to improve my understanding of...',
    },
];

export default function SimulationReflection() {
    const location = useLocation();
    const navigate = useNavigate();
    const { caseId } = useParams();
    const reflectionData = location.state as ReflectionState | null;

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({
        whatLearned: '',
        whatWouldChange: '',
        strongestArea: '',
        areaToImprove: '',
    });
    const [confidence, setConfidence] = useState(5);

    // Redirect if accessed directly without state
    useEffect(() => {
        if (!reflectionData) {
            navigate('/simulations', { replace: true });
        }
    }, [reflectionData, navigate]);

    if (!reflectionData) return null;

    const { branchingCase, score } = reflectionData;
    const step = reflectionSteps[currentStep];
    const StepIcon = step?.icon;
    const isLastStep = currentStep === reflectionSteps.length - 1;
    const isConfidenceStep = currentStep === reflectionSteps.length; // Virtual step after last question
    const totalSteps = reflectionSteps.length + 1; // +1 for confidence
    const displayStep = Math.min(currentStep, reflectionSteps.length);

    const handleNext = () => {
        if (currentStep < reflectionSteps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        // Save to localStorage for analytics
        const reflectionEntry = {
            caseId,
            caseTitle: branchingCase.title,
            score,
            answers,
            confidence,
            submittedAt: new Date().toISOString(),
        };

        try {
            const existingReflections = JSON.parse(localStorage.getItem('think-studio-reflections') || '[]');
            existingReflections.push(reflectionEntry);
            localStorage.setItem('think-studio-reflections', JSON.stringify(existingReflections));
        } catch {
            // Silent fail for localStorage
        }

        toast.success('Reflection saved! Great metacognitive practice.');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container py-8 max-w-2xl">
                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-2xl font-heading font-bold mb-1">Reflection Time</h1>
                    <p className="text-muted-foreground text-sm">{branchingCase.title}</p>
                </motion.div>

                {/* ── Progress Steps ── */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                i <= displayStep ? 'bg-primary' : 'bg-muted',
                                i === displayStep ? 'w-8' : 'w-2'
                            )}
                        />
                    ))}
                </div>

                {/* ── Question or Confidence ── */}
                <AnimatePresence mode="wait">
                    {!isConfidenceStep ? (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Card className="glass-card mb-6">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 rounded-xl bg-primary/10">
                                            <StepIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-heading font-semibold">{step.title}</h2>
                                            <p className="text-sm text-muted-foreground">{step.description}</p>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={answers[step.id] || ''}
                                        onChange={(e) =>
                                            setAnswers(prev => ({ ...prev, [step.id]: e.target.value }))
                                        }
                                        placeholder={step.placeholder}
                                        className="min-h-[150px] resize-none bg-background/50 border-border/50 focus:border-primary/40"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-right">
                                        {(answers[step.id] || '').length} characters
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confidence"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Card className="glass-card mb-6">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-primary/10">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-heading font-semibold">How confident are you?</h2>
                                            <p className="text-sm text-muted-foreground">Rate your confidence in managing this type of case</p>
                                        </div>
                                    </div>

                                    <div className="px-4">
                                        <Slider
                                            value={[confidence]}
                                            onValueChange={([val]) => setConfidence(val)}
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="mb-4"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Not confident</span>
                                            <span className="text-2xl font-bold text-primary font-heading">{confidence}</span>
                                            <span>Very confident</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Navigation Buttons ── */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex-1"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>

                    {isConfidenceStep ? (
                        <Button
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={handleSubmit}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Reflection
                        </Button>
                    ) : (
                        <Button
                            className="flex-1"
                            onClick={handleNext}
                        >
                            {isLastStep ? 'Confidence Rating' : 'Next'}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>

                {/* ── Skip link ── */}
                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                    >
                        Skip reflection and go to dashboard
                    </button>
                </div>
            </main>
        </div>
    );
}
