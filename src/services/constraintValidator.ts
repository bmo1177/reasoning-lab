// Clinical Constraint Validation System
// Rule-based constraint checking for simulation safety

import type { SimulationDecision, PatientState, BranchingCase } from '@/types/simulation';

export interface ConstraintValidation {
  isValid: boolean;
  severity: 'safe' | 'warning' | 'error' | 'critical';
  message?: string;
  clinicalRationale?: string;
  suggestedAlternative?: string;
}

export interface ConstraintRule {
  id: string;
  caseTypes?: string[];
  decisionTypes?: string[];
  stageIds?: string[];
  check: (
    decision: SimulationDecision,
    patientState: PatientState,
    caseData: BranchingCase,
    sessionContext: {
      timeInStage: number;
      decisionsInStage: number;
      totalDecisions: number;
    }
  ) => ConstraintValidation | null;
}

// ============================================
// Clinical Constraint Rules
// ============================================

export const clinicalConstraintRules: ConstraintRule[] = [
  // DKA: Insulin bolus not recommended
  {
    id: 'dka-insulin-bolus',
    caseTypes: ['sim-007'], // DKA case
    check: (decision) => {
      if (decision.id === 'insulin-bolus') {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Insulin bolus is not recommended by ADA guidelines for DKA',
          clinicalRationale: 'Insulin bolus increases risk of hypoglycemia and cerebral edema without added benefit. Use continuous insulin drip at 0.1 U/kg/hr instead.',
          suggestedAlternative: 'insulin-drip',
        };
      }
      return null;
    },
  },

  // DKA: Bicarbonate contraindicated
  {
    id: 'dka-bicarbonate',
    caseTypes: ['sim-007'],
    check: (decision, patientState) => {
      if (decision.id === 'bicarb' && patientState.status !== 'critical') {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Bicarbonate is not indicated for DKA with pH > 6.9',
          clinicalRationale: 'Bicarbonate administration in DKA with pH > 6.9 does not improve outcomes and may cause paradoxical CNS acidosis, hypokalemia, and fluid overload.',
          suggestedAlternative: 'Continue insulin and fluid therapy',
        };
      }
      return null;
    },
  },

  // Sepsis: Delayed antibiotics
  {
    id: 'sepsis-antibiotics-delay',
    caseTypes: ['sim-004'], // Sepsis case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (decision.id !== 'antibiotics' && sessionContext.timeInStage > 3600) { // 60 min
        return {
          isValid: false,
          severity: 'warning',
          message: 'Antibiotics should be administered within 1 hour in sepsis',
          clinicalRationale: 'Each hour of delayed antibiotic administration in sepsis increases mortality by approximately 7.6%. Current time in stage exceeds 30 minutes.',
          suggestedAlternative: 'antibiotics',
        };
      }
      return null;
    },
  },

  // Stroke: tPA without BP control
  {
    id: 'stroke-tpa-bp',
    caseTypes: ['sim-005'], // Stroke case
    check: (decision, patientState, caseData) => {
      const bp = patientState.vitalSigns.bloodPressure;
      const systolic = parseInt(bp.split('/')[0]);

      if (decision.id === 'tpa' && systolic > 185) {
        return {
          isValid: false,
          severity: 'critical',
          message: 'tPA contraindicated with uncontrolled hypertension (BP > 185/110)',
          clinicalRationale: 'Administering tPA with uncontrolled hypertension significantly increases risk of intracranial hemorrhage. BP must be lowered to < 185/110 before tPA.',
          suggestedAlternative: 'bp-control',
        };
      }
      return null;
    },
  },

  // Stroke: tPA after >4.5 hours without imaging
  {
    id: 'stroke-tpa-timing',
    caseTypes: ['sim-005'],
    check: (decision, _patientState, caseData, sessionContext) => {
      if (decision.id === 'tpa' && sessionContext.totalDecisions > 6) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Consider MRI perfusion imaging for wake-up stroke',
          clinicalRationale: 'For strokes with unknown onset time, MRI with DWI-FLAIR mismatch or perfusion imaging can identify patients who may still benefit from tPA beyond the standard window.',
          suggestedAlternative: 'mri',
        };
      }
      return null;
    },
  },

  // Aortic Dissection: Vasodilators without beta-blockade
  {
    id: 'aortic-dissection-vasodilators',
    caseTypes: ['sim-008'], // Aortic dissection case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (decision.id === 'nitroprusside' && sessionContext.decisionsInStage < 2) {
        return {
          isValid: false,
          severity: 'critical',
          message: 'Vasodilators must NOT be given before beta-blockade in aortic dissection',
          clinicalRationale: 'Vasodilators without prior beta-blockade increase dP/dt (shear stress), which can propagate the dissection. Beta-blockers MUST be given first to reduce shear stress.',
          suggestedAlternative: 'beta-blockade',
        };
      }
      return null;
    },
  },

  // AKI: Excessive fluids in euvolemic patient
  {
    id: 'aki-fluid-overload',
    caseTypes: ['sim-009'], // AKI case
    check: (decision, patientState) => {
      const bp = patientState.vitalSigns.bloodPressure;
      const systolic = parseInt(bp.split('/')[0]);

      if (decision.id === 'fluid-challenge' && systolic > 120) {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Fluid challenge may not be appropriate in normotensive patient',
          clinicalRationale: 'Patient has normal blood pressure. Excessive fluid administration in euvolemic AKI can lead to fluid overload, pulmonary edema, and delayed dialysis. Consider other causes of AKI.',
          suggestedAlternative: 'Check FeNa and urine studies to determine etiology',
        };
      }
      return null;
    },
  },

  // Status Epilepticus: Delayed benzodiazepines
  {
    id: 'status-epilepticus-delay',
    caseTypes: ['sim-015'], // Status epilepticus case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (!['lorazepam', 'lorazepam-repeat', 'midazolam'].includes(decision.id) && sessionContext.timeInStage > 300) {
        return {
          isValid: false,
          severity: 'critical',
          message: 'Benzodiazepines must be administered within 5 minutes of status epilepticus',
          clinicalRationale: 'Time is brain in status epilepticus. Benzodiazepines are first-line and must be given immediately. Delayed treatment leads to refractory status and worse outcomes.',
          suggestedAlternative: 'lorazepam',
        };
      }
      return null;
    },
  },

  // Pediatric Respiratory: Steroids in bronchiolitis
  {
    id: 'bronchiolitis-steroids',
    caseTypes: ['sim-006'], // Pediatric respiratory case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (decision.id === 'steroids' && sessionContext.totalDecisions > 3) {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Steroids are NOT effective for bronchiolitis in children < 2 years',
          clinicalRationale: 'Multiple studies have shown no benefit from corticosteroids in bronchiolitis. Treatment is supportive care with possible trial of bronchodilators and escalation to high-flow if needed.',
          suggestedAlternative: 'trial-bronchodilator',
        };
      }
      return null;
    },
  },

  // Hypoglycemia: Oral glucose in unresponsive patient
  {
    id: 'hypoglycemia-oral-route',
    caseTypes: ['sim-003'], // Hypoglycemia case
    check: (decision, patientState) => {
      if (decision.id === 'oral-glucose' && patientState.status === 'critical') {
        return {
          isValid: false,
          severity: 'critical',
          message: 'Oral glucose is CONTRAINDICATED in unresponsive patients',
          clinicalRationale: 'Unresponsive patients cannot protect their airway. Oral glucose places them at high risk of aspiration and aspiration pneumonia. Use IV dextrose or IM glucagon instead.',
          suggestedAlternative: 'dextrose-iv',
        };
      }
      return null;
    },
  },

  // HIV/PCP: Early ART initiation
  {
    id: 'hiv-pcp-early-art',
    caseTypes: ['sim-014'], // HIV/PCP case
    check: (decision) => {
      if (decision.id === 'immediate-art') {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Consider delaying ART for 2 weeks after starting OI treatment',
          clinicalRationale: 'Starting ART immediately during acute opportunistic infection can trigger IRIS (Immune Reconstitution Inflammatory Syndrome), which can worsen clinical status. Guidelines recommend starting ART within 2 weeks, not immediately.',
          suggestedAlternative: 'delayed-art',
        };
      }
      return null;
    },
  },

  // Chest Pain: Delayed ECG in STEMI
  {
    id: 'stemi-ecg-delay',
    caseTypes: ['sim-001'], // Chest pain/STEMI case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (!['ecg-stat', 'aspirin', 'iv-access', 'oxygen'].includes(decision.id) && sessionContext.timeInStage > 600) {
        return {
          isValid: false,
          severity: 'warning',
          message: 'ECG should be obtained within 10 minutes in suspected ACS',
          clinicalRationale: 'Door-to-ECG time should be < 10 minutes in suspected acute coronary syndrome. ECG is critical to identify STEMI requiring emergent reperfusion.',
          suggestedAlternative: 'ecg-stat',
        };
      }
      return null;
    },
  },

  // Appendicitis: Missing pregnancy test
  {
    id: 'appendicitis-pregnancy-test',
    caseTypes: ['sim-011'], // Appendicitis case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (['ct-abdomen', 'surgery-consult'].includes(decision.id) && sessionContext.decisionsInStage < 3) {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Consider pregnancy test before imaging or surgery in reproductive-age female',
          clinicalRationale: 'Ectopic pregnancy can present with similar symptoms to appendicitis. Beta-hCG should be checked in all reproductive-age females before radiation exposure or surgery.',
          suggestedAlternative: 'pregnancy-test',
        };
      }
      return null;
    },
  },

  // Trauma: Missing primary survey
  {
    id: 'trauma-primary-survey',
    caseTypes: ['sim-010'], // Trauma case
    check: (decision, _patientState, _caseData, sessionContext) => {
      if (['ct-abdomen', 'ct-head', 'efast'].includes(decision.id) && sessionContext.decisionsInStage < 2) {
        return {
          isValid: false,
          severity: 'warning',
          message: 'Complete primary survey (ABCs) before advanced imaging',
          clinicalRationale: 'ATLS protocol requires systematic primary survey (Airway, Breathing, Circulation, Disability, Exposure) before advanced diagnostics. This identifies life-threatening conditions that require immediate intervention.',
          suggestedAlternative: 'abc',
        };
      }
      return null;
    },
  },
];

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a decision against clinical constraints
 */
