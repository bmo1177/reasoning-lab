import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  GitBranch,
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import type { WhatIfScenario } from '@/types/analytics';
import type { BranchingCase } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface WhatIfPanelProps {
  isOpen: boolean;
  onClose: () => void;
  branchingCase: BranchingCase;
  currentStageId: string;
}

export function WhatIfPanel({
  isOpen,
  onClose,
  branchingCase,
  currentStageId
}: WhatIfPanelProps) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [exploredScenarios, setExploredScenarios] = useState<Set<string>>(new Set());

  // Derive scenarios from current stage decisions for demo purposes
  const currentStage = branchingCase.stages.find(s => s.id === currentStageId);

  const scenarios: WhatIfScenario[] = currentStage?.availableDecisions.map(d => ({
    id: d.id,
    alternative_decision_id: d.id,
    alternative_decision_label: d.label,
    predicted_outcome: d.cost > 50 ? 'worse' : 'better', // Mock logic
    scenario_description: d.description,
    explanation: "Analysis of potential impact based on clinical guidelines.",
    key_insight: "Always consider cost-benefit in emergency settings."
  })) || [];

  const actualDecision = { label: "Current Selection" }; // Placeholder

  const handleExplore = (scenarioId: string) => {
    setExploredScenarios(prev => new Set(prev).add(scenarioId));
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'better':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Better Outcome
          </Badge>
        );
      case 'worse':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Worse Outcome
          </Badge>
        );
      case 'similar':
        return (
          <Badge variant="secondary">
            Similar Outcome
          </Badge>
        );
      case 'different':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Different Path
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Explore Alternatives</SheetTitle>
              <SheetDescription>
                See what could have happened with different choices
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Your Decision */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Your Decision:</p>
            <p className="font-medium">{actualDecision.label}</p>
          </div>

          {/* Scenarios */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Alternative Choices ({scenarios.length}):
            </p>

            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                layout
                className={cn(
                  "border rounded-lg overflow-hidden transition-all",
                  exploredScenarios.has(scenario.id)
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                {/* Scenario Header */}
                <button
                  onClick={() => setExpandedScenario(
                    expandedScenario === scenario.id ? null : scenario.id
                  )}
                  className="w-full p-3 flex items-center justify-between text-left"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      exploredScenarios.has(scenario.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {exploredScenarios.has(scenario.id) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {scenario.alternative_decision_label}
                      </p>
                      {getOutcomeBadge(scenario.predicted_outcome)}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      expandedScenario === scenario.id && "rotate-90"
                    )}
                  />
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedScenario === scenario.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 space-y-4">
                        {/* Scenario Description */}
                        <div>
                          <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            What Would Happen:
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {scenario.scenario_description}
                          </p>
                        </div>

                        {/* Comparison */}
                        {scenario.predicted_outcome && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm">
                              <span className="font-medium">Comparison: </span>
                              {scenario.predicted_outcome === 'better' &&
                                "This alternative would have led to a better outcome."}
                              {scenario.predicted_outcome === 'worse' &&
                                "This alternative would have led to a worse outcome."}
                              {scenario.predicted_outcome === 'similar' &&
                                "The outcome would have been similar to your choice."}
                              {scenario.predicted_outcome === 'different' &&
                                "The outcome would have differed in significant ways."}
                            </p>
                          </div>
                        )}

                        {/* Explanation */}
                        {scenario.explanation && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Clinical Reasoning:</h4>
                            <p className="text-sm text-muted-foreground">
                              {scenario.explanation}
                            </p>
                          </div>
                        )}

                        {/* Key Insight */}
                        {scenario.key_insight && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-medium text-sm mb-1 text-blue-900">
                              Key Learning:
                            </h4>
                            <p className="text-sm text-blue-800">
                              {scenario.key_insight}
                            </p>
                          </div>
                        )}

                        {/* Explore Button */}
                        {!exploredScenarios.has(scenario.id) && (
                          <Button
                            onClick={() => handleExplore(scenario.id)}
                            variant="outline"
                            className="w-full"
                          >
                            Simulate This Path
                          </Button>
                        )}

                        {exploredScenarios.has(scenario.id) && (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            You explored this scenario
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Exploration Progress */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Scenarios Explored:
              </span>
              <span className="font-medium">
                {exploredScenarios.size} / {scenarios.length}
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(exploredScenarios.size / Math.max(1, scenarios.length)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Compact version for inline use
interface WhatIfButtonProps {
  scenarioCount: number;
  onClick: () => void;
  exploredCount: number;
}

export function WhatIfButton({ scenarioCount, onClick, exploredCount }: WhatIfButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="gap-2"
    >
      <GitBranch className="w-4 h-4" />
      Explore Alternatives
      {exploredCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {exploredCount}/{scenarioCount}
        </Badge>
      )}
    </Button>
  );
}
