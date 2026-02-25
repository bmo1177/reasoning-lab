import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sampleErrorCases } from '@/data/sampleErrorCases';
import { ErrorCase, CognitiveBias } from '@/types/errorCase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Brain,
  Flag,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RefreshCcw,
  Info,
  Eye,
  EyeOff,
  Trophy,
  Stethoscope,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'scenario' | 'identify-biases' | 'red-flags' | 'missed-questions' | 'reconstruct' | 'reflect' | 'results';

const stepLabels: Record<Step, { label: string; icon: React.ElementType }> = {
  'scenario': { label: 'Scenario', icon: Stethoscope },
  'identify-biases': { label: 'Biases', icon: Brain },
  'red-flags': { label: 'Red Flags', icon: Flag },
  'missed-questions': { label: 'Questions', icon: HelpCircle },
  'reconstruct': { label: 'Reconstruct', icon: RefreshCcw },
  'reflect': { label: 'Reflect', icon: Lightbulb },
  'results': { label: 'Results', icon: Trophy },
};

const biasDescriptions: Record<string, string> = {
  'anchoring-bias': 'Over-relying on the first piece of information encountered when making decisions.',
  'availability-heuristic': 'Judging likelihood by how easily examples come to mind rather than actual frequency.',
  'confirmation-bias': 'Searching for or interpreting information that confirms pre-existing beliefs.',
  'premature-closure': 'Accepting a diagnosis before it is fully verified, stopping the diagnostic process early.',
  'diagnosis-momentum': 'Once a diagnostic label is attached, it gathers momentum and becomes increasingly difficult to change.',
  'gender-bias': 'Unconsciously treating patients differently or making assumptions based on gender.',
  'age-bias': 'Making diagnostic assumptions primarily based on the patient\'s age.',
  'overconfidence': 'Excessive belief in the accuracy of one\'s own clinical judgment.',
  'representativeness-heuristic': 'Judging probability based on how closely something resembles a typical case.',
  'base-rate-neglect': 'Ignoring the actual prevalence of a condition when estimating diagnostic probability.',
};

