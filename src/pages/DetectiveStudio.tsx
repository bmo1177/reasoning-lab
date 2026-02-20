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
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';

type Step = 'scenario' | 'identify-biases' | 'red-flags' | 'missed-questions' | 'reconstruct' | 'reflect' | 'results';

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

  // Get case - check sessionStorage for AI-generated cases
  const errorCase = useMemo((): ErrorCase | undefined => {
    // First check sample cases
    const sample = sampleErrorCases.find(c => c.id === caseId);
    if (sample) return sample;
    
    // Check session storage for AI-generated
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
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle>Clinical Error Scenario</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Patient Presentation</h4>
                  <p className="text-muted-foreground">{errorCase.scenario.presentation}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Initial Workup</h4>
                  <p className="text-muted-foreground">{errorCase.scenario.initialWorkup}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Clinician's Thinking</h4>
                  <p className="text-muted-foreground italic">"{errorCase.scenario.clinicianThinking}"</p>
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
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Initial Diagnosis</p>
                    <p className="font-medium text-destructive">{errorCase.error.initialDiagnosis}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground">Correct Diagnosis</p>
                    <p className="font-medium text-success">{errorCase.error.missedDiagnosis}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Outcome</h4>
                  <p className="text-muted-foreground">{errorCase.error.outcome}</p>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Your task: Analyze what went wrong and identify the cognitive biases, missed red flags, 
              and questions that should have been asked.
            </p>
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allBiases.map(bias => (
                    <div
                      key={bias}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBiases.includes(bias)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleBias(bias)}
                    >
                      <Checkbox checked={selectedBiases.includes(bias)} />
                      <span className="capitalize">{bias.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Selected: {selectedBiases.length} bias{selectedBiases.length !== 1 ? 'es' : ''}
                </p>
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
                  <Flag className="h-5 w-5 text-warning" />
                  Identify Missed Red Flags
                </CardTitle>
                <CardDescription>
                  Review the case and select the red flags that should have prompted further investigation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorCase.analysis.missedRedFlags.map(flag => (
                    <div
                      key={flag.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        identifiedRedFlags.includes(flag.id)
                          ? 'border-warning bg-warning/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleRedFlag(flag.id)}
                    >
                      <Checkbox checked={identifiedRedFlags.includes(flag.id)} className="mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{flag.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {flag.significance}
                        </Badge>
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
                  List 3 critical questions the clinician should have asked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2].map(index => (
                  <div key={index}>
                    <label className="text-sm font-medium">Question {index + 1}</label>
                    <Textarea
                      value={suggestedQuestions[index]}
                      onChange={(e) => {
                        const updated = [...suggestedQuestions];
                        updated[index] = e.target.value;
                        setSuggestedQuestions(updated);
                      }}
                      placeholder="What question would you have asked?"
                      className="mt-1"
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
                  Describe the correct diagnostic approach step by step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reconstructedReasoning}
                  onChange={(e) => setReconstructedReasoning(e.target.value)}
                  placeholder="1. First, I would consider...&#10;2. Then, I would order...&#10;3. Based on the results..."
                  className="min-h-[200px]"
                />
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
                  <Lightbulb className="h-5 w-5" />
                  Reflection
                </CardTitle>
                <CardDescription>
                  Reflect on what you learned and how you'll prevent similar errors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What did you learn from this case?</label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="This case taught me..."
                    className="mt-1 min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">How will you avoid this type of error?</label>
                  <Textarea
                    value={avoidanceStrategies}
                    onChange={(e) => setAvoidanceStrategies(e.target.value)}
                    placeholder="In the future, I will..."
                    className="mt-1 min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'results':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Score Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Your Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{Math.round(scores.biasScore)}%</p>
                    <p className="text-sm text-muted-foreground">Bias Identification</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{Math.round(scores.redFlagScore)}%</p>
                    <p className="text-sm text-muted-foreground">Red Flags Found</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{Math.round(scores.questionScore)}%</p>
                    <p className="text-sm text-muted-foreground">Questions Suggested</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-3xl font-bold text-primary">{Math.round(scores.overall)}%</p>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
              </CardContent>
            </Card>

            {/* Correct Answers */}
            <Card>
              <CardHeader>
                <CardTitle>Expert Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Cognitive Biases Present
                  </h4>
                  <div className="space-y-2">
                    {errorCase.analysis.cognitiveBiases.map(bias => (
                      <div key={bias} className="flex items-start gap-2">
                        {selectedBiases.includes(bias) ? (
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium capitalize">{bias.replace(/-/g, ' ')}</span>
                          <p className="text-sm text-muted-foreground">
                            {errorCase.analysis.biasExplanations[bias]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Questions That Should Have Been Asked
                  </h4>
                  <div className="space-y-2">
                    {errorCase.analysis.missedQuestions.map(q => (
                      <div key={q.id} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{q.importance}</p>
                        {q.expectedAnswer && (
                          <p className="text-sm text-success mt-1">
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
                  <p className="text-muted-foreground whitespace-pre-line">
                    {errorCase.correctApproach.reasoningPath}
                  </p>
                </div>
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

      {/* Main Content */}
      <main className="container py-8 max-w-3xl">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'results' && (
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
              {currentStepIndex === steps.length - 2 ? 'View Results' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
