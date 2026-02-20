import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Target, 
  Brain, 
  TrendingUp, 
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { selectAdaptiveCase, getMultipleRecommendations, generateRecommendationExplanation } from '@/services/adaptiveCaseSelector';
import { sampleBranchingCases } from '@/data/sampleBranchingCases';
import type { AdaptiveRecommendation } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface AdaptiveCaseRecommendationProps {
  onSelectCase: (caseId: string) => void;
  className?: string;
}

export function AdaptiveCaseRecommendation({ 
  onSelectCase, 
  className 
}: AdaptiveCaseRecommendationProps) {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendation();
  }, [user?.id]);

  const loadRecommendation = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const rec = await selectAdaptiveCase({
        userId: user.id,
        avoidRecentCases: true,
        focusOnWeaknesses: true,
      });
      setRecommendation(rec);
    } catch (error) {
      console.error('Error loading recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = async () => {
    if (!user?.id) return;
    
    setGenerating(true);
    try {
      const rec = await selectAdaptiveCase({
        userId: user.id,
        avoidRecentCases: true,
        focusOnWeaknesses: true,
        excludeCaseIds: recommendation ? [recommendation.caseId] : [],
      });
      setRecommendation(rec);
    } catch (error) {
      console.error('Error generating new recommendation:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recommendations available</p>
            <Button onClick={loadRecommendation} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const caseData = sampleBranchingCases.find(c => c.id === recommendation.caseId);
  if (!caseData) return null;

  const explanation = generateRecommendationExplanation(recommendation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Personalized Recommendation</CardTitle>
                <CardDescription>Based on your learning profile</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateNew}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Case Preview */}
          <div className="bg-background rounded-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{caseData.title}</h3>
              <Badge variant="secondary">{caseData.specialty}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {caseData.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{caseData.difficulty}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>{recommendation.expectedDifficulty}</span>
              </div>
            </div>
          </div>

          {/* Why This Case */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Why This Case?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Targeted Areas */}
          {recommendation.targetedWeaknesses.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Areas to Improve:</h4>
              <div className="flex flex-wrap gap-2">
                {recommendation.targetedWeaknesses.map((weakness, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {weakness}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {recommendation.targetedObjectives.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">You'll Learn:</h4>
              <ul className="space-y-1">
                {recommendation.targetedObjectives.map((objective, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <Button 
            onClick={() => onSelectCase(recommendation.caseId)}
            className="w-full gap-2"
            size="lg"
          >
            Start This Case
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Multiple recommendations variant
interface AdaptiveCaseSelectorProps {
  onSelectCase: (caseId: string) => void;
  count?: number;
  className?: string;
}

export function AdaptiveCaseSelector({
  onSelectCase,
  count = 3,
  className,
}: AdaptiveCaseSelectorProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const recs = await getMultipleRecommendations(
        {
          userId: user.id,
          avoidRecentCases: true,
          focusOnWeaknesses: true,
        },
        count
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Recommended For You
        </h3>
        <Button variant="ghost" size="sm" onClick={loadRecommendations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => {
          const caseData = sampleBranchingCases.find(c => c.id === rec.caseId);
          if (!caseData) return null;

          return (
            <motion.div
              key={rec.caseId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col"
                onClick={() => onSelectCase(rec.caseId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {caseData.specialty}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {caseData.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{caseData.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {caseData.description}
                  </p>
                  
                  {rec.targetedWeaknesses.length > 0 && (
                    <div className="mt-auto">
                      <p className="text-xs text-muted-foreground mb-1">Targets:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.targetedWeaknesses.slice(0, 2).map((w, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
