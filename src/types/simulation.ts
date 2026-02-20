// Simulation-based branching case types

export interface PatientState {
  status: 'stable' | 'declining' | 'critical' | 'improving' | 'resolved';
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  symptoms: string[];
  timeElapsed: number; // seconds
}

export interface SimulationDecision {
  id: string;
  type: 'test' | 'treatment' | 'consultation' | 'observation' | 'question' | 'procedure';
  label: string;
  description: string;
  cost: number; // in dollars
  timeRequired: number; // seconds
  consequences: {
    patientStateChange: Partial<PatientState>;
    newInformationRevealed?: string;
    triggersBranch?: string;
  };
}

export interface SimulationBranch {
  id: string;
  condition: string; // e.g., "missed_diagnosis", "correct_treatment"
  description: string;
  patientOutcome: 'good' | 'neutral' | 'poor' | 'critical';
  feedbackMessage: string;
}

export interface BranchingCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  description: string;
  hasTimeLimit: boolean;
  timeLimitSeconds?: number;
  complexityScore?: number;
  prerequisites?: string[];
  /** Simulation fidelity level. UML: MedicalSimulation.fidelityLevel */
  fidelityLevel?: 'low' | 'medium' | 'high';

  // Initial state
  initialPresentation: string;
  initialPatientState: PatientState;

  // Available decisions at each stage
  stages: SimulationStage[];

  // Possible endings
  branches: SimulationBranch[];

  // Optimal path for comparison
  optimalPath: {
    decisions: string[];
    totalCost: number;
    totalTime: number;
    outcome: 'good';
  };

  learningObjectives: string[];
}

export interface SimulationStage {
  id: string;
  name: string;
  description: string;
  availableDecisions: SimulationDecision[];
  requiredDecisionsToProgress?: string[]; // Decision IDs that must be made
  autoProgressAfterSeconds?: number;
  criticalWindow?: number; // Time in seconds before patient deteriorates
}

export interface SimulationSession {
  caseId: string;
  startedAt: Date;
  completedAt?: Date;
  currentStageId: string;
  decisionsMade: {
    decisionId: string;
    timestamp: Date;
    stageId: string;
  }[];
  patientState: PatientState;
  totalCost: number;
  finalOutcome?: string;
  branchReached?: string;
}

// Team collaboration types
export interface TeamMember {
  id: string;
  displayName: string;
  color: string;
  isHost: boolean;
  cursorPosition?: { x: number; y: number };
  lastSeenAt: Date;
}

export interface CanvasState {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    position: { x: number; y: number };
    data?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: Record<string, unknown>;
  }>;
}

export interface TeamRoom {
  id: string;
  roomCode: string;
  hostId: string;
  status: 'waiting' | 'active' | 'completed';
  caseId?: string;
  caseData?: Record<string, unknown>;
  members: TeamMember[];
  canvasState?: CanvasState;
  createdAt: Date;
}

export interface TeamVote {
  id: string;
  roomId: string;
  question: string;
  options: string[];
  votes: { memberId: string; optionIndex: number }[];
  createdAt: Date;
  closedAt?: Date;
}

export interface TeamMessage {
  id: string;
  roomId: string;
  memberId: string;
  memberName: string;
  memberColor: string;
  message: string;
  createdAt: Date;
}
