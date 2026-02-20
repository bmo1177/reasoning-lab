// Error-Based Learning and Diagnostic Uncertainty types

export type CognitiveBias = 
  | 'anchoring-bias'
  | 'availability-heuristic'
  | 'confirmation-bias'
  | 'premature-closure'
  | 'diagnosis-momentum'
  | 'gender-bias'
  | 'age-bias'
  | 'overconfidence'
  | 'representativeness-heuristic'
  | 'base-rate-neglect';

export interface FlawedReasoning {
  nodeId: string;
  description: string;
  whatWentWrong: string;
  correctApproach: string;
}

export interface MissedRedFlag {
  id: string;
  description: string;
  significance: 'critical' | 'important' | 'minor';
  hint?: string;
}

export interface MissedQuestion {
  id: string;
  question: string;
  importance: string;
  expectedAnswer?: string;
}

export interface ErrorCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  
  // The clinical scenario
  scenario: {
    patientAge: number;
    patientSex: 'male' | 'female';
    presentation: string;
    initialWorkup: string;
    clinicianThinking: string;
  };
  
  // The error made
  error: {
    initialDiagnosis: string;
    missedDiagnosis: string;
    outcome: string;
    errorSummary: string;
  };
  
  // What students need to identify
  analysis: {
    cognitiveBiases: CognitiveBias[];
    biasExplanations: Record<CognitiveBias, string>;
    missedRedFlags: MissedRedFlag[];
    missedQuestions: MissedQuestion[];
    flawedReasoningSteps: FlawedReasoning[];
  };
  
  // The correct approach
  correctApproach: {
    keyDifferentials: string[];
    criticalTests: string[];
    reasoningPath: string;
  };
  
  // Reflection prompts
  reflectionPrompts: string[];
}

// Student's analysis submission
export interface ErrorAnalysis {
  id: string;
  errorCaseId: string;
  sessionKey: string;
  
  // Student's identified issues
  identifiedBiases: CognitiveBias[];
  identifiedRedFlags: string[];
  suggestedQuestions: string[];
  
  // Student's reconstruction
  reconstructedReasoning: string;
  
  // Reflection
  reflection: string;
  avoidanceStrategies: string[];
  
  // Scoring
  biasAccuracy: number; // 0-100
  redFlagAccuracy: number;
  questionAccuracy: number;
  overallScore: number;
  
  completedAt: Date;
}

// Diagnostic Uncertainty Training types
export interface DiagnosticConfidence {
  diagnosisId: string;
  diagnosisName: string;
  confidencePercent: number; // 0-100
  reasoning: string;
  uncertaintyFactors: string[];
  informationNeeded: string[];
}

export interface BayesianUpdate {
  testName: string;
  preTestProbability: number;
  testResult: string;
  postTestProbability: number;
  likelihoodRatioPositive?: number;
  likelihoodRatioNegative?: number;
  studentEstimate: number;
  isCorrect: boolean;
}

export interface UncertaintyCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Deliberately ambiguous presentation
  presentation: {
    age: number;
    sex: 'male' | 'female';
    chiefComplaint: string;
    limitedHistory: string;
    limitedExam: string;
  };
  
  // Plausible diagnoses with true probabilities
  differentials: {
    id: string;
    name: string;
    truePreTestProbability: number;
    keyFeatures: string[];
    againstFeatures: string[];
  }[];
  
  // Available tests with their impact
  availableTests: {
    id: string;
    name: string;
    result: string;
    impactOnDifferentials: Record<string, {
      priorProbability: number;
      posteriorProbability: number;
      likelihoodRatio: number;
    }>;
  }[];
  
  // Final reveal
  actualDiagnosis: string;
  teachingPoints: string[];
}

// Student's uncertainty session
export interface UncertaintySession {
  id: string;
  caseId: string;
  sessionKey: string;
  
  // Initial confidence ratings
  initialRatings: DiagnosticConfidence[];
  
  // Tests ordered and probability updates
  testsOrdered: string[];
  bayesianUpdates: BayesianUpdate[];
  
  // Final ratings before reveal
  finalRatings: DiagnosticConfidence[];
  
  // Calibration metrics
  calibration: {
    averageConfidence: number;
    actualAccuracy: number;
    brierScore: number; // Lower is better
    wasOverconfident: boolean;
    wasUnderconfident: boolean;
  };
  
  completedAt?: Date;
}

// Bias tracking over time
export interface BiasPattern {
  bias: CognitiveBias;
  encounterCount: number;
  identifiedCorrectly: number;
  missedCount: number;
  identificationRate: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastEncountered: Date;
}

// Calibration tracking
export interface CalibrationHistory {
  sessionId: string;
  caseId: string;
  date: Date;
  confidenceRating: number;
  wasCorrect: boolean;
  brierScore: number;
}
