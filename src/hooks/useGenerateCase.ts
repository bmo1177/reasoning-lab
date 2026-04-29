import { useState } from 'react';
import { ClinicalCase, Specialty, Difficulty } from '@/types/case';
import { toast } from 'sonner';
import { generateGeminiContent, parseJSONResponse } from '@/services/geminiService';

interface UseGenerateCaseReturn {
  generateCase: (specialty: Specialty, difficulty: Difficulty, biasType?: string) => Promise<ClinicalCase | null>;
  isGenerating: boolean;
  error: string | null;
}

const SYSTEM_PROMPT = `You are an expert medical educator creating clinical cases for medical students.
Generate a realistic, educational clinical case that teaches diagnostic reasoning.

The case should be structured with the following JSON format:
{
  "id": "ai-case-<timestamp>",
  "title": "Brief descriptive title",
  "specialty": "<specialty>",
  "difficulty": "<difficulty>",
  "estimatedMinutes": <15-30>,
  "description": "1-2 sentence overview of what the case teaches",
  "patient": {
    "age": <number>,
    "sex": "male" | "female",
    "chiefComplaint": "Patient's presenting complaint"
  },
  "presentation": "Detailed initial presentation (2-3 paragraphs)",
  "history": "Past medical history, medications, family and social history",
  "physicalExam": "Physical examination findings",
  "vitalSigns": {
    "bloodPressure": "systolic/diastolic",
    "heartRate": <bpm>,
    "respiratoryRate": <per minute>,
    "temperature": <celsius>,
    "oxygenSaturation": <percent>
  },
  "availableTests": [
    {
      "id": "unique-id",
      "name": "Test name",
      "category": "lab" | "imaging" | "procedure",
      "result": "Actual result values",
      "interpretation": "What this means"
    }
  ],
  "learningObjectives": ["What students should learn"],
  "potentialBiases": ["cognitive biases this case might trigger"],
  "expertReasoningMap": {
    "nodes": [
      {
        "id": "node-1",
        "type": "symptom" | "finding" | "diagnosis" | "test",
        "label": "Short label",
        "description": "Why this is relevant",
        "position": { "x": <number>, "y": <number> }
      }
    ],
    "connections": [
      {
        "id": "conn-1",
        "sourceId": "node-1",
        "targetId": "node-2",
        "type": "supports-strong" | "supports-weak" | "contradicts" | "neutral",
        "label": "Brief explanation"
      }
    ],
    "notes": []
  }
}

Make the case medically accurate and realistic. Include 4-6 diagnostic tests.
The expert reasoning map should have 8-12 nodes showing ideal clinical reasoning flow,
with 10-15 connections showing relationships.
Position nodes in a logical layout (symptoms on left, diagnoses on right).`;

export function useGenerateCase(): UseGenerateCaseReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCase = async (
    specialty: Specialty,
    difficulty: Difficulty,
    biasType?: string
  ): Promise<ClinicalCase | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      let userPrompt = `Generate a ${difficulty} level clinical case in ${specialty}.`;
      if (biasType) {
        userPrompt += ` Design the case to potentially trigger ${biasType} in the learner.`;
      }
      userPrompt += ` Return ONLY valid JSON, no markdown or explanations.`;

      const content = await generateGeminiContent(SYSTEM_PROMPT, userPrompt);
      const caseData = parseJSONResponse<ClinicalCase>(content);
      
      // Add timestamp-based ID if not present
      if (!caseData.id || caseData.id.includes("<timestamp>")) {
        caseData.id = `ai-case-${Date.now()}`;
      }

      toast.success('AI case generated successfully!');
      return caseData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate case';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCase, isGenerating, error };
}
