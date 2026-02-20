import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, MessageCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocraticTeamPromptProps {
  nodesCount: number;
  connectionsCount: number;
  testsOrdered: number;
  timeElapsedSeconds: number;
  onDismiss?: () => void;
}

interface PromptConfig {
  icon: React.ReactNode;
  message: string;
  type: 'insight' | 'challenge' | 'warning' | 'question';
}

const PROMPTS: PromptConfig[] = [
  // Questions to encourage deeper thinking
  { icon: <HelpCircle className="h-4 w-4" />, message: "Have you considered alternate explanations for these findings?", type: 'question' },
  { icon: <HelpCircle className="h-4 w-4" />, message: "What evidence would disprove your current hypothesis?", type: 'question' },
  { icon: <HelpCircle className="h-4 w-4" />, message: "What are you most uncertain about right now?", type: 'question' },
  { icon: <HelpCircle className="h-4 w-4" />, message: "Is there a pattern you might be missing?", type: 'question' },
  { icon: <HelpCircle className="h-4 w-4" />, message: "Have you discussed this symptom's timeline with your team?", type: 'question' },
  
  // Insights to encourage collaboration
  { icon: <Lightbulb className="h-4 w-4" />, message: "Great teams debate their differential diagnoses openly.", type: 'insight' },
  { icon: <Lightbulb className="h-4 w-4" />, message: "Consider having each team member propose their top diagnosis.", type: 'insight' },
  { icon: <Lightbulb className="h-4 w-4" />, message: "Verbalizing uncertainty helps the whole team learn.", type: 'insight' },
  
  // Challenges to push thinking
  { icon: <MessageCircle className="h-4 w-4" />, message: "Can you explain your reasoning to a skeptical colleague?", type: 'challenge' },
  { icon: <MessageCircle className="h-4 w-4" />, message: "What would change your mind about this diagnosis?", type: 'challenge' },
  { icon: <MessageCircle className="h-4 w-4" />, message: "Are you anchoring on the first diagnosis you considered?", type: 'challenge' },
  
  // Warnings about cognitive biases
  { icon: <AlertTriangle className="h-4 w-4" />, message: "Beware of premature closure — have you ruled out alternatives?", type: 'warning' },
  { icon: <AlertTriangle className="h-4 w-4" />, message: "Could availability bias be influencing your thinking?", type: 'warning' },
  { icon: <AlertTriangle className="h-4 w-4" />, message: "Remember: common things are common, but zebras exist too.", type: 'warning' },
];

export function SocraticTeamPrompt({ 
  nodesCount, 
  connectionsCount, 
  testsOrdered,
  timeElapsedSeconds,
  onDismiss 
}: SocraticTeamPromptProps) {
  const [currentPrompt, setCurrentPrompt] = useState<PromptConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState(0);

  const shouldShowPrompt = useCallback(() => {
    const timeSinceLastPrompt = Date.now() - lastPromptTime;
    
    // Show prompts at key moments:
    // 1. After 2 minutes of work
    // 2. When first tests are ordered
    // 3. When multiple nodes exist but no connections
    // 4. Every 3 minutes after that
    
    if (timeSinceLastPrompt < 60000) return false; // Min 1 minute between prompts
    
    if (timeElapsedSeconds >= 120 && timeElapsedSeconds < 130) return true;
    if (testsOrdered === 1 && timeSinceLastPrompt > 30000) return true;
    if (nodesCount >= 3 && connectionsCount === 0) return true;
    if (timeSinceLastPrompt > 180000) return true; // Every 3 minutes
    
    return false;
  }, [nodesCount, connectionsCount, testsOrdered, timeElapsedSeconds, lastPromptTime]);

  useEffect(() => {
    if (shouldShowPrompt() && !dismissed) {
      const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      setCurrentPrompt(randomPrompt);
      setLastPromptTime(Date.now());
    }
  }, [nodesCount, connectionsCount, testsOrdered, timeElapsedSeconds, shouldShowPrompt, dismissed]);

  const handleDismiss = () => {
    setCurrentPrompt(null);
    setDismissed(true);
    setTimeout(() => setDismissed(false), 60000); // Allow new prompts after 1 minute
    onDismiss?.();
  };

  const getTypeStyles = (type: PromptConfig['type']) => {
    switch (type) {
      case 'insight':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300';
      case 'challenge':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300';
      case 'question':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  return (
    <AnimatePresence>
      {currentPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md"
        >
          <Card className={`shadow-lg ${getTypeStyles(currentPrompt.type)}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{currentPrompt.icon}</div>
                <p className="flex-1 text-sm font-medium">{currentPrompt.message}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
