import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sampleUncertaintyCases } from '@/data/sampleErrorCases';
import { UncertaintyCase, DiagnosticConfidence } from '@/types/errorCase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Scale,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Stethoscope,
  Brain,
  Info,
  Trophy,
  Target,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'presentation' | 'initial-rating' | 'testing' | 'update-rating' | 'reveal' | 'calibration';

const stepLabels: Record<Step, { label: string; icon: React.ElementType }> = {
  'presentation': { label: 'Case', icon: Stethoscope },
  'initial-rating': { label: 'Rate', icon: Scale },
  'testing': { label: 'Test', icon: FlaskConical },
  'update-rating': { label: 'Update', icon: TrendingUp },
  'reveal': { label: 'Reveal', icon: CheckCircle2 },
  'calibration': { label: 'Score', icon: Trophy },
};

export default function UncertaintyStudio() {
  const { caseId } = useParams<{ caseId: string }>();
  const [currentStep, setCurrentStep] = useState<Step>('presentation');

  // Student data
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, DiagnosticConfidence>>({});
  const [orderedTests, setOrderedTests] = useState<string[]>([]);
  const [uncertaintyReasons, setUncertaintyReasons] = useState<Record<string, string>>({});
  const [updatedRatings, setUpdatedRatings] = useState<Record<string, number>>({});

  const uncertaintyCase = useMemo((): UncertaintyCase | undefined => {
    return sampleUncertaintyCases.find(c => c.id === caseId);
  }, [caseId]);

  const steps: Step[] = ['presentation', 'initial-rating', 'testing', 'update-rating', 'reveal', 'calibration'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Initialize ratings
  const initializeRatings = useCallback(() => {
    if (!uncertaintyCase) return;
    const initial: Record<string, DiagnosticConfidence> = {};
    uncertaintyCase.differentials.forEach(diff => {
      initial[diff.id] = {
        diagnosisId: diff.id,
        diagnosisName: diff.name,
        confidencePercent: 50,
        reasoning: '',
        uncertaintyFactors: [],
        informationNeeded: [],
      };
    });
    setConfidenceRatings(initial);

    const updated: Record<string, number> = {};
    uncertaintyCase.differentials.forEach(diff => {
      updated[diff.id] = 50;
    });
    setUpdatedRatings(updated);
  }, [uncertaintyCase]);

  // Run on first render
  useState(() => {
    initializeRatings();
  });

  const updateConfidence = (diagId: string, value: number) => {
    setConfidenceRatings(prev => ({
      ...prev,
      [diagId]: { ...prev[diagId], confidencePercent: value },
    }));
  };

  const updateReasoning = (diagId: string, reasoning: string) => {
    setUncertaintyReasons(prev => ({ ...prev, [diagId]: reasoning }));
  };

  const orderTest = (testId: string) => {
    if (!orderedTests.includes(testId)) {
      setOrderedTests(prev => [...prev, testId]);
    }
  };

  // Confidence bar color helper
  const getConfidenceColor = (value: number) => {
    if (value >= 70) return 'bg-emerald-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getConfidenceTextColor = (value: number) => {
    if (value >= 70) return 'text-emerald-600';
    if (value >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Calculate calibration metrics
  const calibrationMetrics = useMemo(() => {
    if (!uncertaintyCase) return null;

    const correctDiagId = uncertaintyCase.differentials.find(
      d => d.name === uncertaintyCase.actualDiagnosis
    )?.id;

    const initialCorrectConfidence = confidenceRatings[correctDiagId || '']?.confidencePercent || 0;
    const finalCorrectConfidence = updatedRatings[correctDiagId || ''] || 0;

    // Calculate Brier score (simplified)
    let brierScore = 0;
    uncertaintyCase.differentials.forEach(diff => {
      const predicted = (updatedRatings[diff.id] || 0) / 100;
      const actual = diff.name === uncertaintyCase.actualDiagnosis ? 1 : 0;
      brierScore += Math.pow(predicted - actual, 2);
    });
    brierScore /= uncertaintyCase.differentials.length;

    const wasOverconfident = uncertaintyCase.differentials.some(diff => {
      const conf = updatedRatings[diff.id] || 0;
      const actual = diff.name === uncertaintyCase.actualDiagnosis;
      return !actual && conf > 70;
    });

    const wasUnderconfident = finalCorrectConfidence < 60;

    return {
      initialCorrectConfidence,
      finalCorrectConfidence,
      brierScore,
      wasOverconfident,
      wasUnderconfident,
      improvement: finalCorrectConfidence - initialCorrectConfidence,
    };
  }, [uncertaintyCase, confidenceRatings, updatedRatings]);

  // Score ring component
  const ScoreRing = ({ score, label, size = 80, maxVal = 100 }: { score: number; label: string; size?: number; maxVal?: number }) => {
    const percentage = (score / maxVal) * 100;
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const scoreColor = percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#f59e0b' : '#ef4444';
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

  if (!uncertaintyCase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Case Not Found</CardTitle>
            <CardDescription>This uncertainty case doesn't exist.</CardDescription>
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

  const renderStep = () => {
    switch (currentStep) {
      case 'presentation':
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
                  <Scale className="h-5 w-5 text-violet-600" />
                  Diagnostic Uncertainty Case
                </CardTitle>
                <CardDescription>
                  Carefully assess this ambiguous presentation
                </CardDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="capitalize">
                    {uncertaintyCase.specialty.replace(/-/g, ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {uncertaintyCase.presentation.age}yo {uncertaintyCase.presentation.sex}
                  </Badge>
                  <Badge className={cn('border',
                    uncertaintyCase.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      uncertaintyCase.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  )}>
                    {uncertaintyCase.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chief Complaint</p>
                  <p className="font-semibold">{uncertaintyCase.presentation.chiefComplaint}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    History
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{uncertaintyCase.presentation.limitedHistory}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Physical Examination
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{uncertaintyCase.presentation.limitedExam}</p>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Notice: Limited Information</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  The information is deliberately limited. You must work with uncertainty — just like real clinical practice.
                  Assess the case, then rate your confidence for each possible diagnosis.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 'initial-rating':
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
                  <Scale className="h-5 w-5" />
                  Rate Your Confidence
                </CardTitle>
                <CardDescription>
                  For each differential diagnosis, indicate your confidence level (0-100%).
                  Consider the supporting and conflicting evidence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uncertaintyCase.differentials.map(diff => {
                  const confValue = confidenceRatings[diff.id]?.confidencePercent || 50;
                  return (
                    <div key={diff.id} className="space-y-3 p-4 rounded-xl border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{diff.name}</span>
                        <Badge className={cn("border", getConfidenceTextColor(confValue),
                          confValue >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' :
                            confValue >= 40 ? 'bg-amber-500/10 border-amber-500/20' :
                              'bg-rose-500/10 border-rose-500/20'
                        )}>
                          {confValue}%
                        </Badge>
                      </div>

                      {/* Confidence bar */}
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", getConfidenceColor(confValue))}
                          initial={{ width: '50%' }}
                          animate={{ width: `${confValue}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      <Slider
                        value={[confValue]}
                        onValueChange={([val]) => updateConfidence(diff.id, val)}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Very unlikely</span>
                        <span>Very likely</span>
                      </div>

                      <Textarea
                        placeholder="Why this confidence level? What makes you uncertain?"
                        value={uncertaintyReasons[diff.id] || ''}
                        onChange={(e) => updateReasoning(diff.id, e.target.value)}
                        className="mt-1 rounded-xl min-h-[60px]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-xs text-emerald-600 font-medium">Supporting</span>
                          <div className="flex flex-wrap gap-1">
                            {diff.keyFeatures.map((f, i) => (
                              <Badge key={i} className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-rose-600 font-medium">Against</span>
                          <div className="flex flex-wrap gap-1">
                            {diff.againstFeatures.map((f, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-rose-600 border-rose-500/20">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'testing':
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
                  <FlaskConical className="h-5 w-5 text-violet-600" />
                  Order Diagnostic Tests
                </CardTitle>
                <CardDescription>
                  Select tests to gather more information. Results will help you refine your probabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uncertaintyCase.availableTests.map(test => {
                  const isOrdered = orderedTests.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        isOrdered ? 'border-violet-500/50 bg-violet-500/5 shadow-sm' : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{test.name}</p>
                          {isOrdered && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 space-y-3"
                            >
                              <div className="p-3 rounded-lg bg-muted/80 border">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Result</p>
                                <p className="text-sm font-medium">{test.result}</p>
                              </div>

                              {/* Impact summary */}
                              <div className="space-y-1.5">
                                <p className="text-xs text-muted-foreground font-medium">Impact on differentials:</p>
                                {Object.entries(test.impactOnDifferentials).map(([dxId, impact]) => {
                                  const dxName = uncertaintyCase.differentials.find(d => d.id === dxId)?.name || dxId;
                                  const change = impact.posteriorProbability - impact.priorProbability;
                                  return (
                                    <div key={dxId} className="flex items-center gap-2 text-xs">
                                      {change > 0 ? (
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3 text-rose-500" />
                                      )}
                                      <span className="text-muted-foreground">{dxName}:</span>
                                      <span className={cn("font-medium", change > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                        {change > 0 ? '+' : ''}{change}%
                                      </span>
                                      <span className="text-muted-foreground/60">
                                        (LR: {impact.likelihoodRatio.toFixed(1)})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <Button
                          variant={isOrdered ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => orderTest(test.id)}
                          disabled={isOrdered}
                          className="shrink-0"
                        >
                          {isOrdered ? '✓ Ordered' : 'Order Test'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {orderedTests.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  You've ordered <strong className="text-foreground">{orderedTests.length}</strong> test(s).
                  Review the results and impact summaries, then update your probability ratings on the next step.
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'update-rating':
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
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  Update Your Probabilities
                </CardTitle>
                <CardDescription>
                  Based on your test results, update your confidence for each diagnosis (Bayesian reasoning).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uncertaintyCase.differentials.map(diff => {
                  const initialConf = confidenceRatings[diff.id]?.confidencePercent || 50;
                  const currentConf = updatedRatings[diff.id] || 50;
                  const change = currentConf - initialConf;

                  return (
                    <div key={diff.id} className="space-y-3 p-4 rounded-xl border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{diff.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">{initialConf}%</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge className={cn("border",
                            change > 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              change < 0 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                'bg-muted text-muted-foreground border-muted-foreground/20'
                          )}>
                            {currentConf}%
                            {change !== 0 && (
                              <span className="ml-1">({change > 0 ? '+' : ''}{change})</span>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Before/After comparison bar */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Before</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${initialConf}%` }} />
                          </div>
                          <span className="w-8 text-right">{initialConf}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">After</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", getConfidenceColor(currentConf))}
                              animate={{ width: `${currentConf}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className={cn("w-8 text-right font-medium", getConfidenceTextColor(currentConf))}>{currentConf}%</span>
                        </div>
                      </div>

                      <Slider
                        value={[currentConf]}
                        onValueChange={([val]) => setUpdatedRatings(prev => ({ ...prev, [diff.id]: val }))}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {change > 0 ? (
                          <><TrendingUp className="h-3 w-3 text-emerald-500" /> Increased</>
                        ) : change < 0 ? (
                          <><TrendingDown className="h-3 w-3 text-rose-500" /> Decreased</>
                        ) : (
                          'No change'
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'reveal':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="border-emerald-500/50 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Diagnosis Revealed</h3>
                </div>
                <motion.p
                  className="text-2xl font-bold text-emerald-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {uncertaintyCase.actualDiagnosis}
                </motion.p>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Teaching Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {uncertaintyCase.teachingPoints.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
                    >
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Final Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {uncertaintyCase.differentials.map(diff => {
                  const isCorrect = diff.name === uncertaintyCase.actualDiagnosis;
                  const rating = updatedRatings[diff.id] || 50;

                  return (
                    <div
                      key={diff.id}
                      className={cn(
                        "flex justify-between items-center p-3 rounded-xl transition-all",
                        isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/50 border border-muted-foreground/10'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        <span className={isCorrect ? 'font-medium' : 'text-muted-foreground'}>{diff.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm">Your rating:</span>
                        <Badge variant={isCorrect ? 'default' : 'outline'}>{rating}%</Badge>
                        {isCorrect && (
                          <span className="text-sm text-muted-foreground">
                            (True: {diff.truePreTestProbability}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'calibration':
        const brierColor = calibrationMetrics
          ? calibrationMetrics.brierScore < 0.15 ? 'text-emerald-600' : calibrationMetrics.brierScore < 0.35 ? 'text-amber-600' : 'text-rose-600'
          : '';
        const brierBg = calibrationMetrics
          ? calibrationMetrics.brierScore < 0.15 ? 'bg-emerald-500/10 border-emerald-500/20' : calibrationMetrics.brierScore < 0.35 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'
          : '';
        const brierLabel = calibrationMetrics
          ? calibrationMetrics.brierScore < 0.15 ? 'Excellent' : calibrationMetrics.brierScore < 0.35 ? 'Moderate' : 'Needs Practice'
          : '';

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-violet-500/5 via-violet-500/0 to-background">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                  <h3 className="text-lg font-semibold">Calibration Analysis</h3>
                </div>

                {calibrationMetrics && (
                  <>
                    {/* Score rings */}
                    <div className="flex justify-center gap-8 mb-6">
                      <ScoreRing score={calibrationMetrics.initialCorrectConfidence} label="Initial Confidence" size={90} />
                      <ScoreRing score={calibrationMetrics.finalCorrectConfidence} label="Final Confidence" size={90} />
                    </div>

                    {/* Improvement */}
                    <div className="flex justify-center mb-6">
                      <div className={cn(
                        "px-6 py-3 rounded-xl text-center border",
                        calibrationMetrics.improvement >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                      )}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Improvement</p>
                        <p className={cn("text-2xl font-bold", calibrationMetrics.improvement >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          {calibrationMetrics.improvement >= 0 ? '+' : ''}{calibrationMetrics.improvement}%
                        </p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="font-medium">Calibration Feedback</h4>

                      {calibrationMetrics.wasOverconfident && (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-700">Overconfidence Detected</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              You assigned high confidence to diagnoses that weren't correct.
                              Practice being more calibrated in your uncertainty.
                            </p>
                          </div>
                        </div>
                      )}

                      {calibrationMetrics.wasUnderconfident && (
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-700">Underconfidence Detected</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              You didn't assign enough confidence to the correct diagnosis.
                              Trust the evidence that supports your reasoning.
                            </p>
                          </div>
                        </div>
                      )}

                      {!calibrationMetrics.wasOverconfident && !calibrationMetrics.wasUnderconfident && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-emerald-700">Good Calibration!</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Your confidence levels appropriately reflected the probability of each diagnosis.
                              This is a critical clinical skill — well done!
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Brier Score card */}
                      <div className={cn("p-4 rounded-xl border", brierBg)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Brier Score</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Lower is better (0 = perfect calibration, 1 = worst)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-2xl font-bold", brierColor)}>
                              {calibrationMetrics.brierScore.toFixed(3)}
                            </p>
                            <Badge className={cn("text-xs border mt-1", brierBg, brierColor)}>
                              {brierLabel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
              <h1 className="font-semibold">{uncertaintyCase.title}</h1>
              <p className="text-sm text-muted-foreground">
                Uncertainty Training
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
                    isActive ? 'bg-violet-600 text-white border-violet-600 scale-110' :
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
                    isActive ? 'text-violet-600' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                  )}>
                    {stepLabels[step].label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-6 sm:w-12 h-0.5 mx-1",
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
        {currentStep !== 'calibration' && (
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
              {currentStepIndex === steps.length - 2 ? 'View Calibration' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
