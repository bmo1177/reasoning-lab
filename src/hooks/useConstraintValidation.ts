import { useState, useCallback, useRef } from 'react';
import { validateDecision, type ConstraintValidation, type ValidationContext } from '@/services/constraintValidator';
import { logConstraintViolation } from '@/services/analyticsService';
import type { SimulationDecision, PatientState, BranchingCase } from '@/types/simulation';
import type { ConstraintViolation } from '@/types/analytics';

interface UseConstraintValidationReturn {
  // Current validation state
  currentWarning: ConstraintValidation | null;
  warningHistory: ConstraintValidation[];
  warningsIgnored: number;
  warningsHeeded: number;
  
  // Actions
  validateDecision: (
    decision: SimulationDecision,
    patientState: PatientState,
    caseData: BranchingCase
  ) => Promise<ConstraintValidation>;
  
  proceedWithWarning: () => void;
  chooseAlternative: (alternativeId?: string) => void;
  dismissWarning: () => void;
  
  // Statistics
  getValidationStats: () => {
    totalWarnings: number;
    criticalWarnings: number;
    errorWarnings: number;
    heededPercentage: number;
  };
  
  // Reset
  resetValidation: () => void;
}

export function useConstraintValidation(
  sessionId: string | null,
  userId: string | null,
  currentStageId: string
): UseConstraintValidationReturn {
  const [currentWarning, setCurrentWarning] = useState<ConstraintValidation | null>(null);
  const [warningHistory, setWarningHistory] = useState<ConstraintValidation[]>([]);
  const [warningsIgnored, setWarningsIgnored] = useState(0);
  const [warningsHeeded, setWarningsHeeded] = useState(0);
  
  // Track timing and decision counts per stage
  const stageStartTime = useRef<number>(Date.now());
  const decisionsInStage = useRef<number>(0);
  const totalDecisions = useRef<number>(0);
  const currentViolationId = useRef<string | null>(null);

  const validateDecisionAction = useCallback(async (
    decision: SimulationDecision,
    patientState: PatientState,
    caseData: BranchingCase
  ): Promise<ConstraintValidation> => {
    const context: ValidationContext = {
      timeInStage: Math.floor((Date.now() - stageStartTime.current) / 1000),
      decisionsInStage: decisionsInStage.current,
      totalDecisions: totalDecisions.current,
      currentStageId,
    };

    const validation = validateDecision(decision, patientState, caseData, context);
    
    if (!validation.isValid) {
      setCurrentWarning(validation);
      setWarningHistory(prev => [...prev, validation]);
      
      // Log to analytics if we have a session
      if (sessionId && userId && validation.severity !== 'safe') {
        const violationData = {
          simulation_session_id: sessionId,
          user_id: userId,
          violation_type: getViolationType(decision),
          severity: validation.severity,
          stage_id: currentStageId,
          decision_id: decision.id,
          decision_label: decision.label,
          violation_description: validation.message || 'Clinical constraint violated',
          suggested_correction: validation.suggestedAlternative ?? null,
          clinical_rationale: validation.clinicalRationale ?? null,
          was_heeded: false,
          alternative_chosen: null,
        };
        await logConstraintViolation(sessionId, userId, violationData as any);
      }
    }
    
    // Update counters
    decisionsInStage.current += 1;
    totalDecisions.current += 1;
    
    return validation;
  }, [sessionId, userId, currentStageId]);

  const proceedWithWarning = useCallback(async () => {
    if (currentWarning) {
      setWarningsIgnored(prev => prev + 1);
      
      // Update the violation as ignored
      if (currentViolationId.current && sessionId && userId) {
        // We would need to store the violation ID to update it
        // For now, we'll log a new event
      }
      
      setCurrentWarning(null);
    }
  }, [currentWarning, sessionId, userId]);

  const chooseAlternative = useCallback((alternativeId?: string) => {
    if (currentWarning) {
      setWarningsHeeded(prev => prev + 1);
      setCurrentWarning(null);
      
      // Return the alternative choice to the parent
      if (alternativeId) {
        // This would be handled by the parent component
        return alternativeId;
      }
    }
    return null;
  }, [currentWarning]);

  const dismissWarning = useCallback(() => {
    setCurrentWarning(null);
  }, []);

  const getValidationStats = useCallback(() => {
    const total = warningsIgnored + warningsHeeded;
    return {
      totalWarnings: warningHistory.length,
      criticalWarnings: warningHistory.filter(w => w.severity === 'critical').length,
      errorWarnings: warningHistory.filter(w => w.severity === 'error').length,
      heededPercentage: total > 0 ? (warningsHeeded / total) * 100 : 100,
    };
  }, [warningHistory, warningsIgnored, warningsHeeded]);

  const resetValidation = useCallback(() => {
    setCurrentWarning(null);
    setWarningHistory([]);
    setWarningsIgnored(0);
    setWarningsHeeded(0);
    stageStartTime.current = Date.now();
    decisionsInStage.current = 0;
    totalDecisions.current = 0;
    currentViolationId.current = null;
  }, []);

  // Helper to determine violation type
  const getViolationType = (decision: SimulationDecision): string => {
    switch (decision.type) {
      case 'treatment':
        return 'treatment_error';
      case 'test':
        return 'test_ordering_error';
      case 'procedure':
        return 'procedure_error';
      case 'consultation':
        return 'consultation_timing_error';
      default:
        return 'clinical_judgment_error';
    }
  };

  return {
    currentWarning,
    warningHistory,
    warningsIgnored,
    warningsHeeded,
    validateDecision: validateDecisionAction,
    proceedWithWarning,
    chooseAlternative,
    dismissWarning,
    getValidationStats,
    resetValidation,
  };
}