export default function DetectiveStudio() {
  const { caseId } = useParams<{ caseId: string }>();
  const [currentStep, setCurrentStep] = useState<Step>('scenario');

  // Student responses
  const [selectedBiases, setSelectedBiases] = useState<CognitiveBias[]>([]);
  const [identifiedRedFlags, setIdentifiedRedFlags] = useState<string[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(['', '', '']);
  const [reconstructedReasoning, setReconstructedReasoning] = useState('');
  const [reflection, setReflection] = useState('');
  const [avoidanceStrategies, setAvoidanceStrategies] = useState('');
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  // Get case
  const errorCase = useMemo((): ErrorCase | undefined => {
    const sample = sampleErrorCases.find(c => c.id === caseId);
    if (sample) return sample;
    try {
      const aiCases: ErrorCase[] = JSON.parse(sessionStorage.getItem('ai-error-cases') || '[]');
      return aiCases.find(c => c.id === caseId);
    } catch {
      return undefined;
    }
  }, [caseId]);

  const steps: Step[] = ['scenario', 'identify-biases', 'red-flags', 'missed-questions', 'reconstruct', 'reflect', 'results'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const allBiases: CognitiveBias[] = [
    'anchoring-bias',
    'availability-heuristic',
    'confirmation-bias',
    'premature-closure',
    'diagnosis-momentum',
    'gender-bias',
    'age-bias',
    'overconfidence',
    'representativeness-heuristic',
    'base-rate-neglect',
  ];

  const toggleBias = useCallback((bias: CognitiveBias) => {
    setSelectedBiases(prev =>
      prev.includes(bias) ? prev.filter(b => b !== bias) : [...prev, bias]
    );
  }, []);

  const toggleRedFlag = useCallback((flagId: string) => {
    setIdentifiedRedFlags(prev =>
      prev.includes(flagId) ? prev.filter(f => f !== flagId) : [...prev, flagId]
    );
  }, []);

  const toggleHint = useCallback((flagId: string) => {
    setShowHints(prev => ({ ...prev, [flagId]: !prev[flagId] }));
  }, []);

  // Calculate scores
  const scores = useMemo(() => {
    if (!errorCase) return { biasScore: 0, redFlagScore: 0, questionScore: 0, overall: 0 };

    const correctBiases = errorCase.analysis.cognitiveBiases;
    const matchedBiases = selectedBiases.filter(b => correctBiases.includes(b)).length;
    const biasScore = correctBiases.length > 0 ? (matchedBiases / correctBiases.length) * 100 : 0;

    const correctFlags = errorCase.analysis.missedRedFlags.length;
    const matchedFlags = identifiedRedFlags.length;
    const redFlagScore = correctFlags > 0 ? Math.min((matchedFlags / correctFlags) * 100, 100) : 0;

    const filledQuestions = suggestedQuestions.filter(q => q.trim().length > 0).length;
    const questionScore = Math.min((filledQuestions / 3) * 100, 100);

    const overall = (biasScore + redFlagScore + questionScore) / 3;

    return { biasScore, redFlagScore, questionScore, overall };
  }, [errorCase, selectedBiases, identifiedRedFlags, suggestedQuestions]);

  const getScoreMessage = (score: number) => {
    if (score >= 85) return { text: 'Excellent detective work! Your analytical skills are sharp.', color: 'text-emerald-600' };
    if (score >= 65) return { text: 'Good analysis! Keep practicing to sharpen your error-detection skills.', color: 'text-blue-600' };
    if (score >= 40) return { text: 'Decent start. Review the expert analysis below to strengthen your approach.', color: 'text-amber-600' };
    return { text: 'This was a tough case. Study the expert analysis carefully — each review builds your skills.', color: 'text-rose-600' };
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'important': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'minor': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return '';
    }
  };

  if (!errorCase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Case Not Found</CardTitle>
            <CardDescription>This error case doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/detective">Back to Detective Mode</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Circular score component
  const ScoreRing = ({ score, label, size = 80 }: { score: number; label: string; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius} stroke={scoreColor} strokeWidth="4" fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{Math.round(score)}%</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'scenario':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/0">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle>Clinical Error Scenario</CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">{errorCase.specialty.replace(/-/g, ' ')}</Badge>
                  <Badge variant="outline">{errorCase.scenario.patientAge}yo {errorCase.scenario.patientSex}</Badge>
                  <Badge className={cn('border', errorCase.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : errorCase.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20')}>
                    {errorCase.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    Patient Presentation
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{errorCase.scenario.presentation}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Initial Workup
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{errorCase.scenario.initialWorkup}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Clinician's Thinking
                  </h4>
                  <div className="p-3 rounded-lg bg-muted/50 border-l-2 border-muted-foreground/30">
                    <p className="text-muted-foreground italic">"{errorCase.scenario.clinicianThinking}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  The Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Initial Diagnosis</p>
                    <p className="font-semibold text-destructive">{errorCase.error.initialDiagnosis}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Correct Diagnosis</p>
                    <p className="font-semibold text-emerald-600">{errorCase.error.missedDiagnosis}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h4 className="font-medium mb-2">Outcome</h4>
                  <p className="text-muted-foreground leading-relaxed">{errorCase.error.outcome}</p>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Your mission:</strong> Analyze what went wrong and identify the cognitive biases,
                missed red flags, and questions that should have been asked. Then reconstruct the correct reasoning path.
              </p>
            </div>
          </motion.div>
        );

      case 'identify-biases':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Identify Cognitive Biases
                </CardTitle>
                <CardDescription>
                  Select all the cognitive biases you believe contributed to this error.
                  Hover over each bias name to learn what it means.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allBiases.map(bias => (
                    <Tooltip key={bias}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                            selectedBiases.includes(bias)
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                          )}
                          onClick={() => toggleBias(bias)}
                        >
                          <Checkbox checked={selectedBiases.includes(bias)} />
                          <div className="flex-1">
                            <span className="capitalize text-sm font-medium">{bias.replace(/-/g, ' ')}</span>
                          </div>
                          <Info className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{biasDescriptions[bias]}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-muted/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Selected: <strong className="text-foreground">{selectedBiases.length}</strong> bias{selectedBiases.length !== 1 ? 'es' : ''}
                  </span>
                  {selectedBiases.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedBiases([])}>
                      Clear all
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'red-flags':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-amber-600" />
                  Identify Missed Red Flags
                </CardTitle>
                <CardDescription>
                  Review the case and select the red flags that should have prompted further investigation.
                  Use the hint button if you need guidance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorCase.analysis.missedRedFlags.map(flag => (
                    <div
                      key={flag.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                        identifiedRedFlags.includes(flag.id)
                          ? 'border-amber-500/50 bg-amber-500/5 shadow-sm'
                          : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                      )}
                      onClick={() => toggleRedFlag(flag.id)}
                    >
                      <Checkbox checked={identifiedRedFlags.includes(flag.id)} className="mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{flag.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={cn("text-xs border capitalize", getSignificanceColor(flag.significance))}>
                            {flag.significance}
                          </Badge>
                          {flag.hint && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs gap-1"
                              onClick={(e) => { e.stopPropagation(); toggleHint(flag.id); }}
                            >
                              {showHints[flag.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {showHints[flag.id] ? 'Hide hint' : 'Show hint'}
                            </Button>
                          )}
                        </div>
                        {flag.hint && showHints[flag.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10"
                          >
                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                              {flag.hint}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'missed-questions':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  What Questions Should Have Been Asked?
                </CardTitle>
                <CardDescription>
                  List 3 critical questions the clinician should have asked to avoid this error.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2].map(index => (
                  <div key={index} className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </span>
                      Question {index + 1}
                    </label>
                    <Textarea
                      value={suggestedQuestions[index]}
                      onChange={(e) => {
                        const updated = [...suggestedQuestions];
                        updated[index] = e.target.value;
                        setSuggestedQuestions(updated);
                      }}
                      placeholder="What question would you have asked?"
                      className="min-h-[80px] rounded-xl"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'reconstruct':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5" />
                  Reconstruct the Correct Reasoning
                </CardTitle>
                <CardDescription>
                  Describe the correct diagnostic approach step by step. Think about the right order of evaluation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reconstructedReasoning}
                  onChange={(e) => setReconstructedReasoning(e.target.value)}
                  placeholder="1. First, I would consider...&#10;2. Then, I would order...&#10;3. Based on the results...&#10;4. My approach would be to..."
                  className="min-h-[220px] rounded-xl"
                />
                <div className="mt-3 p-3 rounded-xl bg-muted/50 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Think about: What should be ruled out first? What tests are critical? What's the proper sequence of evaluation?
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'reflect':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Reflection
                </CardTitle>
                <CardDescription>
                  Reflect on what you learned and how you'll prevent similar errors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Guided prompts from case data */}
                {errorCase.reflectionPrompts && errorCase.reflectionPrompts.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Guided reflection prompts
                    </p>
                    <ul className="space-y-1.5">
                      {errorCase.reflectionPrompts.map((prompt, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 font-medium shrink-0">{i + 1}.</span>
                          {prompt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">What did you learn from this case?</label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="This case taught me..."
                    className="mt-1.5 min-h-[120px] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">How will you avoid this type of error?</label>
                  <Textarea
                    value={avoidanceStrategies}
                    onChange={(e) => setAvoidanceStrategies(e.target.value)}
                    placeholder="In the future, I will..."
                    className="mt-1.5 min-h-[120px] rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'results':
        const scoreMessage = getScoreMessage(scores.overall);
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Score Summary */}
            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/5 via-primary/0 to-background">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Your Analysis Results</h3>
                </div>

                {/* Score rings */}
                <div className="flex justify-center gap-8 mb-6">
                  <ScoreRing score={scores.biasScore} label="Bias ID" size={90} />
                  <ScoreRing score={scores.redFlagScore} label="Red Flags" size={90} />
                  <ScoreRing score={scores.questionScore} label="Questions" size={90} />
                </div>

                {/* Overall score */}
                <div className="flex flex-col items-center">
                  <ScoreRing score={scores.overall} label="Overall Score" size={110} />
                  <p className={cn("text-sm font-medium mt-3 text-center max-w-md", scoreMessage.color)}>
                    {scoreMessage.text}
                  </p>
                </div>
              </div>
            </Card>

            {/* Expert Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Expert Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Cognitive Biases Present
                  </h4>
                  <div className="space-y-3">
                    {errorCase.analysis.cognitiveBiases.map(bias => (
                      <div key={bias} className={cn(
                        "flex items-start gap-3 p-3 rounded-xl",
                        selectedBiases.includes(bias) ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/20'
                      )}>
                        {selectedBiases.includes(bias) ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="font-medium capitalize text-sm">{bias.replace(/-/g, ' ')}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {errorCase.analysis.biasExplanations[bias]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Questions That Should Have Been Asked
                  </h4>
                  <div className="space-y-3">
                    {errorCase.analysis.missedQuestions.map(q => (
                      <div key={q.id} className="p-3 rounded-xl bg-muted/50 border">
                        <p className="font-medium text-sm">{q.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{q.importance}</p>
                        {q.expectedAnswer && (
                          <p className="text-sm text-emerald-600 mt-1 flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            Expected: {q.expectedAnswer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Correct Approach</h4>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                      {errorCase.correctApproach.reasoningPath}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/detective">Back to Detective Mode</Link>
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/detective">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">{errorCase.title}</h1>
              <p className="text-sm text-muted-foreground">
                {errorCase.scenario.patientAge}yo {errorCase.scenario.patientSex}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">{currentStep.replace(/-/g, ' ')}</Badge>
        </div>
        <div className="container pb-3">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Step Indicator */}
      <div className="container max-w-3xl pt-6">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = stepLabels[step].icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all",
                    index <= currentStepIndex ? 'cursor-pointer' : 'cursor-default opacity-40'
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2",
                    isActive ? 'bg-primary text-primary-foreground border-primary scale-110' :
                      isCompleted ? 'bg-emerald-500 text-white border-emerald-500' :
                        'bg-muted border-muted-foreground/20 text-muted-foreground'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium hidden sm:block",
                    isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                  )}>
                    {stepLabels[step].label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-6 sm:w-10 h-0.5 mx-1",
                    index < currentStepIndex ? 'bg-emerald-500' : 'bg-muted'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-4 max-w-3xl">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'results' && (
          <div className="flex justify-between mt-8 pb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(steps[currentStepIndex - 1])}
              disabled={currentStepIndex === 0}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(steps[currentStepIndex + 1])}
              className="rounded-full"
            >
              {currentStepIndex === steps.length - 2 ? 'View Results' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
