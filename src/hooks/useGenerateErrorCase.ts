import { useState } from 'react';
import { ErrorCase, CognitiveBias } from '@/types/errorCase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseGenerateErrorCaseReturn {
  generateErrorCase: (
    specialty: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    targetBiases?: CognitiveBias[]
  ) => Promise<ErrorCase | null>;
  isGenerating: boolean;
  error: string | null;
}

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
      const { data, error: functionError } = await supabase.functions.invoke('generate-error-case', {
        body: { specialty, difficulty, targetBiases },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Error case generated successfully!');
      return data as ErrorCase;
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
