// Clinical case types for the Metacognitive Reasoning Studio

export type Specialty = 
  | 'cardiology'
  | 'pulmonology'
  | 'gastroenterology'
  | 'neurology'
  | 'endocrinology'
  | 'infectious-disease'
  | 'nephrology'
  | 'hematology'
  | 'rheumatology'
  | 'emergency';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ConnectionType = 'supports-strong' | 'supports-weak' | 'contradicts' | 'neutral';

export interface ClinicalCase {
  id: string;
  title: string;
  specialty: Specialty;
  difficulty: Difficulty;
  estimatedMinutes: number;
  description: string;
  
  // Patient presentation
  patient: {
    age: number;
    sex: 'male' | 'female';
    chiefComplaint: string;
  };
  
  // Progressive reveal sections
  presentation: string;
  history?: string;
  physicalExam?: string;
  vitalSigns?: VitalSigns;
  
  // Available tests and their results
  availableTests: DiagnosticTest[];
  
  // Learning objectives
  learningObjectives: string[];
  
  // Expert reasoning map (for comparison)
  expertReasoningMap?: ReasoningMap;
  
  // Cognitive biases this case might trigger
  potentialBiases?: string[];
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'lab' | 'imaging' | 'procedure' | 'physical';
  result: string;
  interpretation?: string;
  cost?: number; // For resource-awareness training
}

// Reasoning canvas types
export type ReasoningNodeType = 'symptom' | 'finding' | 'diagnosis' | 'test' | 'note' | 'treatment' | 'outcome' | 'risk-factor' | 'complication';

export interface ReasoningNode {
  id: string;
  type: ReasoningNodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  confidence?: number; // 0-100 for diagnoses
  timestamp?: Date;
}

export interface ReasoningConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  label?: string;
}

export interface ReasoningMap {
  nodes: ReasoningNode[];
  connections: ReasoningConnection[];
  notes: ThinkAloudNote[];
}

export interface ThinkAloudNote {
  id: string;
  content: string;
  timestamp: Date;
  linkedNodeId?: string;
}

// Session tracking
export interface CaseSession {
  id: string;
  caseId: string;
  startedAt: Date;
  completedAt?: Date;
  reasoningMap: ReasoningMap;
  testsOrdered: string[];
  timeSpentSeconds: number;
  reflection?: string;
}

// Metacognitive metrics
export interface SessionMetrics {
  differentialBreadth: number; // How many diagnoses considered
  testEfficiency: number; // Ratio of useful tests to total tests
  reasoningSpeed: number; // Time to first diagnosis consideration
  confidenceCalibration: number; // How accurate were confidence ratings
  biasesIdentified: string[];
}
