import { useState } from 'react';
import { ClinicalCase, Specialty, Difficulty } from '@/types/case';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseGenerateCaseReturn {
  generateCase: (specialty: Specialty, difficulty: Difficulty, biasType?: string) => Promise<ClinicalCase | null>;
  isGenerating: boolean;
  error: string | null;
}

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
      const { data, error: functionError } = await supabase.functions.invoke('generate-case', {
        body: { specialty, difficulty, biasType },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('AI case generated successfully!');
      return data as ClinicalCase;
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
