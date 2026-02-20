import { ErrorCase, UncertaintyCase } from '@/types/errorCase';

export const sampleErrorCases: ErrorCase[] = [
  {
    id: 'error-001',
    title: 'The Missed Ectopic Pregnancy',
    specialty: 'emergency',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    scenario: {
      patientAge: 25,
      patientSex: 'female',
      presentation: 'A 25-year-old woman presents to the ED with diffuse abdominal pain for 2 days, nausea, and two episodes of vomiting. She rates her pain as 6/10, diffuse, crampy in nature.',
      initialWorkup: 'Vital signs: BP 110/70, HR 88, Temp 37.2°C. Abdomen soft with mild diffuse tenderness, no rebound or guarding. Labs ordered: CBC, CMP, lipase.',
      clinicianThinking: 'The resident noted the vomiting and crampy pain, and considered this a likely viral gastroenteritis. The patient was given IV fluids and ondansetron.',
    },
    error: {
      initialDiagnosis: 'Viral Gastroenteritis',
      missedDiagnosis: 'Ruptured Ectopic Pregnancy',
      outcome: 'Patient returned 6 hours later with syncope and hemodynamic instability. Emergency surgery confirmed ruptured ectopic pregnancy with significant hemoperitoneum.',
      errorSummary: 'Failure to consider pregnancy-related causes in a woman of reproductive age with abdominal pain.',
    },
    analysis: {
      cognitiveBiases: ['anchoring-bias', 'premature-closure', 'gender-bias'],
      biasExplanations: {
        'anchoring-bias': 'The clinician anchored on the vomiting and crampy pain, immediately thinking of GI causes without broadening the differential.',
        'premature-closure': 'Stopped the diagnostic process after settling on gastroenteritis without considering other life-threatening causes.',
        'gender-bias': 'Studies show that women\'s pain is often underestimated and attributed to benign causes more frequently than men\'s.',
        'availability-heuristic': '',
        'confirmation-bias': '',
        'diagnosis-momentum': '',
        'age-bias': '',
        'overconfidence': '',
        'representativeness-heuristic': '',
        'base-rate-neglect': '',
      },
      missedRedFlags: [
        {
          id: 'rf-1',
          description: 'Woman of reproductive age with abdominal pain - pregnancy must be ruled out',
          significance: 'critical',
        },
        {
          id: 'rf-2',
          description: 'No menstrual history documented',
          significance: 'critical',
        },
        {
          id: 'rf-3',
          description: 'Diffuse pain can indicate hemoperitoneum from rupture',
          significance: 'important',
        },
      ],
      missedQuestions: [
        {
          id: 'mq-1',
          question: 'When was your last menstrual period?',
          importance: 'Essential for any woman of reproductive age with abdominal pain',
          expectedAnswer: 'Last period was 7 weeks ago',
        },
        {
          id: 'mq-2',
          question: 'Is there any possibility you could be pregnant?',
          importance: 'Direct assessment of pregnancy status',
          expectedAnswer: 'Patient had unprotected intercourse 6 weeks ago',
        },
        {
          id: 'mq-3',
          question: 'Have you had any vaginal bleeding or spotting?',
          importance: 'Classic symptom of ectopic pregnancy',
          expectedAnswer: 'Yes, light spotting for past 3 days',
        },
      ],
      flawedReasoningSteps: [
        {
          nodeId: 'step-1',
          description: 'Abdominal pain + vomiting → GI cause',
          whatWentWrong: 'Jumped directly to GI etiology without considering the full differential for abdominal pain in a young woman',
          correctApproach: 'First rule out life-threatening causes: ectopic pregnancy, appendicitis, ovarian torsion',
        },
        {
          nodeId: 'step-2',
          description: 'No fever → less likely infectious',
          whatWentWrong: 'Used absence of fever to support viral gastroenteritis, ignoring that ectopic pregnancy is also afebrile',
          correctApproach: 'Absence of fever does not rule out surgical emergencies',
        },
      ],
    },
    correctApproach: {
      keyDifferentials: ['Ectopic pregnancy', 'Appendicitis', 'Ovarian torsion', 'Ovarian cyst rupture', 'Gastroenteritis'],
      criticalTests: ['Urine or serum beta-hCG', 'Pelvic ultrasound', 'CBC with differential'],
      reasoningPath: '1. Any woman of reproductive age with abdominal pain → check pregnancy status FIRST. 2. Positive hCG → transvaginal ultrasound to locate pregnancy. 3. Empty uterus + positive hCG = ectopic until proven otherwise.',
    },
    reflectionPrompts: [
      'What systematic approach would have prevented this error?',
      'How might unconscious biases about young women and pain have contributed?',
      'What is your "universal" rule for women of reproductive age with abdominal pain?',
      'How would you design your workflow to ensure this question is never missed?',
    ],
  },
  {
    id: 'error-002',
    title: 'The PE Masquerading as Anxiety',
    specialty: 'emergency',
    difficulty: 'advanced',
    estimatedMinutes: 25,
    scenario: {
      patientAge: 32,
      patientSex: 'female',
      presentation: 'A 32-year-old woman presents with acute onset shortness of breath and chest tightness for 3 hours. She appears anxious and is tearful. She mentions recent work stress and a panic attack last month.',
      initialWorkup: 'Vital signs: BP 125/80, HR 105, RR 22, O2 sat 96% on room air, Temp 36.8°C. Lungs clear, cardiac exam normal. ECG shows sinus tachycardia. She is 6 weeks postpartum.',
      clinicianThinking: 'Given history of prior panic attack and current stressors, the physician diagnosed panic attack. Patient given lorazepam and discharged.',
    },
    error: {
      initialDiagnosis: 'Panic Attack',
      missedDiagnosis: 'Pulmonary Embolism',
      outcome: 'Patient collapsed at home 8 hours later. EMS found her in PEA arrest. Despite resuscitation, she did not survive. Autopsy revealed massive saddle pulmonary embolism.',
      errorSummary: 'Attributed dyspnea and tachycardia to anxiety without adequately considering PE in a postpartum patient.',
    },
    analysis: {
      cognitiveBiases: ['anchoring-bias', 'availability-heuristic', 'gender-bias', 'premature-closure'],
      biasExplanations: {
        'anchoring-bias': 'Anchored on the prior panic attack history and current emotional presentation',
        'availability-heuristic': 'Recent experience with anxiety presentations made this diagnosis "come to mind" more easily',
        'gender-bias': 'Women\'s cardiopulmonary symptoms are more often attributed to anxiety/psychiatric causes',
        'premature-closure': 'Stopped investigating after "panic attack" seemed to fit',
        'confirmation-bias': '',
        'diagnosis-momentum': '',
        'age-bias': '',
        'overconfidence': '',
        'representativeness-heuristic': '',
        'base-rate-neglect': '',
      },
      missedRedFlags: [
        {
          id: 'rf-1',
          description: '6 weeks postpartum - hypercoagulable state',
          significance: 'critical',
          hint: 'Pregnancy and postpartum period dramatically increase VTE risk',
        },
        {
          id: 'rf-2',
          description: 'Tachycardia (HR 105) persisting',
          significance: 'important',
        },
        {
          id: 'rf-3',
          description: 'Acute onset of symptoms',
          significance: 'important',
          hint: 'PE typically has sudden onset, unlike the gradual buildup of panic',
        },
        {
          id: 'rf-4',
          description: 'Tachypnea (RR 22)',
          significance: 'important',
        },
      ],
      missedQuestions: [
        {
          id: 'mq-1',
          question: 'Any recent surgery, prolonged immobility, or long travel?',
          importance: 'Assessing VTE risk factors',
        },
        {
          id: 'mq-2',
          question: 'Any leg pain or swelling?',
          importance: 'Assessing for DVT as source',
        },
        {
          id: 'mq-3',
          question: 'Any history of blood clots in you or your family?',
          importance: 'Genetic thrombophilia assessment',
        },
        {
          id: 'mq-4',
          question: 'Are you on any hormonal medications?',
          importance: 'Hormonal contraceptives increase VTE risk',
        },
      ],
      flawedReasoningSteps: [
        {
          nodeId: 'step-1',
          description: 'Prior panic attack + current stress → anxiety',
          whatWentWrong: 'Used psychiatric history to explain current symptoms without objective exclusion of organic causes',
          correctApproach: 'Psychiatric diagnoses are diagnoses of exclusion - must rule out medical causes first',
        },
        {
          nodeId: 'step-2',
          description: 'Normal O2 sat → reassuring',
          whatWentWrong: 'O2 saturation can be normal or near-normal in PE; 96% in a young patient is not normal',
          correctApproach: 'Young healthy patients maintain O2 sat until late - do not rely on this to rule out PE',
        },
      ],
    },
    correctApproach: {
      keyDifferentials: ['Pulmonary embolism', 'Acute coronary syndrome', 'Pneumonia', 'Pneumothorax', 'Panic disorder'],
      criticalTests: ['D-dimer or CT pulmonary angiography', 'Troponin', 'Chest X-ray', 'ABG'],
      reasoningPath: '1. Postpartum + dyspnea + tachycardia = HIGH suspicion for PE. 2. Wells score indicates moderate-high probability. 3. Proceed directly to CTPA given clinical suspicion, or D-dimer if low probability. 4. Never attribute symptoms to anxiety without ruling out life threats.',
    },
    reflectionPrompts: [
      'How does the postpartum state change your approach to dyspnea?',
      'What is your rule for when "anxiety" is an acceptable diagnosis?',
      'How would you counsel a colleague who frequently diagnoses anxiety in young women?',
      'What systems-level changes could prevent this type of error?',
    ],
  },
];

