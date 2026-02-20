import { useState, useCallback } from 'react';
import { validateDecision as validateDecisionService } from '@/services/constraintValidator';
import type { ConstraintValidation } from '@/services/constraintValidator';
import type { SimulationDecision, PatientState, BranchingCase } from '@/types/simulation';

export function useConstraintValidator() {
    const [currentWarning, setCurrentWarning] = useState<ConstraintValidation | null>(null);

    const validateDecision = useCallback((
        decision: SimulationDecision,
        patientState: PatientState,
        caseData: BranchingCase,
        context: {
            timeInStage: number;
            decisionsInStage: number;
            totalDecisions: number;
            currentStageId: string;
        }
    ) => {
        const validation = validateDecisionService(decision, patientState, caseData, context);

        if (!validation.isValid && (validation.severity === 'warning' || validation.severity === 'critical')) {
            setCurrentWarning(validation);
            return { allowed: false, validation };
        }

        return { allowed: true, validation };
    }, []);

    const proceedWithWarning = useCallback(() => {
        setCurrentWarning(null);
    }, []);

    return {
        validateDecision,
        currentWarning,
        proceedWithWarning
    };
}
