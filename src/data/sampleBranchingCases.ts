import { BranchingCase } from '@/types/simulation';

export const sampleBranchingCases: BranchingCase[] = [
  {
    id: 'sim-001',
    title: 'Emergency: Chest Pain Triage',
    specialty: 'emergency',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    description: 'A 58-year-old man arrives by ambulance with severe chest pain. Time is critical—every decision matters.',
    hasTimeLimit: true,
    timeLimitSeconds: 600, // 10 minutes
    
    initialPresentation: `EMS brings in a 58-year-old male with crushing substernal chest pain that started 45 minutes ago. He is diaphoretic and clutching his chest. Pain radiates to left arm. He looks frightened and says "I think I'm having a heart attack."

History obtained en route: HTN, diabetes, smokes 1 pack/day. Father died of MI at 55.`,
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: {
        bloodPressure: '160/100',
        heartRate: 110,
        respiratoryRate: 24,
        temperature: 37.0,
        oxygenSaturation: 94,
      },
      symptoms: ['Crushing chest pain', 'Diaphoresis', 'Left arm radiation', 'Anxiety'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Initial Assessment',
        description: 'The patient is in front of you. What do you do first?',
        criticalWindow: 120, // 2 minutes
        availableDecisions: [
          {
            id: 'ecg-stat',
            type: 'test',
            label: 'STAT 12-lead ECG',
            description: 'Order immediate ECG to assess for STEMI',
            cost: 50,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'ECG shows ST elevation in V1-V4 with reciprocal depression in inferior leads. STEMI confirmed.',
            },
          },
          {
            id: 'aspirin',
            type: 'treatment',
            label: 'Give Aspirin 325mg',
            description: 'Chewable aspirin for antiplatelet effect',
            cost: 2,
            timeRequired: 15,
            consequences: {
              patientStateChange: { status: 'stable' },
            },
          },
          {
            id: 'iv-access',
            type: 'treatment',
            label: 'Establish IV Access',
            description: 'Large bore IV for medication administration',
            cost: 15,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
            },
          },
          {
            id: 'oxygen',
            type: 'treatment',
            label: 'Supplemental Oxygen',
            description: 'Nasal cannula at 2-4L/min',
            cost: 5,
            timeRequired: 15,
            consequences: {
              patientStateChange: {
                vitalSigns: {
                  bloodPressure: '160/100',
                  heartRate: 108,
                  respiratoryRate: 22,
                  temperature: 37.0,
                  oxygenSaturation: 98,
                },
              },
            },
          },
          {
            id: 'history-detailed',
            type: 'question',
            label: 'Detailed History',
            description: 'Spend time getting complete medical history',
            cost: 0,
            timeRequired: 180, // 3 minutes - wastes critical time
            consequences: {
              patientStateChange: { status: 'critical' },
              triggersBranch: 'delayed_treatment',
            },
          },
          {
            id: 'troponin',
            type: 'test',
            label: 'Order Troponin',
            description: 'Send cardiac enzymes',
            cost: 75,
            timeRequired: 45,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Troponin I: 0.8 ng/mL (elevated). Results will take 45 minutes.',
            },
          },
        ],
        requiredDecisionsToProgress: ['ecg-stat'],
      },
      {
        id: 'stage-2',
        name: 'STEMI Confirmed',
        description: 'ECG confirms anterior STEMI. Door-to-balloon time is critical. What next?',
        criticalWindow: 180,
        availableDecisions: [
          {
            id: 'activate-cath',
            type: 'consultation',
            label: 'Activate Cath Lab',
            description: 'Call interventional cardiology for emergent PCI',
            cost: 0,
            timeRequired: 30,
            consequences: {
              patientStateChange: { status: 'stable' },
              triggersBranch: 'optimal_care',
            },
          },
          {
            id: 'heparin',
            type: 'treatment',
            label: 'Give Heparin',
            description: 'Anticoagulation for ACS',
            cost: 50,
            timeRequired: 15,
            consequences: {
              patientStateChange: {},
            },
          },
          {
            id: 'nitro',
            type: 'treatment',
            label: 'Sublingual Nitro',
            description: 'Nitroglycerin for chest pain',
            cost: 10,
            timeRequired: 15,
            consequences: {
              patientStateChange: {
                symptoms: ['Mild chest discomfort', 'Diaphoresis resolving'],
              },
            },
          },
          {
            id: 'morphine',
            type: 'treatment',
            label: 'Morphine for Pain',
            description: 'IV morphine for chest pain relief',
            cost: 20,
            timeRequired: 15,
            consequences: {
              patientStateChange: {
                vitalSigns: {
                  bloodPressure: '140/85',
                  heartRate: 95,
                  respiratoryRate: 20,
                  temperature: 37.0,
                  oxygenSaturation: 98,
                },
              },
            },
          },
          {
            id: 'tpa',
            type: 'treatment',
            label: 'Give tPA (Thrombolytics)',
            description: 'Fibrinolytic therapy if PCI unavailable',
            cost: 3000,
            timeRequired: 60,
            consequences: {
              patientStateChange: { status: 'improving' },
              newInformationRevealed: 'Thrombolytics given. Should be reserved for when PCI is not available within 120 minutes.',
            },
          },
          {
            id: 'wait-troponin',
            type: 'observation',
            label: 'Wait for Troponin Results',
            description: 'Hold further treatment pending lab confirmation',
            cost: 0,
            timeRequired: 300,
            consequences: {
              patientStateChange: { status: 'critical' },
              triggersBranch: 'delayed_treatment',
            },
          },
        ],
        requiredDecisionsToProgress: ['activate-cath'],
      },
      {
        id: 'stage-3',
        name: 'Transfer to Cath Lab',
        description: 'Patient is being prepared for emergent catheterization.',
        availableDecisions: [
          {
            id: 'clopidogrel',
            type: 'treatment',
            label: 'Loading Dose Clopidogrel',
            description: 'Dual antiplatelet therapy before PCI',
            cost: 30,
            timeRequired: 15,
            consequences: {
              patientStateChange: {},
            },
          },
          {
            id: 'beta-blocker',
            type: 'treatment',
            label: 'IV Metoprolol',
            description: 'Beta-blocker to reduce myocardial demand',
            cost: 25,
            timeRequired: 15,
            consequences: {
              patientStateChange: {
                vitalSigns: {
                  bloodPressure: '130/80',
                  heartRate: 75,
                  respiratoryRate: 18,
                  temperature: 37.0,
                  oxygenSaturation: 99,
                },
              },
            },
          },
          {
            id: 'transfer-now',
            type: 'treatment',
            label: 'Transfer Immediately',
            description: 'Send to cath lab without delay',
            cost: 0,
            timeRequired: 60,
            consequences: {
              patientStateChange: { status: 'improving' },
              triggersBranch: 'optimal_care',
            },
          },
        ],
      },
    ],
    
    branches: [
      {
        id: 'optimal_care',
        condition: 'Cath lab activated within 10 minutes, appropriate initial care',
        description: 'Patient received timely reperfusion therapy',
        patientOutcome: 'good',
        feedbackMessage: 'Excellent work! Door-to-balloon time was optimal. The patient received emergent PCI with successful revascularization. Ejection fraction preserved at 50%. Expected full recovery.',
      },
      {
        id: 'delayed_treatment',
        condition: 'Critical time wasted on non-urgent tasks',
        description: 'Delayed reperfusion led to larger infarct',
        patientOutcome: 'poor',
        feedbackMessage: 'Treatment was delayed due to non-critical activities. The patient developed a larger infarct with EF of 30%. Will require heart failure management long-term. Consider: In STEMI, every minute counts—door-to-balloon time should be <90 minutes.',
      },
      {
        id: 'suboptimal_care',
        condition: 'Some critical steps missed',
        description: 'Patient survived but with complications',
        patientOutcome: 'neutral',
        feedbackMessage: 'The patient was treated but some standard care elements were missed. Consider reviewing ACS protocols. The patient developed mild heart failure but is stable.',
      },
    ],
    
    optimalPath: {
      decisions: ['aspirin', 'iv-access', 'ecg-stat', 'activate-cath', 'heparin', 'clopidogrel', 'transfer-now'],
      totalCost: 147,
      totalTime: 180,
      outcome: 'good',
    },
    
    learningObjectives: [
      'Recognize STEMI as a time-critical emergency',
      'Prioritize immediate ECG in chest pain patients',
      'Understand door-to-balloon time targets',
      'Apply appropriate initial STEMI management',
      'Balance thoroughness with urgency in emergencies',
    ],
  },
  {
    id: 'sim-002',
    title: 'Pediatric Fever: When to Worry',
    specialty: 'emergency',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    description: 'A 2-year-old presents with high fever. Distinguish serious bacterial infection from benign viral illness.',
    hasTimeLimit: false,
    
    initialPresentation: `Parents bring in their 2-year-old daughter with fever of 39.5°C for 2 days. She has been fussy and not eating well. No rash, no vomiting, mild runny nose. Vaccinations up to date.

Mom is very worried: "She's never been this sick before."`,
    
    initialPatientState: {
      status: 'stable',
      vitalSigns: {
        bloodPressure: '90/60',
        heartRate: 140,
        respiratoryRate: 28,
        temperature: 39.5,
        oxygenSaturation: 98,
      },
      symptoms: ['High fever', 'Fussiness', 'Decreased appetite', 'Rhinorrhea'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Initial Evaluation',
        description: 'The child is in mom\'s arms, crying but consolable. What is your approach?',
        availableDecisions: [
          {
            id: 'appearance-check',
            type: 'observation',
            label: 'Assess General Appearance',
            description: 'Observe activity, responsiveness, color, hydration',
            cost: 0,
            timeRequired: 60,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Child is alert, makes eye contact, cries but consolable. Color is pink. Mucous membranes moist. Capillary refill <2 seconds.',
            },
          },
          {
            id: 'ear-exam',
            type: 'test',
            label: 'Otoscopic Exam',
            description: 'Examine ear drums',
            cost: 0,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Right tympanic membrane is bulging and erythematous. Left ear normal.',
            },
          },
          {
            id: 'throat-exam',
            type: 'test',
            label: 'Throat Examination',
            description: 'Examine oropharynx',
            cost: 0,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Throat mildly erythematous, no exudates. Tonsils normal size.',
            },
          },
          {
            id: 'cbc-stat',
            type: 'test',
            label: 'STAT CBC',
            description: 'Complete blood count to assess for bacterial infection',
            cost: 50,
            timeRequired: 120,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'WBC 12.5 (normal for age), no left shift. Hemoglobin normal.',
            },
          },
          {
            id: 'blood-culture',
            type: 'test',
            label: 'Blood Culture',
            description: 'Culture for bacteremia',
            cost: 100,
            timeRequired: 60,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Blood culture sent. Results pending (24-48 hours).',
            },
          },
          {
            id: 'lp',
            type: 'procedure',
            label: 'Lumbar Puncture',
            description: 'CSF analysis for meningitis',
            cost: 500,
            timeRequired: 180,
            consequences: {
              patientStateChange: { symptoms: ['High fever', 'Crying from procedure', 'Rhinorrhea'] },
              newInformationRevealed: 'LP performed. CSF clear, WBC 2, protein/glucose normal. No meningitis.',
            },
          },
          {
            id: 'iv-antibiotics',
            type: 'treatment',
            label: 'IV Ceftriaxone',
            description: 'Empiric IV antibiotics',
            cost: 200,
            timeRequired: 60,
            consequences: {
              patientStateChange: {},
            },
          },
          {
            id: 'oral-amoxicillin',
            type: 'treatment',
            label: 'Oral Amoxicillin',
            description: 'Oral antibiotics for otitis media',
            cost: 15,
            timeRequired: 15,
            consequences: {
              patientStateChange: { status: 'improving' },
            },
          },
          {
            id: 'tylenol',
            type: 'treatment',
            label: 'Acetaminophen',
            description: 'Antipyretic for fever and comfort',
            cost: 5,
            timeRequired: 15,
            consequences: {
              patientStateChange: {
                vitalSigns: {
                  bloodPressure: '90/60',
                  heartRate: 120,
                  respiratoryRate: 24,
                  temperature: 38.2,
                  oxygenSaturation: 98,
                },
                symptoms: ['Low-grade fever', 'More comfortable', 'Rhinorrhea'],
              },
            },
          },
        ],
      },
    ],
    
    branches: [
      {
        id: 'appropriate_care',
        condition: 'Physical exam performed, otitis media diagnosed, oral antibiotics prescribed',
        description: 'Correct diagnosis with appropriate treatment',
        patientOutcome: 'good',
        feedbackMessage: 'Well done! You identified acute otitis media through appropriate physical examination. Oral antibiotics are the correct treatment. The child improved within 48 hours.',
      },
      {
        id: 'over_workup',
        condition: 'Invasive tests ordered for well-appearing child',
        description: 'Excessive testing for low-risk presentation',
        patientOutcome: 'neutral',
        feedbackMessage: 'While the child recovered, the workup was more extensive than necessary for a well-appearing child with clear source of fever. Consider: The pediatric assessment triangle (appearance, work of breathing, circulation) helps stratify risk.',
      },
      {
        id: 'missed_diagnosis',
        condition: 'No ear exam, treated as viral',
        description: 'Otitis media missed, sent home without antibiotics',
        patientOutcome: 'poor',
        feedbackMessage: 'The otitis media was missed. The child returned 3 days later with worsening symptoms and required hospitalization. Always examine ears in febrile children.',
      },
    ],
    
    optimalPath: {
      decisions: ['appearance-check', 'ear-exam', 'throat-exam', 'tylenol', 'oral-amoxicillin'],
      totalCost: 20,
      totalTime: 150,
      outcome: 'good',
    },
    
    learningObjectives: [
      'Apply pediatric assessment triangle',
      'Recognize when invasive workup is vs. is not needed',
      'Perform systematic physical exam for fever source',
      'Understand cost-effective fever workup in children',
      'Balance parental anxiety with appropriate care',
    ],
  },
  {
    id: 'sim-003',
    title: 'Hypoglycemia Emergency',
    specialty: 'endocrinology',
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    description: 'A diabetic patient is found unresponsive. Rapid assessment and treatment are critical.',
    hasTimeLimit: true,
    timeLimitSeconds: 300, // 5 minutes
    
    initialPresentation: `EMS brings in a 45-year-old man found unresponsive in his car. Bystander called 911 when they noticed him slumped over the steering wheel. Medical alert bracelet indicates "Type 1 Diabetes."

EMS reports: Patient is diaphoretic, responsive only to painful stimuli. Blood glucose on their meter: 28 mg/dL.`,
    
    initialPatientState: {
      status: 'critical',
      vitalSigns: {
        bloodPressure: '100/65',
        heartRate: 110,
        respiratoryRate: 18,
        temperature: 36.5,
        oxygenSaturation: 96,
      },
      symptoms: ['Unresponsive', 'Diaphoresis', 'Hypoglycemia'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Immediate Resuscitation',
        description: 'Patient is unresponsive with critical hypoglycemia. Act now!',
        criticalWindow: 60,
        availableDecisions: [
          {
            id: 'dextrose-iv',
            type: 'treatment',
            label: 'D50W IV Push',
            description: '50mL of 50% dextrose IV',
            cost: 25,
            timeRequired: 30,
            consequences: {
              patientStateChange: {
                status: 'improving',
                vitalSigns: {
                  bloodPressure: '120/75',
                  heartRate: 90,
                  respiratoryRate: 16,
                  temperature: 36.5,
                  oxygenSaturation: 98,
                },
                symptoms: ['Regaining consciousness', 'Confusion'],
              },
              newInformationRevealed: 'After 2 minutes, patient begins to wake up. Repeat glucose: 145 mg/dL.',
              triggersBranch: 'rapid_treatment',
            },
          },
          {
            id: 'glucagon',
            type: 'treatment',
            label: 'Glucagon IM',
            description: '1mg glucagon intramuscular',
            cost: 300,
            timeRequired: 45,
            consequences: {
              patientStateChange: {
                status: 'stable',
                symptoms: ['Drowsy', 'Nausea'],
              },
              newInformationRevealed: 'Glucose slowly rises to 95 mg/dL over 15 minutes. Patient is nauseated.',
            },
          },
          {
            id: 'check-airway',
            type: 'observation',
            label: 'Assess Airway',
            description: 'Check airway patency and breathing',
            cost: 0,
            timeRequired: 15,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Airway is patent. Breathing spontaneously. No immediate need for intubation.',
            },
          },
          {
            id: 'iv-access',
            type: 'treatment',
            label: 'Establish IV Access',
            description: 'Place large bore IV',
            cost: 15,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
            },
          },
          {
            id: 'wait-labs',
            type: 'observation',
            label: 'Wait for Lab Confirmation',
            description: 'Order serum glucose and wait for lab results',
            cost: 20,
            timeRequired: 180,
            consequences: {
              patientStateChange: { status: 'critical' },
              triggersBranch: 'delayed_treatment',
            },
          },
          {
            id: 'oral-glucose',
            type: 'treatment',
            label: 'Oral Glucose Gel',
            description: 'Give oral glucose',
            cost: 5,
            timeRequired: 30,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Patient is too unresponsive to swallow safely. Aspiration risk!',
            },
          },
        ],
        requiredDecisionsToProgress: ['dextrose-iv'],
      },
      {
        id: 'stage-2',
        name: 'Post-Resuscitation Care',
        description: 'Patient is awake but confused. What happened and how to prevent recurrence?',
        availableDecisions: [
          {
            id: 'history-meds',
            type: 'question',
            label: 'Medication History',
            description: 'Ask about insulin regimen and recent changes',
            cost: 0,
            timeRequired: 60,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Patient took his usual insulin dose but skipped breakfast due to a work meeting. He is on basal-bolus regimen with Lantus and Humalog.',
            },
          },
          {
            id: 'recheck-glucose',
            type: 'test',
            label: 'Recheck Blood Glucose',
            description: 'Monitor glucose level',
            cost: 5,
            timeRequired: 15,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Glucose is now 160 mg/dL and stable.',
            },
          },
          {
            id: 'food',
            type: 'treatment',
            label: 'Give Food/Complex Carbs',
            description: 'Sandwich or crackers to maintain glucose',
            cost: 5,
            timeRequired: 30,
            consequences: {
              patientStateChange: { status: 'stable' },
            },
          },
          {
            id: 'diabetes-education',
            type: 'consultation',
            label: 'Diabetes Education',
            description: 'Counsel on hypoglycemia prevention',
            cost: 0,
            timeRequired: 120,
            consequences: {
              patientStateChange: {},
              newInformationRevealed: 'Patient educated on adjusting insulin when skipping meals. Given hypoglycemia action plan.',
              triggersBranch: 'optimal_care',
            },
          },
        ],
      },
    ],
    
    branches: [
      {
        id: 'rapid_treatment',
        condition: 'IV dextrose given within 60 seconds',
        description: 'Rapid correction prevented complications',
        patientOutcome: 'good',
        feedbackMessage: 'Excellent! You recognized the emergency and treated immediately. The patient recovered completely with no neurological sequelae.',
      },
      {
        id: 'optimal_care',
        condition: 'Rapid treatment plus prevention education',
        description: 'Complete care with prevention focus',
        patientOutcome: 'good',
        feedbackMessage: 'Outstanding work! You not only treated the emergency but also addressed the cause and provided education to prevent future episodes.',
      },
      {
        id: 'delayed_treatment',
        condition: 'Waiting for lab confirmation or giving oral glucose to unresponsive patient',
        description: 'Delayed treatment or inappropriate route',
        patientOutcome: 'critical',
        feedbackMessage: 'Critical error: Waiting for lab confirmation in obvious hypoglycemia wastes precious time. Oral glucose is contraindicated in unresponsive patients due to aspiration risk. The patient developed hypoglycemic brain injury.',
      },
    ],
    
    optimalPath: {
      decisions: ['check-airway', 'iv-access', 'dextrose-iv', 'recheck-glucose', 'food', 'history-meds', 'diabetes-education'],
      totalCost: 50,
      totalTime: 300,
      outcome: 'good',
    },
    
    learningObjectives: [
      'Recognize severe hypoglycemia as a medical emergency',
      'Know appropriate route of glucose administration by consciousness level',
      'Understand timing is critical in hypoglycemia',
      'Address root cause to prevent recurrence',
      'Recognize contraindication to oral agents in unresponsive patients',
    ],
  },

  // ============================================
  // ADDITIONAL SIMULATION CASES (4-15)
  // ============================================
  
  // CASE 4: SEPSIS
  {
    id: 'sim-004',
    title: 'Sepsis Recognition: The 1-Hour Bundle',
    specialty: 'emergency',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    description: 'A 68-year-old with fever and hypotension. Recognize sepsis and apply the 1-hour bundle.',
    hasTimeLimit: true,
    timeLimitSeconds: 600,
    complexityScore: 7.5,
    prerequisites: ['Basic vital signs interpretation'],
    
    initialPresentation: '68-year-old male with fever 39.2C, hypotension 82/54, confusion. PMH: DM, COPD, HTN.',
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: { bloodPressure: '82/54', heartRate: 118, respiratoryRate: 26, temperature: 39.2, oxygenSaturation: 91 },
      symptoms: ['Fever', 'Confusion', 'Productive cough'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Recognize Sepsis',
        description: 'Calculate qSOFA and start resuscitation',
        criticalWindow: 120,
        availableDecisions: [
          { id: 'qsofa', type: 'test', label: 'Calculate qSOFA', description: 'Quick SOFA score', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'qSOFA=3. High risk.' } },
          { id: 'lactate', type: 'test', label: 'STAT Lactate', description: 'Tissue perfusion marker', cost: 45, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Lactate 4.2 mmol/L (elevated)' } },
          { id: 'cultures', type: 'test', label: 'Blood Cultures x2', description: 'Before antibiotics', cost: 150, timeRequired: 60, consequences: { patientStateChange: {} } },
          { id: 'iv-access', type: 'procedure', label: 'Large Bore IV x2', description: 'For fluids/meds', cost: 30, timeRequired: 120, consequences: { patientStateChange: {} } },
          { id: 'antibiotics', type: 'treatment', label: 'Empiric Antibiotics', description: 'Ceftriaxone + Azithromycin', cost: 85, timeRequired: 15, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'fluids', type: 'treatment', label: '30 mL/kg Fluid Bolus', description: '~2.5L crystalloid', cost: 150, timeRequired: 45, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '95/65', heartRate: 105, respiratoryRate: 24, temperature: 39.0, oxygenSaturation: 95 } } } },
          { id: 'pressors', type: 'treatment', label: 'Norepinephrine', description: 'If MAP <65 after fluids', cost: 200, timeRequired: 60, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '110/75', heartRate: 95, respiratoryRate: 20, temperature: 38.8, oxygenSaturation: 97 } } } },
        ],
        requiredDecisionsToProgress: ['qsofa', 'iv-access'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Sepsis bundle completed <1 hour', description: 'Rapid treatment', patientOutcome: 'good', feedbackMessage: 'Excellent! 1-hour bundle completed. Patient recovered.' },
      { id: 'delayed', condition: 'Antibiotics delayed >3 hours', description: 'Delayed treatment', patientOutcome: 'poor', feedbackMessage: 'Critical delay. Each hour increases mortality 7.6%.' },
    ],
    
    optimalPath: { decisions: ['qsofa', 'lactate', 'cultures', 'iv-access', 'antibiotics', 'fluids'], totalCost: 460, totalTime: 315, outcome: 'good' },
    learningObjectives: ['Calculate qSOFA', 'Apply 1-hour sepsis bundle', 'Early antibiotics importance'],
  },

  // CASE 5: ACUTE STROKE
  {
    id: 'sim-005',
    title: 'Acute Stroke: The tPA Decision',
    specialty: 'emergency',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    description: '72-year-old with acute stroke. Navigate tPA decision-making.',
    hasTimeLimit: true,
    timeLimitSeconds: 900,
    complexityScore: 9.0,
    prerequisites: ['NIHSS knowledge', 'tPA contraindications'],
    
    initialPresentation: '72F found with left hemiparesis and aphasia. Last seen normal 9 hours ago (wake-up stroke).',
    
    initialPatientState: {
      status: 'critical',
      vitalSigns: { bloodPressure: '185/110', heartRate: 88, respiratoryRate: 16, temperature: 36.8, oxygenSaturation: 97 },
      symptoms: ['Aphasia', 'Left hemiparesis', 'Facial droop'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Initial Assessment',
        description: 'NIHSS, CT, determine time window',
        criticalWindow: 180,
        availableDecisions: [
          { id: 'nihss', type: 'test', label: 'Calculate NIHSS', description: 'Stroke severity', cost: 0, timeRequired: 120, consequences: { patientStateChange: {}, newInformationRevealed: 'NIHSS=18 (severe)' } },
          { id: 'ct', type: 'test', label: 'STAT CT Head', description: 'Rule out bleed', cost: 350, timeRequired: 20, consequences: { patientStateChange: {}, newInformationRevealed: 'No hemorrhage. Right MCA infarct.' } },
          { id: 'glucose', type: 'test', label: 'Glucose Check', description: 'Rule out hypoglycemia', cost: 5, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Glucose 142' } },
          { id: 'bp-control', type: 'treatment', label: 'Labetalol 10mg IV', description: 'BP <185/110 for tPA', cost: 25, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '165/95', heartRate: 78, respiratoryRate: 16, temperature: 36.8, oxygenSaturation: 97 } } } },
          { id: 'contraindications', type: 'question', label: 'Check Contraindications', description: 'tPA exclusion criteria', cost: 0, timeRequired: 180, consequences: { patientStateChange: {}, newInformationRevealed: 'No contraindications. Safe for tPA.' } },
        ],
        requiredDecisionsToProgress: ['nihss', 'ct'],
      },
      {
        id: 'stage-2',
        name: 'tPA Decision',
        description: 'Wake-up stroke decision',
        criticalWindow: 300,
        availableDecisions: [
          { id: 'tpa', type: 'treatment', label: 'Give tPA 0.9 mg/kg', description: 'Thrombolytics', cost: 8000, timeRequired: 60, consequences: { patientStateChange: { status: 'improving' }, triggersBranch: 'tpa_success' } },
          { id: 'mri', type: 'test', label: 'MRI with Perfusion', description: 'Identify penumbra', cost: 1200, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'Small core, large penumbra. Good tPA candidate.' } },
          { id: 'aspirin', type: 'treatment', label: 'Aspirin Only', description: 'No tPA', cost: 2, timeRequired: 15, consequences: { patientStateChange: { status: 'stable' }, triggersBranch: 'no_reperfusion' } },
        ],
        requiredDecisionsToProgress: ['contraindications'],
      },
    ],
    
    branches: [
      { id: 'tpa_success', condition: 'tPA given with proper selection', description: 'Successful thrombolysis', patientOutcome: 'good', feedbackMessage: 'Excellent! tPA given appropriately. Good functional recovery.' },
      { id: 'tpa_hemorrhage', condition: 'tPA with uncontrolled BP', description: 'ICH post-tPA', patientOutcome: 'critical', feedbackMessage: 'Catastrophic: BP must be <185/110 before tPA!' },
      { id: 'no_reperfusion', condition: 'No tPA given', description: 'No reperfusion', patientOutcome: 'poor', feedbackMessage: 'Poor outcome without reperfusion. Consider MRI to extend window.' },
    ],
    
    optimalPath: { decisions: ['nihss', 'ct', 'glucose', 'bp-control', 'contraindications', 'mri', 'tpa'], totalCost: 9582, totalTime: 455, outcome: 'good' },
    learningObjectives: ['NIHSS calculation', 'tPA window and contraindications', 'Wake-up stroke management'],
  },

  // CASE 6: PEDIATRIC RESPIRATORY DISTRESS
  {
    id: 'sim-006',
    title: 'Pediatric Respiratory Distress',
    specialty: 'pediatrics',
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    description: '18-month-old with wheezing and respiratory distress. Bronchiolitis vs asthma management.',
    hasTimeLimit: true,
    timeLimitSeconds: 900,
    complexityScore: 6.5,
    prerequisites: ['Pediatric vital signs'],
    
    initialPresentation: '18-month-old male with wheezing, retractions, SpO2 89%. URI symptoms 3 days. Born premature.',
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: { bloodPressure: '85/55', heartRate: 155, respiratoryRate: 48, temperature: 37.8, oxygenSaturation: 89 },
      symptoms: ['Wheezing', 'Retractions', 'Nasal flaring', 'Poor feeding'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Assessment',
        description: 'Assess severity and etiology',
        availableDecisions: [
          { id: 'exam', type: 'observation', label: 'Physical Exam', description: 'Assess work of breathing', cost: 0, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'Moderate-severe distress. Wheezing bilaterally.' } },
          { id: 'oxygen', type: 'treatment', label: 'Oxygen via NC', description: 'Target SpO2 >92%', cost: 10, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '85/55', heartRate: 155, respiratoryRate: 48, temperature: 37.8, oxygenSaturation: 93 } } } },
          { id: 'trial-bronchodilator', type: 'treatment', label: 'Albuterol Trial', description: 'Test for reactive airway', cost: 25, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Minimal improvement. Likely bronchiolitis not asthma.' } },
          { id: 'steroids', type: 'treatment', label: 'Oral Steroids', description: 'For asthma', cost: 15, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Steroids NOT effective for bronchiolitis <2 years.' } },
          { id: 'epinephrine', type: 'treatment', label: 'Racemic Epinephrine', description: 'For bronchiolitis', cost: 50, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '85/55', heartRate: 155, respiratoryRate: 40, temperature: 37.8, oxygenSaturation: 94 } } } },
          { id: 'high-flow', type: 'treatment', label: 'High-Flow Nasal Cannula', description: 'For moderate-severe', cost: 200, timeRequired: 45, consequences: { patientStateChange: { status: 'stable', vitalSigns: { bloodPressure: '85/55', heartRate: 155, respiratoryRate: 32, temperature: 37.8, oxygenSaturation: 96 } } } },
          { id: 'iv-fluids', type: 'treatment', label: 'IV Fluids', description: 'Hydration', cost: 30, timeRequired: 60, consequences: { patientStateChange: {} } },
        ],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Supportive care, no steroids, appropriate escalation', description: 'Good bronchiolitis management', patientOutcome: 'good', feedbackMessage: 'Excellent! Supportive care with appropriate escalation. Avoided ineffective steroids.' },
      { id: 'over-treat', condition: 'Multiple bronchodilators and steroids', description: 'Over-treatment', patientOutcome: 'neutral', feedbackMessage: 'Overtreated. Bronchiolitis <2 years does not respond to bronchodilators or steroids.' },
      { id: 'delayed-escalation', condition: 'Did not recognize severity', description: 'Respiratory failure', patientOutcome: 'poor', feedbackMessage: 'Delayed recognition of severity led to respiratory failure and intubation.' },
    ],
    
    optimalPath: { decisions: ['exam', 'oxygen', 'trial-bronchodilator', 'epinephrine', 'high-flow', 'iv-fluids'], totalCost: 315, totalTime: 210, outcome: 'good' },
    learningObjectives: ['Bronchiolitis vs asthma differentiation', 'Appropriate bronchiolitis management', 'When to escalate care'],
  },

  // CASE 7: DKA MANAGEMENT
  {
    id: 'sim-007',
    title: 'DKA: Fluid and Insulin Protocol',
    specialty: 'endocrinology',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    description: '22-year-old Type 1 diabetic with DKA. Master fluid resuscitation and insulin protocols.',
    hasTimeLimit: false,
    complexityScore: 6.0,
    prerequisites: ['Basic diabetes management'],
    
    initialPresentation: '22F Type 1 DM with nausea, vomiting, polyuria for 2 days. Glucose 450, pH 7.25, bicarb 14.',
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: { bloodPressure: '95/60', heartRate: 115, respiratoryRate: 28, temperature: 37.2, oxygenSaturation: 98 },
      symptoms: ['Nausea', 'Vomiting', 'Kussmaul respirations', 'Dry mucous membranes'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Initial Assessment',
        description: 'Confirm diagnosis and assess severity',
        availableDecisions: [
          { id: 'labs', type: 'test', label: 'Complete Metabolic Panel', description: 'BMP, ketones, ABG', cost: 150, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Glucose 458, bicarb 14, pH 7.26, ketones positive. Moderate DKA.' } },
          { id: 'fluid-choice', type: 'treatment', label: 'Normal Saline 1L Bolus', description: 'Isotonic fluid resuscitation', cost: 50, timeRequired: 60, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '105/70', heartRate: 105, respiratoryRate: 28, temperature: 37.2, oxygenSaturation: 98 } } } },
          { id: 'insulin-bolus', type: 'treatment', label: 'Insulin Bolus 0.1 U/kg', description: 'IV insulin push', cost: 25, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Insulin bolus given - NOT recommended by ADA guidelines!' } },
          { id: 'insulin-drip', type: 'treatment', label: 'Insulin Drip 0.1 U/kg/hr', description: 'Continuous infusion', cost: 100, timeRequired: 30, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'potassium', type: 'test', label: 'Check Potassium', description: 'Critical before insulin', cost: 15, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'K+ 3.8 mEq/L. Safe to start insulin.' } },
        ],
        requiredDecisionsToProgress: ['labs', 'fluid-choice', 'insulin-drip'],
      },
      {
        id: 'stage-2',
        name: 'Ongoing Management',
        description: 'Monitor and adjust therapy',
        availableDecisions: [
          { id: 'd5w', type: 'treatment', label: 'Add D5W to Fluids', description: 'When glucose <250', cost: 20, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Glucose now 220. Added dextrose to prevent hypoglycemia while continuing insulin.' } },
          { id: 'bicarb', type: 'treatment', label: 'Sodium Bicarbonate', description: 'For severe acidosis', cost: 30, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'pH >6.9. Bicarbonate NOT indicated and may cause harm.' } },
          { id: 'recheck-glucose', type: 'test', label: 'Hourly Glucose', description: 'Monitor closely', cost: 10, timeRequired: 5, consequences: { patientStateChange: {}, newInformationRevealed: 'Glucose trending down appropriately.' } },
          { id: 'potassium-replacement', type: 'treatment', label: 'KCl 20 mEq/L', description: 'Replace as insulin drives K+ intracellular', cost: 25, timeRequired: 15, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['recheck-glucose'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Appropriate fluid resuscitation, insulin drip without bolus, dextrose added timely', description: 'Standard DKA protocol followed', patientOutcome: 'good', feedbackMessage: 'Excellent! You followed ADA guidelines: normal saline first, insulin drip without bolus, added dextrose at appropriate glucose threshold.' },
      { id: 'insulin-bolus-error', condition: 'Gave insulin bolus against guidelines', description: 'Unnecessary insulin bolus', patientOutcome: 'neutral', feedbackMessage: 'The patient recovered, but insulin bolus is no longer recommended - increases risk of hypoglycemia and cerebral edema without benefit.' },
      { id: 'hypoglycemia', condition: 'Continued insulin without dextrose when glucose <200', description: 'Iatrogenic hypoglycemia', patientOutcome: 'poor', feedbackMessage: 'Hypoglycemia occurred! When glucose reaches 250, add dextrose to fluids and continue insulin to clear ketosis.' },
    ],
    
    optimalPath: { decisions: ['labs', 'fluid-choice', 'potassium', 'insulin-drip', 'recheck-glucose', 'd5w', 'potassium-replacement'], totalCost: 295, totalTime: 170, outcome: 'good' },
    learningObjectives: ['DKA diagnostic criteria', 'Fluid resuscitation protocol', 'Insulin drip without bolus', 'When to add dextrose', 'Potassium management'],
  },

  // CASE 8: AORTIC DISSECTION
  {
    id: 'sim-008',
    title: 'Aortic Dissection: The Great Masquerader',
    specialty: 'emergency',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    description: '58-year-old with tearing chest pain. Rapid diagnosis and blood pressure control are life-saving.',
    hasTimeLimit: true,
    timeLimitSeconds: 900,
    complexityScore: 8.5,
    prerequisites: ['Chest pain differential diagnosis'],
    
    initialPresentation: '58M with sudden onset tearing chest pain radiating to back. BP 190/110 R arm, 160/95 L arm. Marfanoid habitus.',
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: { bloodPressure: '190/110', heartRate: 95, respiratoryRate: 20, temperature: 36.8, oxygenSaturation: 97 },
      symptoms: ['Tearing chest pain', 'Radiation to back', 'Diaphoresis'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Recognition',
        description: 'Recognize dissection and initiate immediate therapy',
        criticalWindow: 300,
        availableDecisions: [
          { id: 'bp-check', type: 'observation', label: 'Check Bilateral BP', description: 'BP differential suggests dissection', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: '30mmHg difference between arms. Highly suspicious for dissection.' } },
          { id: 'ecg', type: 'test', label: 'ECG', description: 'Rule out MI', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'ECG normal. Not MI.' } },
          { id: 'cxr', type: 'test', label: 'Chest X-ray', description: 'Widened mediastinum?', cost: 50, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Widened mediastinum >8cm. Dissection highly likely.' } },
          { id: 'beta-blockade', type: 'treatment', label: 'Esmolol 500mcg/kg bolus', description: 'Beta-blockade BEFORE vasodilators', cost: 150, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '175/100', heartRate: 70, respiratoryRate: 20, temperature: 36.8, oxygenSaturation: 97 } } } },
          { id: 'nitroprusside', type: 'treatment', label: 'Nitroprusside', description: 'Vasodilator - DANGEROUS without beta-blockade', cost: 200, timeRequired: 15, consequences: { patientStateChange: { status: 'critical' }, newInformationRevealed: 'dP/dt increases without beta-blockade! Risk of propagation.' } },
          { id: 'nitroprusside-safe', type: 'treatment', label: 'Nitroprusside AFTER Beta-Blockade', description: 'Target MAP 65-75', cost: 200, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '130/85', heartRate: 68, respiratoryRate: 20, temperature: 36.8, oxygenSaturation: 97 } } } },
          { id: 'ct-angio', type: 'test', label: 'CT Angiography', description: 'Definitive diagnosis', cost: 800, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Type A dissection ascending aorta. Requires immediate surgery!' } },
        ],
        requiredDecisionsToProgress: ['bp-check', 'beta-blockade'],
      },
      {
        id: 'stage-2',
        name: 'Definitive Management',
        description: 'Confirm and mobilize resources',
        criticalWindow: 600,
        availableDecisions: [
          { id: 'surgery-consult', type: 'consultation', label: 'Emergency Cardiac Surgery', description: 'Type A = surgery', cost: 0, timeRequired: 60, consequences: { patientStateChange: {}, triggersBranch: 'type_a_surgery' } },
          { id: 'medical-only', type: 'treatment', label: 'Medical Management Only', description: 'For Type B', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Type A requires surgery regardless!' } },
          { id: 'endovascular', type: 'treatment', label: 'TEVAR Consideration', description: 'For complicated Type B', cost: 15000, timeRequired: 120, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['surgery-consult'],
      },
    ],
    
    branches: [
      { id: 'type_a_surgery', condition: 'Beta-blockade first, prompt diagnosis, immediate surgery', description: 'Optimal Type A management', patientOutcome: 'good', feedbackMessage: 'Excellent! Beta-blockade BEFORE vasodilators prevents dP/dt increase. Prompt surgery for Type A dissection is life-saving.' },
      { id: 'vasodilator-alone', condition: 'Gave nitroprusside without beta-blockade', description: 'Dissection propagation', patientOutcome: 'critical', feedbackMessage: 'CRITICAL ERROR: Vasodilators without beta-blockade increase shear stress (dP/dt) and can propagate dissection!' },
      { id: 'delayed-surgery', condition: 'Delayed diagnosis >1 hour', description: 'Hemodynamic collapse', patientOutcome: 'poor', feedbackMessage: 'Every minute counts in Type A dissection. Delayed diagnosis led to tamponade and death.' },
    ],
    
    optimalPath: { decisions: ['bp-check', 'ecg', 'cxr', 'beta-blockade', 'nitroprusside-safe', 'ct-angio', 'surgery-consult'], totalCost: 1400, totalTime: 240, outcome: 'good' },
    learningObjectives: ['Tearing pain + pulse deficit = dissection', 'Beta-blockade before vasodilators', 'Type A requires surgery', 'BP differential significance'],
  },

  // CASE 9: ACUTE KIDNEY INJURY
  {
    id: 'sim-009',
    title: 'AKI: Pre-renal vs Intrinsic vs Post-renal',
    specialty: 'nephrology',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    description: '68-year-old with rising creatinine. Determine etiology and decide on dialysis.',
    hasTimeLimit: false,
    complexityScore: 7.0,
    prerequisites: ['Renal physiology basics'],
    
    initialPresentation: '68M with creatinine 4.2 (baseline 1.1). 3 days post-op hip replacement. Urine output 300mL/24hr.',
    
    initialPatientState: {
      status: 'stable',
      vitalSigns: { bloodPressure: '105/65', heartRate: 92, respiratoryRate: 18, temperature: 37.0, oxygenSaturation: 96 },
      symptoms: ['Decreased urine output', 'Edema', 'Fatigue'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Diagnostic Workup',
        description: 'Determine cause of AKI',
        availableDecisions: [
          { id: 'fe-na', type: 'test', label: 'Fractional Excretion of Sodium', description: 'Prerenal vs intrinsic', cost: 35, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'FeNa <1% suggests prerenal etiology.' } },
          { id: 'urinalysis', type: 'test', label: 'Urinalysis', description: 'Look for casts', cost: 25, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Muddy brown casts present. Suggests ATN.' } },
          { id: 'renal-us', type: 'test', label: 'Renal Ultrasound', description: 'Rule out obstruction', cost: 200, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'No hydronephrosis. Ruled out post-renal.' } },
          { id: 'med-review', type: 'question', label: 'Medication Review', description: 'Nephrotoxic agents', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Patient received IV contrast 2 days ago + NSAIDs. Risk factors for ATN.' } },
          { id: 'fluid-challenge', type: 'treatment', label: 'Fluid Challenge 1-2L', description: 'Test volume responsiveness', cost: 50, timeRequired: 120, consequences: { patientStateChange: { status: 'stable' }, newInformationRevealed: 'No response. Likely ATN not prerenal.' } },
        ],
        requiredDecisionsToProgress: ['fe-na', 'urinalysis', 'renal-us'],
      },
      {
        id: 'stage-2',
        name: 'Management Decision',
        description: 'Conservative vs dialysis',
        availableDecisions: [
          { id: 'dialysis-indications', type: 'test', label: 'Check AEIOU Indications', description: 'Acidosis, Electrolytes, Intoxication, Overload, Uremia', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'K+ 6.2, pH 7.18, BUN 140. Meets AEIOU criteria.' } },
          { id: 'emergent-dialysis', type: 'treatment', label: 'Emergent Hemodialysis', description: 'Hyperkalemia + acidosis', cost: 2500, timeRequired: 120, consequences: { patientStateChange: { status: 'improving', vitalSigns: { bloodPressure: '110/70', heartRate: 82, respiratoryRate: 18, temperature: 37.0, oxygenSaturation: 96 } } } },
          { id: 'kayexalate', type: 'treatment', label: 'Kayexalate', description: 'For hyperkalemia temporizing', cost: 150, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'K+ dropped to 5.8. Temporary measure.' } },
          { id: 'calcium', type: 'treatment', label: 'Calcium Gluconate', description: 'Cardiac membrane stabilization', cost: 25, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'ECG shows peaked T waves. Calcium given for membrane protection.' } },
          { id: 'insulin-glucose', type: 'treatment', label: 'Insulin + Glucose', description: 'Shift K+ intracellular', cost: 50, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'K+ shifted temporarily.' } },
          { id: 'nephrology-consult', type: 'consultation', label: 'Nephrology Consult', description: 'For dialysis planning', cost: 0, timeRequired: 60, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['dialysis-indications'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Correctly diagnosed ATN, recognized AEIOU indications, initiated dialysis', description: 'Appropriate AKI management', patientOutcome: 'good', feedbackMessage: 'Excellent workup! Correctly identified ATN due to contrast + NSAIDs, recognized AEIOU indications for dialysis, and initiated timely treatment.' },
      { id: 'delayed-dialysis', condition: 'Delayed dialysis despite indications', description: 'Uremic complications', patientOutcome: 'poor', feedbackMessage: 'Delayed dialysis led to uremic pericarditis. Remember AEIOU: Acidosis, Electrolytes, Intoxication, Overload, Uremia.' },
      { id: 'fluid-overload', condition: 'Gave excessive fluids to euvolemic patient', description: 'Pulmonary edema', patientOutcome: 'critical', feedbackMessage: 'Fluid overload! Patient had ATN not prerenal. Excess fluids caused pulmonary edema and respiratory failure.' },
    ],
    
    optimalPath: { decisions: ['fe-na', 'urinalysis', 'renal-us', 'med-review', 'fluid-challenge', 'dialysis-indications', 'calcium', 'insulin-glucose', 'emergent-dialysis', 'nephrology-consult'], totalCost: 3035, totalTime: 450, outcome: 'good' },
    learningObjectives: ['AKI etiology classification', 'FeNa interpretation', 'Muddy brown casts in ATN', 'AEIOU dialysis indications', 'Hyperkalemia management'],
  },

  // CASE 10: BLUNT TRAUMA ATLS
  {
    id: 'sim-010',
    title: 'Blunt Trauma: ATLS Primary Survey',
    specialty: 'emergency',
    difficulty: 'advanced',
    estimatedMinutes: 18,
    description: '28-year-old motorcyclist after crash. Systematic trauma evaluation following ATLS.',
    hasTimeLimit: true,
    timeLimitSeconds: 900,
    complexityScore: 8.0,
    prerequisites: ['ATLS protocol knowledge'],
    
    initialPresentation: '28M motorcycle vs car. Helmets on. GCS 14, hypotensive 90/60, tachycardic 120, RR 28, SpO2 94%.',
    
    initialPatientState: {
      status: 'critical',
      vitalSigns: { bloodPressure: '90/60', heartRate: 120, respiratoryRate: 28, temperature: 36.5, oxygenSaturation: 94 },
      symptoms: ['Chest pain', 'Abdominal pain', 'Head injury', 'Altered mental status'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'ABCDE Primary Survey',
        description: 'Systematic trauma assessment',
        criticalWindow: 300,
        availableDecisions: [
          { id: 'airway', type: 'observation', label: 'Assess Airway', description: 'Airway patent?', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Airway patent. GCS 14. No immediate intubation needed.' } },
          { id: 'breathing', type: 'observation', label: 'Assess Breathing', description: 'Breath sounds, work of breathing', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Decreased breath sounds left. Possible pneumothorax or hemothorax.' } },
          { id: 'chest-tube', type: 'procedure', label: 'Chest Tube Placement', description: 'For hemopneumothorax', cost: 300, timeRequired: 120, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '90/60', heartRate: 120, respiratoryRate: 22, temperature: 36.5, oxygenSaturation: 98 } } } },
          { id: 'circulation', type: 'observation', label: 'Assess Circulation', description: 'Pulse, BP, hemorrhage control', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'BP 90/60, HR 120. Signs of shock. Abdomen distended and tender.' } },
          { id: 'iv-access', type: 'procedure', label: '2 Large Bore IVs', description: '14-16 gauge', cost: 30, timeRequired: 60, consequences: { patientStateChange: {} } },
          { id: 'fluids', type: 'treatment', label: '1L NS Bolus', description: 'Resuscitation', cost: 50, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '100/70', heartRate: 115, respiratoryRate: 28, temperature: 36.5, oxygenSaturation: 94 } } } },
          { id: 'disability', type: 'observation', label: 'Neurological Assessment', description: 'GCS, pupils', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'GCS 14 (E4 V4 M6). Pupils equal reactive.' } },
          { id: 'exposure', type: 'observation', label: 'Full Exposure', description: 'Log roll, examine back', cost: 0, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'No spinal tenderness. Multiple abrasions.' } },
          { id: 'log-roll', type: 'procedure', label: 'Log Roll with C-spine', description: 'Protect spine during exam', cost: 0, timeRequired: 60, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['airway', 'breathing', 'circulation'],
      },
      {
        id: 'stage-2',
        name: 'Diagnostic Imaging',
        description: 'FAST and CT imaging',
        availableDecisions: [
          { id: 'efast', type: 'test', label: 'EFAST Exam', description: 'Extended FAST', cost: 0, timeRequired: 180, consequences: { patientStateChange: {}, newInformationRevealed: 'Positive FAST - fluid in Morrison\'s pouch and splenorenal recess.' } },
          { id: 'ct-abdomen', type: 'test', label: 'CT Abdomen/Pelvis', description: 'With contrast', cost: 800, timeRequired: 20, consequences: { patientStateChange: {}, newInformationRevealed: 'Grade IV splenic laceration with hemoperitoneum.' } },
          { id: 'ct-head', type: 'test', label: 'CT Head', description: 'Given GCS 14', cost: 500, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'No intracranial hemorrhage.' } },
          { id: 'c-spine-ct', type: 'test', label: 'CT C-spine', description: 'Clear c-collar', cost: 400, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'No cervical spine fracture.' } },
          { id: 'trauma-surgery', type: 'consultation', label: 'Trauma Surgery Consult', description: 'For operative management', cost: 0, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'blood-products', type: 'treatment', label: 'O-negative Blood', description: 'Type and cross 6 units', cost: 1200, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '115/75', heartRate: 105, respiratoryRate: 22, temperature: 36.5, oxygenSaturation: 98 } } } },
        ],
        requiredDecisionsToProgress: ['efast'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Systematic ABCDE, appropriate imaging, trauma consult', description: 'Excellent trauma management', patientOutcome: 'good', feedbackMessage: 'Outstanding ATLS protocol! Systematic ABCDE approach, appropriate FAST and CT imaging, early blood products, successful non-operative management of splenic injury.' },
      { id: 'missed-pneumothorax', condition: 'Did not address decreased breath sounds', description: 'Tension pneumothorax', patientOutcome: 'critical', feedbackMessage: 'CRITICAL: Decreased breath sounds in trauma = tension pneumothorax until proven otherwise. Needed immediate decompression!' },
      { id: 'spinal-injury', condition: 'Did not protect spine during log roll', description: 'Spinal cord injury', patientOutcome: 'poor', feedbackMessage: 'Spinal injury! Always maintain inline stabilization during log roll and patient movement.' },
    ],
    
    optimalPath: { decisions: ['airway', 'breathing', 'chest-tube', 'circulation', 'iv-access', 'fluids', 'disability', 'log-roll', 'exposure', 'efast', 'ct-abdomen', 'ct-head', 'blood-products', 'trauma-surgery'], totalCost: 3080, totalTime: 825, outcome: 'good' },
    learningObjectives: ['ATLS ABCDE primary survey', 'EFAST interpretation', 'Tension pneumothorax recognition', 'Spinal protection', 'Massive transfusion protocol'],
  },

  // CASE 11: ACUTE APPENDICITIS
  {
    id: 'sim-011',
    title: 'Acute Appendicitis: Clinical Decision Rules',
    specialty: 'surgery',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    description: '24-year-old with RLQ pain. Use clinical decision rules and imaging appropriately.',
    hasTimeLimit: false,
    complexityScore: 5.5,
    prerequisites: ['Abdominal exam skills'],
    
    initialPresentation: '24F with 24 hours of RLQ pain, anorexia, nausea. T 37.8C, WBC 12.5. No prior surgeries.',
    
    initialPatientState: {
      status: 'stable',
      vitalSigns: { bloodPressure: '118/72', heartRate: 88, respiratoryRate: 16, temperature: 37.8, oxygenSaturation: 99 },
      symptoms: ['RLQ pain', 'Anorexia', 'Nausea', 'No vomiting'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Clinical Assessment',
        description: 'Physical exam and decision rules',
        availableDecisions: [
          { id: 'alvarado', type: 'test', label: 'Calculate Alvarado Score', description: 'Clinical decision rule', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Alvarado = 8 (high probability). Migratory pain, anorexia, RLQ tenderness, rebound, elevated WBC, left shift.' } },
          { id: 'exam', type: 'observation', label: 'Physical Exam', description: 'McBurney\'s, Rovsing, psoas', cost: 0, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'Tenderness at McBurney\'s point. Positive Rovsing. Negative psoas/obturator.' } },
          { id: 'pregnancy-test', type: 'test', label: 'Serum Beta-hCG', description: 'Rule out ectopic', cost: 45, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Beta-hCG negative. Not pregnant.' } },
          { id: 'urinalysis', type: 'test', label: 'Urinalysis', description: 'Rule out UTI/pyelo', cost: 25, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'UA normal. No pyuria.' } },
          { id: 'ct-abdomen', type: 'test', label: 'CT Abdomen/Pelvis', description: 'With contrast', cost: 800, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'Dilated, non-compressible appendix with wall thickening and periappendiceal fat stranding.' } },
          { id: 'ultrasound', type: 'test', label: 'Point-of-Care Ultrasound', description: 'Radiation-sparing', cost: 150, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Non-compressible tubular structure 10mm. Positive.' } },
          { id: 'mri', type: 'test', label: 'MRI Abdomen', description: 'If pregnant', cost: 1200, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'Not indicated - patient not pregnant.' } },
        ],
        requiredDecisionsToProgress: ['alvarado', 'exam'],
      },
      {
        id: 'stage-2',
        name: 'Management',
        description: 'Surgical vs conservative',
        availableDecisions: [
          { id: 'surgery-consult', type: 'consultation', label: 'General Surgery Consult', description: 'For appendectomy', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, triggersBranch: 'surgical_management' } },
          { id: 'antibiotics-only', type: 'treatment', label: 'Antibiotics Only', description: 'Non-operative management', cost: 200, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'For uncomplicated appendicitis, antibiotics alone has 60-70% success rate but high recurrence.' } },
          { id: 'iv-antibiotics', type: 'treatment', label: 'Pre-op IV Antibiotics', description: 'Cefoxitin or cefazolin + flagyl', cost: 75, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'lap-appendectomy', type: 'treatment', label: 'Laparoscopic Appendectomy', description: 'Standard of care', cost: 8000, timeRequired: 90, consequences: { patientStateChange: { status: 'improving' } } },
        ],
        requiredDecisionsToProgress: ['surgery-consult'],
      },
    ],
    
    branches: [
      { id: 'surgical_management', condition: 'Appropriate imaging, early surgery consult, appendectomy', description: 'Standard appendicitis care', patientOutcome: 'good', feedbackMessage: 'Excellent! Used Alvarado score, appropriate imaging, ruled out pregnancy and UTI, early surgical consult, and definitive management.' },
      { id: 'delayed-surgery', condition: 'Delayed imaging or surgery >24 hours', description: 'Perforated appendix', patientOutcome: 'poor', feedbackMessage: 'Appendix perforated! 24+ hours of symptoms increases perforation risk. Earlier intervention needed.' },
      { id: 'missed-ectopic', condition: 'Did not check pregnancy test', description: 'Ruptured ectopic', patientOutcome: 'critical', feedbackMessage: 'CRITICAL: Always check beta-hCG in reproductive-age females with abdominal pain! Ectopic pregnancy can mimic appendicitis.' },
    ],
    
    optimalPath: { decisions: ['alvarado', 'exam', 'pregnancy-test', 'urinalysis', 'ultrasound', 'ct-abdomen', 'surgery-consult', 'iv-antibiotics', 'lap-appendectomy'], totalCost: 9270, totalTime: 450, outcome: 'good' },
    learningObjectives: ['Alvarado score calculation', 'Clinical decision rules', 'Imaging selection in pregnancy', 'Always rule out ectopic', 'Appendicitis management algorithm'],
  },

  // CASE 12: ATRIAL FIBRILLATION
  {
    id: 'sim-012',
    title: 'Atrial Fibrillation: Rate vs Rhythm Control',
    specialty: 'cardiology',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    description: '68-year-old with new AF. Decide on rate vs rhythm control and anticoagulation.',
    hasTimeLimit: false,
    complexityScore: 7.0,
    prerequisites: ['ECG interpretation', 'CHA2DS2-VASc knowledge'],
    
    initialPresentation: '68M with palpitations, irregular heartbeat. HR 140, irregularly irregular. BP 130/85. New onset AF.',
    
    initialPatientState: {
      status: 'stable',
      vitalSigns: { bloodPressure: '130/85', heartRate: 140, respiratoryRate: 18, temperature: 36.8, oxygenSaturation: 97 },
      symptoms: ['Palpitations', 'Mild dyspnea', 'Fatigue'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Assessment and Risk Stratification',
        description: 'Determine stroke risk and symptom severity',
        availableDecisions: [
          { id: 'cha2ds2', type: 'test', label: 'Calculate CHA2DS2-VASc', description: 'Stroke risk score', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'CHA2DS2-VASc = 4 (age 65-74, hypertension). High stroke risk.' } },
          { id: 'has-bled', type: 'test', label: 'Calculate HAS-BLED', description: 'Bleeding risk', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'HAS-BLED = 2 (hypertension, age >65). Moderate bleeding risk.' } },
          { id: 'echo', type: 'test', label: 'Transthoracic Echo', description: 'Assess structure and function', cost: 350, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'EF 55%, mild LA enlargement, no valvular disease.' } },
          { id: 'tsh', type: 'test', label: 'TSH', description: 'Rule out hyperthyroidism', cost: 45, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'TSH normal. Not thyroid-induced.' } },
          { id: 'anticoagulation', type: 'treatment', label: 'Start Anticoagulation', description: 'Apixaban 5mg BID', cost: 450, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Started on DOAC for stroke prevention.' } },
          { id: 'aspirin', type: 'treatment', label: 'Aspirin Only', description: 'Inadequate stroke prevention', cost: 5, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Aspirin inadequate for stroke prevention in AF!' } },
        ],
        requiredDecisionsToProgress: ['cha2ds2'],
      },
      {
        id: 'stage-2',
        name: 'Rate vs Rhythm Control',
        description: 'Determine management strategy',
        availableDecisions: [
          { id: 'rate-control', type: 'treatment', label: 'Rate Control Strategy', description: 'Beta-blocker or calcium channel blocker', cost: 50, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '130/85', heartRate: 85, respiratoryRate: 18, temperature: 36.8, oxygenSaturation: 97 } } } },
          { id: 'cardioversion', type: 'treatment', label: 'Electrical Cardioversion', description: 'Synchronized shock', cost: 500, timeRequired: 30, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '130/85', heartRate: 72, respiratoryRate: 18, temperature: 36.8, oxygenSaturation: 97 } }, newInformationRevealed: 'Restored sinus rhythm. Must anticoagulate for 3 weeks before or 4 weeks after if >48 hours.' } },
          { id: 'tee-cardioversion', type: 'test', label: 'TEE-Guided Cardioversion', description: 'Rule out clot first', cost: 800, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'No LA appendage thrombus. Safe to cardiovert.' } },
          { id: 'amiodarone', type: 'treatment', label: 'Amiodarone Load', description: 'Chemical cardioversion', cost: 200, timeRequired: 60, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '130/85', heartRate: 78, respiratoryRate: 18, temperature: 36.8, oxygenSaturation: 97 } } } },
          { id: 'anticoag-duration', type: 'question', label: 'Anticoagulation Duration', description: 'Long-term vs time-limited', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'With CHA2DS2-VASc ≥2, anticoagulation is lifelong.' } },
        ],
        requiredDecisionsToProgress: ['anticoagulation'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Risk stratified, anticoagulated, appropriate rate/rhythm control', description: 'Evidence-based AF management', patientOutcome: 'good', feedbackMessage: 'Excellent! Risk stratified with CHA2DS2-VASc, initiated appropriate anticoagulation, and chose evidence-based rate control strategy. Stroke prevention is paramount.' },
      { id: 'stroke', condition: 'Did not anticoagulate despite high CHA2DS2-VASc', description: 'Ischemic stroke', patientOutcome: 'critical', feedbackMessage: 'STROKE! With CHA2DS2-VASc of 4, stroke risk is ~4% per year without anticoagulation. Anticoagulation reduces risk by 60-70%.' },
      { id: 'bleeding', condition: 'Anticoagulated without assessing bleeding risk', description: 'GI bleed', patientOutcome: 'poor', feedbackMessage: 'GI bleed occurred. Always assess bleeding risk with HAS-BLED and address modifiable risk factors before starting anticoagulation.' },
    ],
    
    optimalPath: { decisions: ['cha2ds2', 'has-bled', 'echo', 'tsh', 'anticoagulation', 'rate-control', 'anticoag-duration'], totalCost: 895, totalTime: 240, outcome: 'good' },
    learningObjectives: ['CHA2DS2-VASc calculation', 'HAS-BLED bleeding risk', 'Rate vs rhythm control indications', 'Anticoagulation in AF', 'Cardioversion anticoagulation requirements'],
  },

  // CASE 13: SYNCOPE AND BRADYCARDIA
  {
    id: 'sim-013',
    title: 'Syncope and Bradycardia: Pacemaker Decision',
    specialty: 'cardiology',
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    description: '72-year-old with syncope and bradycardia. Determine if pacemaker is indicated.',
    hasTimeLimit: false,
    complexityScore: 6.5,
    prerequisites: ['ECG interpretation', 'Syncope workup'],
    
    initialPresentation: '72F with 2 episodes of syncope in past week. HR 42, BP 110/70. No CP or SOB. Otherwise healthy.',
    
    initialPatientState: {
      status: 'stable',
      vitalSigns: { bloodPressure: '110/70', heartRate: 42, respiratoryRate: 16, temperature: 36.6, oxygenSaturation: 98 },
      symptoms: ['Presyncope', 'Fatigue', 'Lightheadedness'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Diagnostic Workup',
        description: 'Determine cause of syncope',
        availableDecisions: [
          { id: 'ecg', type: 'test', label: '12-lead ECG', description: 'Rhythm analysis', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Sinus bradycardia 42 bpm with first degree AV block (PR 220ms). No BBB.' } },
          { id: 'orthostatics', type: 'test', label: 'Orthostatic Vitals', description: 'Volume status', cost: 0, timeRequired: 10, consequences: { patientStateChange: {}, newInformationRevealed: 'No significant orthostatic change. Not orthostatic hypotension.' } },
          { id: 'echo', type: 'test', label: 'Echocardiogram', description: 'Structural heart disease', cost: 350, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'EF 60%, normal valves, no LVH.' } },
          { id: 'troponin', type: 'test', label: 'Troponin', description: 'Rule out ACS', cost: 75, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'Troponin negative.' } },
          { id: 'orthostatic-bp', type: 'observation', label: 'Assess Orthostatic Symptoms', description: 'Relation to position', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Syncope not related to position change.' } },
          { id: 'med-review', type: 'question', label: 'Medication Review', description: 'Bradycardic medications', cost: 0, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'On metoprolol 50mg BID for HTN. Beta-blocker contributing to bradycardia.' } },
        ],
        requiredDecisionsToProgress: ['ecg', 'orthostatics'],
      },
      {
        id: 'stage-2',
        name: 'Management Decision',
        description: 'Pacemaker or conservative',
        availableDecisions: [
          { id: 'hold-beta-blocker', type: 'treatment', label: 'Hold Beta-Blocker', description: 'Remove offending agent', cost: 0, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '110/70', heartRate: 52, respiratoryRate: 16, temperature: 36.6, oxygenSaturation: 98 } }, newInformationRevealed: 'HR improved to 52. May not need pacemaker.' } },
          { id: 'monitor', type: 'test', label: 'Holter Monitor', description: 'Document correlation', cost: 200, timeRequired: 1440, consequences: { patientStateChange: {}, newInformationRevealed: 'Asymptomatic bradycardia on monitor. No correlation with symptoms.' } },
          { id: 'tilt-table', type: 'test', label: 'Tilt Table Test', description: 'Vasovagal syncope', cost: 450, timeRequired: 120, consequences: { patientStateChange: {}, newInformationRevealed: 'Negative tilt table.' } },
          { id: 'pacemaker-consult', type: 'consultation', label: 'Electrophysiology Consult', description: 'For pacemaker evaluation', cost: 0, timeRequired: 60, consequences: { patientStateChange: {}, triggersBranch: 'pacemaker_decision' } },
          { id: 'dual-chamber-pacemaker', type: 'treatment', label: 'Dual-Chamber Pacemaker', description: 'Definitive treatment', cost: 15000, timeRequired: 120, consequences: { patientStateChange: { status: 'improving', vitalSigns: { bloodPressure: '110/70', heartRate: 70, respiratoryRate: 16, temperature: 36.6, oxygenSaturation: 98 } } } },
          { id: 'carotid-massage', type: 'test', label: 'Carotid Sinus Massage', description: 'CSS evaluation', cost: 0, timeRequired: 10, consequences: { patientStateChange: {}, newInformationRevealed: 'No significant pause. Carotid sinus hypersensitivity unlikely.' } },
        ],
        requiredDecisionsToProgress: ['hold-beta-blocker'],
      },
    ],
    
    branches: [
      { id: 'pacemaker_decision', condition: 'Symptomatic bradycardia after reversible causes excluded', description: 'Class I indication for pacemaker', patientOutcome: 'good', feedbackMessage: 'Correct! With symptomatic bradycardia (syncope) after reversible causes excluded (beta-blocker held), pacemaker is Class I indication. Patient symptom-free after implantation.' },
      { id: 'missed-diagnosis', condition: 'Did not stop beta-blocker before deciding on pacemaker', description: 'Unnecessary pacemaker', patientOutcome: 'neutral', feedbackMessage: 'Pacemaker may have been unnecessary. Always rule out reversible causes (medications, electrolytes) before permanent pacemaker implantation.' },
      { id: 'recurrent-syncope', condition: 'Discharged without addressing bradycardia', description: 'Recurrent syncope and injury', patientOutcome: 'poor', feedbackMessage: 'Patient had recurrent syncope and hip fracture. Symptomatic bradycardia with syncope requires intervention.' },
    ],
    
    optimalPath: { decisions: ['ecg', 'orthostatics', 'med-review', 'echo', 'hold-beta-blocker', 'monitor', 'pacemaker-consult', 'dual-chamber-pacemaker'], totalCost: 15550, totalTime: 1800, outcome: 'good' },
    learningObjectives: ['Syncope differential diagnosis', 'Bradycardia workup', 'Reversible causes of bradycardia', 'Pacemaker indications', 'Medication review importance'],
  },

  // CASE 14: HIV OPPORTUNISTIC INFECTION
  {
    id: 'sim-014',
    title: 'HIV: Pneumocystis Pneumonia and ART Timing',
    specialty: 'infectious-disease',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    description: '34-year-old with HIV and PCP. Navigate diagnosis and timing of antiretroviral therapy.',
    hasTimeLimit: false,
    complexityScore: 8.5,
    prerequisites: ['HIV/AIDS management', 'Opportunistic infections'],
    
    initialPresentation: '34M with 2 weeks progressive dyspnea, dry cough, fever. CD4 unknown. SpO2 88% on RA.',
    
    initialPatientState: {
      status: 'declining',
      vitalSigns: { bloodPressure: '110/70', heartRate: 110, respiratoryRate: 28, temperature: 38.5, oxygenSaturation: 88 },
      symptoms: ['Severe dyspnea', 'Dry cough', 'Fever', 'Fatigue', 'Weight loss'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Diagnosis',
        description: 'Identify opportunistic infection',
        availableDecisions: [
          { id: 'hiv-test', type: 'test', label: 'HIV Test', description: 'Confirm HIV status', cost: 50, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'HIV positive. Patient unaware of status.' } },
          { id: 'cd4-count', type: 'test', label: 'CD4 Count', description: 'Immune status', cost: 150, timeRequired: 120, consequences: { patientStateChange: {}, newInformationRevealed: 'CD4 45 cells/mcL (AIDS-defining).' } },
          { id: 'viral-load', type: 'test', label: 'HIV Viral Load', description: 'Disease activity', cost: 200, timeRequired: 120, consequences: { patientStateChange: {}, newInformationRevealed: 'Viral load 250,000 copies/mL.' } },
          { id: 'ldh', type: 'test', label: 'LDH', description: 'PCP marker', cost: 35, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'LDH 450 (elevated).' } },
          { id: 'cxr', type: 'test', label: 'Chest X-ray', description: 'Infiltrate pattern', cost: 50, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Diffuse bilateral interstitial infiltrates.' } },
          { id: 'ct-chest', type: 'test', label: 'CT Chest', description: 'Ground glass opacities', cost: 600, timeRequired: 45, consequences: { patientStateChange: {}, newInformationRevealed: 'Diffuse ground glass opacities. Classic for PCP.' } },
          { id: 'induced-sputum', type: 'test', label: 'Induced Sputum for PCP', description: 'Microscopic exam', cost: 200, timeRequired: 240, consequences: { patientStateChange: {}, newInformationRevealed: 'Positive for Pneumocystis jirovecii cysts.' } },
          { id: 'balf', type: 'procedure', label: 'Bronchoscopy with BAL', description: 'Definitive diagnosis', cost: 2500, timeRequired: 120, consequences: { patientStateChange: {}, newInformationRevealed: 'BAL positive for PCP.' } },
          { id: 'abg', type: 'test', label: 'ABG', description: 'Hypoxemia assessment', cost: 75, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'PaO2 58 mmHg, A-a gradient 45. Severe PCP.' } },
        ],
        requiredDecisionsToProgress: ['hiv-test', 'cd4-count'],
      },
      {
        id: 'stage-2',
        name: 'Treatment Strategy',
        description: 'Treat PCP and decide on ART timing',
        availableDecisions: [
          { id: 'tmp-smx', type: 'treatment', label: 'TMP-SMX (Bactrim)', description: 'First-line for PCP', cost: 150, timeRequired: 15, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'steroids', type: 'treatment', label: 'Prednisone', description: 'If PaO2 <70 or A-a >35', cost: 25, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '110/70', heartRate: 110, respiratoryRate: 28, temperature: 38.5, oxygenSaturation: 92 } } } },
          { id: 'immediate-art', type: 'treatment', label: 'Start ART Immediately', description: 'Within 2 weeks of OI', cost: 2000, timeRequired: 30, consequences: { patientStateChange: { status: 'critical' }, newInformationRevealed: 'IRIS (Immune Reconstitution Inflammatory Syndrome) triggered! Worsening respiratory status.' } },
          { id: 'delayed-art', type: 'treatment', label: 'Delay ART 2 Weeks', description: 'Treat OI first', cost: 0, timeRequired: 0, consequences: { patientStateChange: {}, newInformationRevealed: 'Correct approach! Start ART after 2 weeks of OI treatment to reduce IRIS risk.' } },
          { id: 'pentamidine', type: 'treatment', label: 'IV Pentamidine', description: 'If TMP-SMX failure', cost: 800, timeRequired: 60, consequences: { patientStateChange: {} } },
          { id: 'pcp-prophylaxis', type: 'treatment', label: 'Start PCP Prophylaxis', description: 'TMP-SMX SS daily', cost: 50, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Will continue until CD4 >200 for 3 months.' } },
          { id: 'id-consult', type: 'consultation', label: 'ID Consult', description: 'For complex HIV management', cost: 0, timeRequired: 60, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['tmp-smx', 'steroids'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Correctly diagnosed PCP, started TMP-SMX + steroids, delayed ART 2 weeks', description: 'Optimal PCP and HIV management', patientOutcome: 'good', feedbackMessage: 'Excellent! Correctly diagnosed PCP in AIDS patient, initiated appropriate therapy with steroids for severe disease, and appropriately delayed ART to prevent IRIS. Guidelines recommend starting ART within 2 weeks of OI treatment, not immediately.' },
      { id: 'iris', condition: 'Started ART too early', description: 'IRIS with respiratory failure', patientOutcome: 'critical', feedbackMessage: 'IRIS! Starting ART immediately in acute OI can trigger immune reconstitution inflammatory syndrome. Wait 2 weeks after starting OI treatment.' },
      { id: 'missed-pcp', condition: 'Did not consider PCP in young patient with diffuse infiltrates', description: 'Progressive respiratory failure', patientOutcome: 'poor', feedbackMessage: 'Missed diagnosis! In young patient with diffuse infiltrates and low CD4, always consider PCP. Early treatment is critical.' },
    ],
    
    optimalPath: { decisions: ['hiv-test', 'cd4-count', 'viral-load', 'ldh', 'cxr', 'ct-chest', 'abg', 'induced-sputum', 'tmp-smx', 'steroids', 'delayed-art', 'pcp-prophylaxis', 'id-consult'], totalCost: 4140, totalTime: 855, outcome: 'good' },
    learningObjectives: ['PCP diagnosis (diffuse infiltrates + low CD4)', 'PCP treatment (TMP-SMX + steroids)', 'ART timing in acute OI', 'IRIS prevention', 'PCP prophylaxis criteria'],
  },

  // CASE 15: STATUS EPILEPTICUS
  {
    id: 'sim-015',
    title: 'Status Epilepticus: Benzodiazepine Protocol',
    specialty: 'emergency',
    difficulty: 'advanced',
    estimatedMinutes: 15,
    description: '35-year-old in convulsive status epilepticus. Time-critical management protocol.',
    hasTimeLimit: true,
    timeLimitSeconds: 900,
    complexityScore: 8.0,
    prerequisites: ['Seizure management', 'Airway management'],
    
    initialPresentation: '35M witnessed tonic-clonic seizure lasting >10 minutes. No response to bystander intervention.',
    
    initialPatientState: {
      status: 'critical',
      vitalSigns: { bloodPressure: '150/95', heartRate: 135, respiratoryRate: 30, temperature: 38.2, oxygenSaturation: 88 },
      symptoms: ['Ongoing seizure activity', 'Tongue laceration', 'Urinary incontinence'],
      timeElapsed: 0,
    },
    
    stages: [
      {
        id: 'stage-1',
        name: 'Immediate Stabilization',
        description: 'Stop seizure and protect airway',
        criticalWindow: 300,
        availableDecisions: [
          { id: 'abc', type: 'observation', label: 'Assess ABCs', description: 'Airway protection', cost: 0, timeRequired: 30, consequences: { patientStateChange: {}, newInformationRevealed: 'Airway compromised. Ongoing seizure. Need immediate intervention.' } },
          { id: 'lorazepam', type: 'treatment', label: 'Lorazepam 4mg IV', description: 'First-line benzodiazepine', cost: 25, timeRequired: 30, consequences: { patientStateChange: { status: 'stable', vitalSigns: { bloodPressure: '150/95', heartRate: 110, respiratoryRate: 30, temperature: 38.2, oxygenSaturation: 88 } } } },
          { id: 'lorazepam-repeat', type: 'treatment', label: 'Lorazepam 4mg IV Repeat', description: 'If seizure continues', cost: 25, timeRequired: 30, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'midazolam', type: 'treatment', label: 'Midazolam 10mg IM', description: 'If no IV access', cost: 30, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'IM midazolam effective when IV difficult.' } },
          { id: 'oxygen', type: 'treatment', label: 'Supplemental O2', description: 'Nasal cannula or mask', cost: 5, timeRequired: 15, consequences: { patientStateChange: { vitalSigns: { bloodPressure: '150/95', heartRate: 135, respiratoryRate: 30, temperature: 38.2, oxygenSaturation: 94 } } } },
          { id: 'glucose', type: 'test', label: 'Point-of-Care Glucose', description: 'Rule out hypoglycemia', cost: 5, timeRequired: 15, consequences: { patientStateChange: {}, newInformationRevealed: 'Glucose 98. Not hypoglycemic.' } },
          { id: 'thiamine', type: 'treatment', label: 'Thiamine 100mg IV', description: 'Before dextrose if malnourished', cost: 15, timeRequired: 15, consequences: { patientStateChange: {} } },
          { id: 'positioning', type: 'treatment', label: 'Lateral Decubitus', description: 'Prevent aspiration', cost: 0, timeRequired: 15, consequences: { patientStateChange: {} } },
        ],
        requiredDecisionsToProgress: ['lorazepam'],
      },
      {
        id: 'stage-2',
        name: 'Refractory Status',
        description: 'Second and third-line agents',
        criticalWindow: 600,
        availableDecisions: [
          { id: 'phenytoin', type: 'treatment', label: 'Fosphenytoin 20mg PE/kg', description: 'Second-line anticonvulsant', cost: 400, timeRequired: 45, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'valproate', type: 'treatment', label: 'Valproic Acid 40mg/kg', description: 'Alternative second-line', cost: 300, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'levetiracetam', type: 'treatment', label: 'Levetiracetam 60mg/kg', description: 'Alternative second-line', cost: 250, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'intubation', type: 'procedure', label: 'Endotracheal Intubation', description: 'Protect airway', cost: 500, timeRequired: 120, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'propofol', type: 'treatment', label: 'Propofol Infusion', description: 'For refractory SE', cost: 800, timeRequired: 30, consequences: { patientStateChange: { status: 'stable' } } },
          { id: 'midazolam-infusion', type: 'treatment', label: 'Midazolam Infusion', description: 'Alternative to propofol', cost: 600, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'phenobarbital', type: 'treatment', label: 'Phenobarbital 20mg/kg', description: 'Third-line', cost: 150, timeRequired: 30, consequences: { patientStateChange: {} } },
          { id: 'eeg', type: 'test', label: 'Continuous EEG', description: 'Monitor for non-convulsive SE', cost: 1500, timeRequired: 60, consequences: { patientStateChange: {}, newInformationRevealed: 'Burst suppression achieved.' } },
        ],
        requiredDecisionsToProgress: ['phenytoin'],
      },
    ],
    
    branches: [
      { id: 'optimal', condition: 'Rapid benzodiazepines, appropriate second-line, airway protection', description: 'Evidence-based status management', patientOutcome: 'good', feedbackMessage: 'Excellent! Rapid lorazepam administration, appropriate second-line anticonvulsant, airway protection when needed. Time is brain - every minute of seizure activity increases morbidity.' },
      { id: 'delayed-benzos', condition: 'Delayed benzodiazepine administration >15 minutes', description: 'Refractory status', patientOutcome: 'poor', feedbackMessage: 'Refractory status! Benzodiazepines must be given rapidly and repeatedly. Delay leads to harder-to-treat seizures and worse outcomes.' },
      { id: 'aspiration', condition: 'Did not protect airway or place in lateral position', description: 'Aspiration pneumonia', patientOutcome: 'critical', feedbackMessage: 'Aspiration! Status epilepticus patients are at high risk for aspiration. Airway protection and lateral positioning are critical.' },
    ],
    
    optimalPath: { decisions: ['abc', 'glucose', 'oxygen', 'positioning', 'lorazepam', 'lorazepam-repeat', 'thiamine', 'phenytoin', 'intubation', 'propofol', 'eeg'], totalCost: 4330, totalTime: 450, outcome: 'good' },
    learningObjectives: ['Status epilepticus definition (>5 min)', 'Benzodiazepine first-line protocol', 'Second-line anticonvulsants', 'Airway protection importance', 'Time-critical nature'],
  },
];
