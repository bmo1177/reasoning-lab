import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Brain } from 'lucide-react';
import { useGenerateErrorCase } from '@/hooks/useGenerateErrorCase';
import { CognitiveBias } from '@/types/errorCase';

const specialties = [
  { value: 'emergency', label: 'Emergency Medicine' },
  { value: 'internal-medicine', label: 'Internal Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pulmonology', label: 'Pulmonology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'surgery', label: 'Surgery' },
];

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const biasOptions: { value: CognitiveBias; label: string }[] = [
  { value: 'anchoring-bias', label: 'Anchoring Bias' },
  { value: 'availability-heuristic', label: 'Availability Heuristic' },
  { value: 'confirmation-bias', label: 'Confirmation Bias' },
  { value: 'premature-closure', label: 'Premature Closure' },
  { value: 'diagnosis-momentum', label: 'Diagnosis Momentum' },
  { value: 'gender-bias', label: 'Gender Bias' },
  { value: 'overconfidence', label: 'Overconfidence' },
];

interface ErrorCaseGeneratorProps {
  onCaseGenerated: (caseId: string) => void;
}

export function ErrorCaseGenerator({ onCaseGenerated }: ErrorCaseGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [specialty, setSpecialty] = useState('emergency');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [targetBiases, setTargetBiases] = useState<CognitiveBias[]>([]);
  
  const { generateErrorCase, isGenerating } = useGenerateErrorCase();

  const toggleBias = (bias: CognitiveBias) => {
    setTargetBiases(prev => 
      prev.includes(bias) ? prev.filter(b => b !== bias) : [...prev, bias]
    );
  };

  const handleGenerate = async () => {
    const newCase = await generateErrorCase(
      specialty,
      difficulty,
      targetBiases.length > 0 ? targetBiases : undefined
    );
    
    if (newCase) {
      // Store in session
      const stored = JSON.parse(sessionStorage.getItem('ai-error-cases') || '[]');
      stored.unshift(newCase);
      sessionStorage.setItem('ai-error-cases', JSON.stringify(stored));
      
      onCaseGenerated(newCase.id);
    }
  };

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Generate AI Error Case</CardTitle>
              <CardDescription>Create a custom error scenario with AI</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialty</label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Target Cognitive Biases (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {biasOptions.map(bias => (
                    <Badge
                      key={bias.value}
                      variant={targetBiases.includes(bias.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleBias(bias.value)}
                    >
                      {targetBiases.includes(bias.value) && '✓ '}
                      {bias.label}
                    </Badge>
                  ))}
                </div>
                {targetBiases.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    The case will specifically demonstrate these biases
                  </p>
                )}
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Error Case...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Error Case
                  </>
                )}
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
