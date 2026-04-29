import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SocraticPromptProps {
  caseContext: {
    specialty: string;
    presentation: string;
    currentDiagnoses: string[];
  };
  currentNodes: Array<{ type: string; label: string }>;
  currentConnections: number;
  testsOrdered: string[];
}

interface PromptData {
  question: string;
  category: 'hypothesis' | 'evidence' | 'alternatives' | 'uncertainty' | 'next-steps';
}

const categoryStyles: Record<string, string> = {
  hypothesis: 'border-node-diagnosis/50 bg-node-diagnosis/5',
  evidence: 'border-node-finding/50 bg-node-finding/5',
  alternatives: 'border-supports-weak/50 bg-supports-weak/5',
  uncertainty: 'border-contradicts/50 bg-contradicts/5',
  'next-steps': 'border-node-test/50 bg-node-test/5',
};

const categoryLabels: Record<string, string> = {
  hypothesis: 'Hypothesis',
  evidence: 'Evidence',
  alternatives: 'Alternatives',
  uncertainty: 'Uncertainty',
  'next-steps': 'Next Steps',
};

export function SocraticPrompt({
  caseContext,
  currentNodes,
  currentConnections,
  testsOrdered,
}: SocraticPromptProps) {
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastNodeCount, setLastNodeCount] = useState(0);

  // Trigger prompt when significant canvas changes happen
  useEffect(() => {
    const nodeCount = currentNodes.length;
    const shouldTrigger =
      !isDismissed &&
      !prompt &&
      !isLoading &&
      nodeCount > 0 &&
      (nodeCount >= 3 && nodeCount !== lastNodeCount && nodeCount % 3 === 0);

    if (shouldTrigger) {
      fetchPrompt();
      setLastNodeCount(nodeCount);
    }
  }, [currentNodes.length, isDismissed, prompt, isLoading, lastNodeCount]);

  const fetchPrompt = async () => {
    setIsLoading(true);
    try {
      const { generateGeminiContent, parseJSONResponse } = await import('@/services/geminiService');

      const systemPrompt = `You are a Socratic medical educator helping students develop metacognitive skills.
Based on the student's current reasoning map, generate a thoughtful question that:
- Encourages deeper thinking without giving away answers
- Challenges assumptions appropriately
- Promotes consideration of alternatives
- Is specific to their current reasoning state

Return a JSON object with:
{
  "question": "Your Socratic question",
  "category": "hypothesis" | "evidence" | "alternatives" | "uncertainty" | "next-steps",
  "explanation": "Brief internal note on why this question is valuable (not shown to student)"
}`;

      const diagnosisNodes = currentNodes.filter((n) => n.type === "diagnosis");
      const symptomNodes = currentNodes.filter((n) => n.type === "symptom");

      const userPrompt = `Case context:
Specialty: ${caseContext.specialty}
Presentation: ${caseContext.presentation}

Student's current reasoning:
- Symptoms/findings identified: ${symptomNodes.map((n) => n.label).join(", ") || "None yet"}
- Diagnoses being considered: ${diagnosisNodes.map((n) => n.label).join(", ") || "None yet"}
- Number of connections drawn: ${currentConnections}
- Tests ordered: ${testsOrdered.join(", ") || "None yet"}

Generate an appropriate Socratic question for this stage of reasoning. Return only valid JSON.`;

      const content = await generateGeminiContent(systemPrompt, userPrompt);
      const data = parseJSONResponse(content);
      
      setPrompt(data);
    } catch (err) {
      console.error('Failed to fetch Socratic prompt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setPrompt(null);
  };

  const handleRefresh = () => {
    setPrompt(null);
    fetchPrompt();
  };

  const handleShow = () => {
    setIsDismissed(false);
    fetchPrompt();
  };

  if (isDismissed && !prompt) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-2 z-30"
        onClick={handleShow}
      >
        <Lightbulb className="h-4 w-4" />
        Show Prompts
      </Button>
    );
  }

  return (
    <AnimatePresence>
      {(prompt || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%]"
        >
          <Card
            className={cn(
              'border-2 shadow-lg',
              prompt ? categoryStyles[prompt.category] : 'border-primary/30 bg-primary/5'
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Thinking of a question...
                    </p>
                  ) : prompt ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {categoryLabels[prompt.category]}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        {prompt.question}
                      </p>
                    </>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleDismiss}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