export const sampleUncertaintyCases: UncertaintyCase[] = [
  {
    id: 'uncertainty-001',
    title: 'Fatigue and Weight Loss',
    specialty: 'internal-medicine',
    difficulty: 'intermediate',
    presentation: {
      age: 45,
      sex: 'male',
      chiefComplaint: 'Fatigue and unintentional weight loss over 3 months',
      limitedHistory: 'A 45-year-old man reports progressive fatigue and 15-pound weight loss over 3 months. He has no significant past medical history. He denies fever, night sweats, cough, or change in bowel habits. He works as an accountant and reports high stress.',
      limitedExam: 'Vital signs normal. Appears fatigued but not cachectic. No lymphadenopathy on initial exam. Abdomen soft, non-tender, no masses appreciated. Skin without rashes.',
    },
    differentials: [
      {
        id: 'dx-1',
        name: 'Malignancy (various)',
        truePreTestProbability: 25,
        keyFeatures: ['Unintentional weight loss', 'Age > 40', 'Progressive fatigue'],
        againstFeatures: ['No night sweats', 'No palpable masses', 'No lymphadenopathy'],
      },
      {
        id: 'dx-2',
        name: 'Diabetes Mellitus',
        truePreTestProbability: 20,
        keyFeatures: ['Weight loss', 'Fatigue', 'Age 45'],
        againstFeatures: ['No polyuria/polydipsia mentioned'],
      },
      {
        id: 'dx-3',
        name: 'Hyperthyroidism',
        truePreTestProbability: 15,
        keyFeatures: ['Weight loss', 'Fatigue (can occur)', 'Work stress'],
        againstFeatures: ['No palpitations mentioned', 'No tremor noted'],
      },
      {
        id: 'dx-4',
        name: 'Depression',
        truePreTestProbability: 15,
        keyFeatures: ['Fatigue', 'Weight loss (appetite changes)', 'High work stress'],
        againstFeatures: ['No mood symptoms elicited'],
      },
      {
        id: 'dx-5',
        name: 'Celiac Disease',
        truePreTestProbability: 8,
        keyFeatures: ['Weight loss', 'Fatigue (from malabsorption)'],
        againstFeatures: ['No GI symptoms', 'No diarrhea'],
      },
    ],
    availableTests: [
      {
        id: 'test-1',
        name: 'Complete Blood Count',
        result: 'Hemoglobin 10.2 g/dL (low), MCV 68 fL (microcytic), WBC and platelets normal',
        impactOnDifferentials: {
          'dx-1': { priorProbability: 25, posteriorProbability: 45, likelihoodRatio: 2.4 },
          'dx-2': { priorProbability: 20, posteriorProbability: 15, likelihoodRatio: 0.7 },
          'dx-5': { priorProbability: 8, posteriorProbability: 18, likelihoodRatio: 2.5 },
        },
      },
      {
        id: 'test-2',
        name: 'Fasting Glucose',
        result: '95 mg/dL (normal)',
        impactOnDifferentials: {
          'dx-2': { priorProbability: 20, posteriorProbability: 5, likelihoodRatio: 0.2 },
        },
      },
      {
        id: 'test-3',
        name: 'TSH',
        result: '2.1 mIU/L (normal)',
        impactOnDifferentials: {
          'dx-3': { priorProbability: 15, posteriorProbability: 3, likelihoodRatio: 0.15 },
        },
      },
      {
        id: 'test-4',
        name: 'Fecal Occult Blood Test',
        result: 'Positive',
        impactOnDifferentials: {
          'dx-1': { priorProbability: 45, posteriorProbability: 70, likelihoodRatio: 2.8 },
        },
      },
    ],
    actualDiagnosis: 'Colon Cancer (Stage III)',
    teachingPoints: [
      'Microcytic anemia in a 45-year-old male should raise concern for GI blood loss until proven otherwise',
      'The combination of weight loss + fatigue + anemia has a high positive predictive value for malignancy',
      'Age > 45 with iron deficiency anemia warrants colonoscopy regardless of symptoms',
      'Depression and other psychiatric diagnoses should not be the default without ruling out organic causes',
    ],
  },
  {
    id: 'uncertainty-002',
    title: 'Fever and Cough',
    specialty: 'emergency',
    difficulty: 'beginner',
    presentation: {
      age: 30,
      sex: 'female',
      chiefComplaint: 'Fever and productive cough for 4 days',
      limitedHistory: 'A 30-year-old woman presents with 4 days of fever (up to 38.5°C), productive cough with yellow sputum, and mild dyspnea on exertion. No chest pain. She is otherwise healthy with no medications.',
      limitedExam: 'Temp 38.1°C, HR 92, RR 20, O2 sat 96% on room air. Lungs with crackles at right base. No wheezing.',
    },
    differentials: [
      {
        id: 'dx-1',
        name: 'Community-Acquired Pneumonia',
        truePreTestProbability: 55,
        keyFeatures: ['Fever', 'Productive cough', 'Focal crackles', 'Dyspnea'],
        againstFeatures: ['Young, healthy patient'],
      },
      {
        id: 'dx-2',
        name: 'Acute Bronchitis',
        truePreTestProbability: 25,
        keyFeatures: ['Cough', 'Fever (can be mild)', 'Productive sputum'],
        againstFeatures: ['Focal exam findings'],
      },
      {
        id: 'dx-3',
        name: 'Influenza',
        truePreTestProbability: 12,
        keyFeatures: ['Fever', 'Cough', 'Acute onset'],
        againstFeatures: ['Focal findings on exam', 'No myalgias mentioned'],
      },
      {
        id: 'dx-4',
        name: 'COVID-19',
        truePreTestProbability: 8,
        keyFeatures: ['Fever', 'Cough', 'Dyspnea'],
        againstFeatures: ['Focal rather than diffuse findings'],
      },
    ],
    availableTests: [
      {
        id: 'test-1',
        name: 'Chest X-Ray',
        result: 'Right lower lobe consolidation with air bronchograms',
        impactOnDifferentials: {
          'dx-1': { priorProbability: 55, posteriorProbability: 85, likelihoodRatio: 4.5 },
          'dx-2': { priorProbability: 25, posteriorProbability: 5, likelihoodRatio: 0.15 },
        },
      },
      {
        id: 'test-2',
        name: 'Procalcitonin',
        result: '1.8 ng/mL (elevated)',
        impactOnDifferentials: {
          'dx-1': { priorProbability: 85, posteriorProbability: 92, likelihoodRatio: 2.0 },
          'dx-3': { priorProbability: 12, posteriorProbability: 5, likelihoodRatio: 0.4 },
        },
      },
      {
        id: 'test-3',
        name: 'Respiratory Viral Panel',
        result: 'Negative for influenza A/B, RSV, COVID-19',
        impactOnDifferentials: {
          'dx-3': { priorProbability: 5, posteriorProbability: 1, likelihoodRatio: 0.1 },
          'dx-4': { priorProbability: 8, posteriorProbability: 1, likelihoodRatio: 0.1 },
        },
      },
    ],
    actualDiagnosis: 'Community-Acquired Pneumonia (Streptococcus pneumoniae)',
    teachingPoints: [
      'Focal findings on lung exam increase probability of pneumonia vs bronchitis',
      'Chest X-ray remains the gold standard for pneumonia diagnosis',
      'Procalcitonin helps distinguish bacterial from viral causes',
      'Even with high initial confidence, systematic testing refines diagnostic certainty',
    ],
  },
];
