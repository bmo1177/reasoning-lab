import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Specialty, Difficulty } from '@/types/case';
import { specialtyLabels, difficultyLabels } from '@/data/sampleCases';
import { cn } from '@/lib/utils';

interface CaseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSpecialty: Specialty | 'all';
  onSpecialtyChange: (specialty: Specialty | 'all') => void;
  selectedDifficulty: Difficulty | 'all';
  onDifficultyChange: (difficulty: Difficulty | 'all') => void;
}

const specialties: (Specialty | 'all')[] = [
  'all',
  'cardiology',
  'pulmonology',
  'gastroenterology',
  'neurology',
  'endocrinology',
  'infectious-disease',
];

const difficulties: (Difficulty | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced'];

export function CaseFilters({
  searchQuery,
  onSearchChange,
  selectedSpecialty,
  onSpecialtyChange,
  selectedDifficulty,
  onDifficultyChange,
}: CaseFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Specialty filters */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Specialty</h4>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty) => (
            <Button
              key={specialty}
              variant={selectedSpecialty === specialty ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSpecialtyChange(specialty)}
              className={cn(
                'text-xs',
                selectedSpecialty === specialty && 'bg-primary text-primary-foreground'
              )}
            >
              {specialty === 'all' ? 'All Specialties' : specialtyLabels[specialty]}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulty filters */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Difficulty</h4>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDifficultyChange(difficulty)}
              className="text-xs"
            >
              {difficulty === 'all' ? 'All Levels' : difficultyLabels[difficulty]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
