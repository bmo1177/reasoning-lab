import { useState } from 'react';
import { ErrorCase, CognitiveBias } from '@/types/errorCase';
import { toast } from 'sonner';
import { generateGeminiContent, parseJSONResponse } from '@/services/geminiService';

interface UseGenerateErrorCaseReturn {
  generateErrorCase: (
    specialty: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    targetBiases?: CognitiveBias[]
  ) => Promise<ErrorCase | null>;
  isGenerating: boolean;
  error: string | null;
}

const SYSTEM_PROMPT = `You are an expert medical educator creating error-based learning scenarios for medical students.
Generate a realistic clinical error case that teaches diagnostic reasoning by showing what went wrong.

The case should be structured with the following JSON format:
{
  "id": "error-ai-<timestamp>",
  "title": "Short descriptive title",
  "specialty": "<specialty>",
  "difficulty": "<difficulty>",
  "estimatedMinutes": <15-30>,
  
  "scenario": {
    "patientAge": <number>,
    "patientSex": "male" | "female",
    "presentation": "Detailed patient presentation (2-3 paragraphs)",
    "initialWorkup": "What the clinician did initially",
    "clinicianThinking": "The flawed reasoning process"
  },
  
  "error": {
    "initialDiagnosis": "What was diagnosed incorrectly",
    "missedDiagnosis": "What should have been diagnosed",
    "outcome": "What happened as a result (be realistic, not always catastrophic)",
    "errorSummary": "One sentence summary of the core error"
  },
  
  "analysis": {
    "cognitiveBiases": ["anchoring-bias", "premature-closure", ...],
    "biasExplanations": {
      "anchoring-bias": "How this bias manifested in this case",
      ...
    },
    "missedRedFlags": [
      {
        "id": "rf-1",
        "description": "Red flag that was missed",
        "significance": "critical" | "important" | "minor",
        "hint": "Optional hint for students"
      }
    ],
    "missedQuestions": [
      {
        "id": "mq-1",
        "question": "Question that should have been asked",
        "importance": "Why this question matters",
        "expectedAnswer": "What the answer would have revealed"
      }
    ],
    "flawedReasoningSteps": [
      {
        "nodeId": "step-1",
        "description": "The reasoning step that was flawed",
        "whatWentWrong": "Explanation of the flaw",
        "correctApproach": "What should have been done"
      }
    ]
  },
  
  "correctApproach": {
    "keyDifferentials": ["List of diagnoses that should have been considered"],
    "criticalTests": ["Tests that should have been ordered"],
    "reasoningPath": "Step-by-step correct reasoning"
  },
  
  "reflectionPrompts": [
    "Thoughtful questions for student reflection (4-5 prompts)"
  ]
}

Valid cognitive biases to include:
- anchoring-bias: Fixating on initial information
- availability-heuristic: Overweighting recent or memorable cases
- confirmation-bias: Seeking info that confirms initial hypothesis
- premature-closure: Stopping investigation too early
- diagnosis-momentum: Accepting previous diagnosis without questioning
- gender-bias: Different treatment based on gender
- age-bias: Different treatment based on age
- overconfidence: Being too certain in diagnosis
- representativeness-heuristic: Expecting "typical" presentations
- base-rate-neglect: Ignoring prevalence in population

Make the case medically accurate and educational. Include 2-4 cognitive biases, 3-5 missed red flags, 3-4 missed questions, and 2-3 flawed reasoning steps.`;

export function useGenerateErrorCase(): UseGenerateErrorCaseReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateErrorCase = async (
    specialty: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    targetBiases?: CognitiveBias[]
  ): Promise<ErrorCase | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      let userPrompt = `Generate a ${difficulty} level error-based learning case in ${specialty}.`;
      if (targetBiases && targetBiases.length > 0) {
        userPrompt += ` Design the case to specifically demonstrate these cognitive biases: ${targetBiases.join(', ')}.`;
      }
      userPrompt += ` Return ONLY valid JSON, no markdown or explanations.`;

      const content = await generateGeminiContent(SYSTEM_PROMPT, userPrompt);
      const caseData = parseJSONResponse<ErrorCase>(content);

      if (!caseData.id || caseData.id.includes("<timestamp>")) {
        caseData.id = `error-ai-${Date.now()}`;
      }

      toast.success('Error case generated successfully!');
      return caseData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate error case';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateErrorCase, isGenerating, error };
}
