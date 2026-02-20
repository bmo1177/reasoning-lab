import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { CaseCard } from '@/components/cases/CaseCard';
import { CaseFilters } from '@/components/cases/CaseFilters';
import { AIGenerator } from '@/components/cases/AIGenerator';
import { sampleCases } from '@/data/sampleCases';
import { Specialty, Difficulty, ClinicalCase } from '@/types/case';
import { Separator } from '@/components/ui/separator';

export default function CaseLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');

  // Get AI-generated cases from sessionStorage
  const aiGeneratedCases: ClinicalCase[] = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ai-generated-cases') || '[]');
    } catch {
      return [];
    }
  }, []);

  const allCases = useMemo(() => {
    return [...aiGeneratedCases, ...sampleCases];
  }, [aiGeneratedCases]);

  const filteredCases = useMemo(() => {
    return allCases.filter((clinicalCase) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        clinicalCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinicalCase.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinicalCase.patient.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());

      // Specialty filter
      const matchesSpecialty = selectedSpecialty === 'all' || 
        clinicalCase.specialty === selectedSpecialty;

      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === 'all' || 
        clinicalCase.difficulty === selectedDifficulty;

      return matchesSearch && matchesSpecialty && matchesDifficulty;
    });
  }, [searchQuery, selectedSpecialty, selectedDifficulty, allCases]);

  const handleCaseGenerated = (caseId: string) => {
    navigate(`/studio/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
        <main className="container py-4 md:py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Case Library</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
              Select a clinical case to practice your diagnostic reasoning skills.
            </p>
          </div>

          {/* AI Generator */}
          <div className="mb-8">
            <AIGenerator onCaseGenerated={handleCaseGenerated} />
          </div>

          <Separator className="my-8" />

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-[280px_1fr]">
            {/* Filters sidebar */}
            <aside className="space-y-6">
              <CaseFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedSpecialty={selectedSpecialty}
                onSpecialtyChange={setSelectedSpecialty}
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
              />
            </aside>

            {/* Case grid */}
            <div>
              {filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <p className="text-muted-foreground">No cases match your filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('all');
                      setSelectedDifficulty('all');
                    }}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredCases.map((clinicalCase, index) => (
                    <CaseCard
                      key={clinicalCase.id}
                      clinicalCase={clinicalCase}
                      index={index}
                    />
                  ))}
                </div>
              )}

              <p className="mt-6 text-sm text-muted-foreground">
                Showing {filteredCases.length} of {allCases.length} cases
                {aiGeneratedCases.length > 0 && (
                  <span className="ml-1">
                    ({aiGeneratedCases.length} AI-generated)
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
