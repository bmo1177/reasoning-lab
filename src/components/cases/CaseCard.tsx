import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ClinicalCase, Difficulty } from '@/types/case';
import { specialtyLabels, difficultyLabels } from '@/data/sampleCases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaseCardProps {
  clinicalCase: ClinicalCase;
  index?: number;
}

const difficultyStyles: Record<Difficulty, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

export function CaseCard({ clinicalCase, index = 0 }: CaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {specialtyLabels[clinicalCase.specialty]}
            </span>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              difficultyStyles[clinicalCase.difficulty]
            )}>
              {difficultyLabels[clinicalCase.difficulty]}
            </span>
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {clinicalCase.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {clinicalCase.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{clinicalCase.estimatedMinutes} min</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to={`/studio/${clinicalCase.id}`}>
                Start Case
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
          
          {/* Patient preview */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {clinicalCase.patient.age}yo {clinicalCase.patient.sex}
              </span>
              {' — '}
              {clinicalCase.patient.chiefComplaint}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
