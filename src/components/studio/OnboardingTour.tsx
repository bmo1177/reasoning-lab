import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Stethoscope, 
  Search, 
  Activity, 
  Brain,
  Keyboard,
  MousePointer,
  GitCompare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Reasoning Studio',
    description: 'This is your workspace for building diagnostic reasoning. Let\'s take a quick tour!',
    icon: Brain,
    position: 'center',
  },
  {
    id: 'case-panel',
    title: 'Case Information',
    description: 'On the left, you\'ll find patient details, vital signs, and available tests. Review this carefully before starting.',
    icon: Stethoscope,
    position: 'left',
  },
  {
    id: 'canvas',
    title: 'Your Reasoning Canvas',
    description: 'This is where you build your diagnostic map. Press S for Symptoms, F for Findings, D for Diagnoses, and more!',
    icon: MousePointer,
    position: 'center',
  },
  {
    id: 'connections',
    title: 'Making Connections',
    description: 'Drag from one node to another to create connections. Show how symptoms support your diagnoses.',
    icon: Activity,
    position: 'center',
  },
  {
    id: 'ai-analysis',
    title: 'AI Analysis',
    description: 'Click the Brain icon in the toolbar or header to get AI-powered insights about your reasoning.',
    icon: Brain,
    position: 'right',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press ? anytime to see all keyboard shortcuts. They make building your map much faster!',
    icon: Keyboard,
    position: 'right',
  },
  {
    id: 'compare',
    title: 'Compare with Expert',
    description: 'When ready, click "Compare with Expert" to see how your reasoning aligns with the ideal solution.',
    icon: GitCompare,
    position: 'right',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Start building your reasoning map. Remember: there\'s no single right answer - show your thinking process!',
    icon: Search,
    position: 'center',
  },
];

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-base leading-relaxed">
            {step.description}
          </CardDescription>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  idx === currentStep 
                    ? 'bg-primary w-4' 
                    : idx < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className={cn(isFirst && 'invisible')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-2">
              {!isLast && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MiniTooltip({ 
  children, 
  content,
  show = true,
}: { 
  children: React.ReactNode; 
  content: string;
  show?: boolean;
}) {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-primary" />
      </div>
    </div>
  );
}
