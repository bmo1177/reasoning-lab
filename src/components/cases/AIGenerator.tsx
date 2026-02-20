import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Specialty, Difficulty } from '@/types/case';
import { specialtyLabels, difficultyLabels } from '@/data/sampleCases';
import { Sparkles, Loader2 } from 'lucide-react';
import { useGenerateCase } from '@/hooks/useGenerateCase';
import { motion } from 'framer-motion';

interface AIGeneratorProps {
  onCaseGenerated: (caseId: string) => void;
}

const biasOptions = [
  { value: 'none', label: 'No specific bias' },
  { value: 'anchoring bias', label: 'Anchoring Bias' },
  { value: 'availability heuristic', label: 'Availability Heuristic' },
  { value: 'premature closure', label: 'Premature Closure' },
  { value: 'confirmation bias', label: 'Confirmation Bias' },
  { value: 'base rate neglect', label: 'Base Rate Neglect' },
];

const specialties: Specialty[] = [
  'cardiology',
  'pulmonology',
  'gastroenterology',
  'neurology',
  'endocrinology',
  'infectious-disease',
  'nephrology',
  'rheumatology',
  'emergency',
];

const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export function AIGenerator({ onCaseGenerated }: AIGeneratorProps) {
  const [specialty, setSpecialty] = useState<Specialty>('cardiology');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [biasType, setBiasType] = useState('none');
  const { generateCase, isGenerating } = useGenerateCase();

  const handleGenerate = async () => {
    const newCase = await generateCase(specialty, difficulty, biasType === 'none' ? undefined : biasType);
    if (newCase) {
      // Store the generated case in sessionStorage for use in the studio
      const storedCases = JSON.parse(sessionStorage.getItem('ai-generated-cases') || '[]');
      storedCases.push(newCase);
      sessionStorage.setItem('ai-generated-cases', JSON.stringify(storedCases));
      onCaseGenerated(newCase.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Case Generator
          </CardTitle>
          <CardDescription>
            Generate a unique clinical case tailored to your learning goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={specialty} onValueChange={(v) => setSpecialty(v as Specialty)}>
                <SelectTrigger id="specialty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s}>
                      {specialtyLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((d) => (
                    <SelectItem key={d} value={d}>
                      {difficultyLabels[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bias">Cognitive Bias Focus</Label>
              <Select value={biasType} onValueChange={setBiasType}>
                <SelectTrigger id="bias">
                  <SelectValue placeholder="Select a bias" />
                </SelectTrigger>
                <SelectContent>
                  {biasOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Case...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Case
              </>
            )}
          </Button>

          {isGenerating && (
            <p className="text-sm text-muted-foreground text-center">
              This may take 10-20 seconds...
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
