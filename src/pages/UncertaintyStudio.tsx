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
} from 'lucide-react';

type Step = 'presentation' | 'initial-rating' | 'testing' | 'update-rating' | 'reveal' | 'calibration';

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
    
    // Initialize updated ratings
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
                  <Scale className="h-5 w-5" />
                  Diagnostic Uncertainty Case
                </CardTitle>
                <CardDescription>
                  Carefully assess this ambiguous presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {uncertaintyCase.presentation.age}yo {uncertaintyCase.presentation.sex}
                  </p>
                  <p className="font-medium mt-1">{uncertaintyCase.presentation.chiefComplaint}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">History</h4>
                  <p className="text-muted-foreground">{uncertaintyCase.presentation.limitedHistory}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Physical Examination</h4>
                  <p className="text-muted-foreground">{uncertaintyCase.presentation.limitedExam}</p>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Notice: The information is deliberately limited. You must work with uncertainty.
              </p>
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
                <CardTitle>Rate Your Confidence</CardTitle>
                <CardDescription>
                  For each differential diagnosis, indicate your confidence level (0-100%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uncertaintyCase.differentials.map(diff => (
                  <div key={diff.id} className="space-y-3 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{diff.name}</span>
                      <Badge variant="outline">
                        {confidenceRatings[diff.id]?.confidencePercent || 50}%
                      </Badge>
                    </div>
                    <Slider
                      value={[confidenceRatings[diff.id]?.confidencePercent || 50]}
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
                      className="mt-2"
                    />

                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground mr-2">Supporting:</span>
                      {diff.keyFeatures.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Against:</span>
                      {diff.againstFeatures.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
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
                  <FlaskConical className="h-5 w-5" />
                  Order Diagnostic Tests
                </CardTitle>
                <CardDescription>
                  Select tests to gather more information. Results will update your probabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uncertaintyCase.availableTests.map(test => {
                  const isOrdered = orderedTests.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isOrdered ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{test.name}</p>
                          {isOrdered && (
                            <p className="mt-2 text-sm bg-muted p-2 rounded">
                              Result: {test.result}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={isOrdered ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => orderTest(test.id)}
                          disabled={isOrdered}
                        >
                          {isOrdered ? 'Ordered' : 'Order Test'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {orderedTests.length > 0 && (
              <div className="p-4 rounded-lg bg-info/10 border border-info/30">
                <p className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  You've ordered {orderedTests.length} test(s). Now update your confidence ratings.
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
                  <TrendingUp className="h-5 w-5" />
                  Update Your Probabilities
                </CardTitle>
                <CardDescription>
                  Based on your test results, update your confidence for each diagnosis (Bayesian reasoning)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uncertaintyCase.differentials.map(diff => {
                  const initialConf = confidenceRatings[diff.id]?.confidencePercent || 50;
                  const currentConf = updatedRatings[diff.id] || 50;
                  const change = currentConf - initialConf;

                  return (
                    <div key={diff.id} className="space-y-3 p-4 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{diff.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            {initialConf}%
                          </span>
                          <span>→</span>
                          <Badge variant={change > 0 ? 'default' : change < 0 ? 'secondary' : 'outline'}>
                            {currentConf}%
                            {change !== 0 && (
                              <span className="ml-1">
                                ({change > 0 ? '+' : ''}{change})
                              </span>
                            )}
                          </Badge>
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
                          <><TrendingUp className="h-3 w-3 text-success" /> Increased</>
                        ) : change < 0 ? (
                          <><TrendingDown className="h-3 w-3 text-destructive" /> Decreased</>
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
            <Card className="border-success/50 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Diagnosis Revealed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{uncertaintyCase.actualDiagnosis}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {uncertaintyCase.teachingPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
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
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        isCorrect ? 'bg-success/10 border border-success/30' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-success" />}
                        <span className={isCorrect ? 'font-medium' : ''}>{diff.name}</span>
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
                  Calibration Analysis
                </CardTitle>
                <CardDescription>
                  How well did your confidence match reality?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {calibrationMetrics && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">Initial Confidence (Correct Dx)</p>
                        <p className="text-2xl font-bold">{calibrationMetrics.initialCorrectConfidence}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">Final Confidence (Correct Dx)</p>
                        <p className="text-2xl font-bold text-primary">{calibrationMetrics.finalCorrectConfidence}%</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm text-muted-foreground">Improvement</p>
                      <p className={`text-2xl font-bold ${calibrationMetrics.improvement >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {calibrationMetrics.improvement >= 0 ? '+' : ''}{calibrationMetrics.improvement}%
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Calibration Feedback</h4>
                      
                      {calibrationMetrics.wasOverconfident && (
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                          <p className="text-sm">
                            <strong>Overconfidence detected:</strong> You assigned high confidence to diagnoses 
                            that weren't correct. Practice being more calibrated in your uncertainty.
                          </p>
                        </div>
                      )}

                      {calibrationMetrics.wasUnderconfident && (
                        <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                          <p className="text-sm">
                            <strong>Underconfidence detected:</strong> You didn't assign enough confidence to 
                            the correct diagnosis. Trust the evidence that supports your reasoning.
                          </p>
                        </div>
                      )}

                      {!calibrationMetrics.wasOverconfident && !calibrationMetrics.wasUnderconfident && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                          <p className="text-sm">
                            <strong>Good calibration!</strong> Your confidence levels appropriately 
                            reflected the probability of each diagnosis.
                          </p>
                        </div>
                      )}

                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-medium">Brier Score: {calibrationMetrics.brierScore.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lower is better (0 = perfect calibration, 1 = worst possible)
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link to="/detective">Back to Detective Mode</Link>
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
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

      {/* Main Content */}
      <main className="container py-8 max-w-3xl">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'calibration' && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(steps[currentStepIndex - 1])}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(steps[currentStepIndex + 1])}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