export function validateDecision(
  decision: SimulationDecision,
  patientState: PatientState,
  caseData: BranchingCase,
  sessionContext: ValidationContext
): ConstraintValidation {
  // Check all applicable rules
  for (const rule of clinicalConstraintRules) {
    // Check if rule applies to this case type
    if (rule.caseTypes && !rule.caseTypes.includes(caseData.id)) {
      continue;
    }

    // Check if rule applies to this decision type
    if (rule.decisionTypes && !rule.decisionTypes.includes(decision.type)) {
      continue;
    }

    // Check if rule applies to this stage
    if (rule.stageIds && !rule.stageIds.includes(sessionContext.currentStageId || '')) {
      continue;
    }

    // Run the rule check
    const result = rule.check(decision, patientState, caseData, sessionContext);
    if (result) {
      return result;
    }
  }

  // No constraints violated
  return {
    isValid: true,
    severity: 'safe',
  };
}

/**
 * Get all applicable constraints for a case
 */
export function getApplicableConstraints(caseId: string): ConstraintRule[] {
  return clinicalConstraintRules.filter(
    (rule) => !rule.caseTypes || rule.caseTypes.includes(caseId)
  );
}

/**
 * Check if a specific constraint exists for a decision
 */
export function hasConstraint(
  decisionId: string,
  caseId: string
): boolean {
  return clinicalConstraintRules.some(
    (rule) =>
      (!rule.caseTypes || rule.caseTypes.includes(caseId)) &&
      rule.id.includes(decisionId)
  );
}

// Add currentStageId to sessionContext
export interface ValidationContext {
  timeInStage: number;
  decisionsInStage: number;
  totalDecisions: number;
  currentStageId?: string;
}
