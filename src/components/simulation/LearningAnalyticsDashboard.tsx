import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Brain,
  GitBranch,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationSession, LearningAnalyticsEvent } from '@/types/analytics';
import { getSimulationSessionDetails } from '@/services/analyticsService';

interface LearningAnalyticsDashboardProps {
  sessionId: string;
  onRetry?: () => void;
  onBackToLibrary?: () => void;
  className?: string;
}

export function LearningAnalyticsDashboard({
  sessionId,
  onRetry,
  onBackToLibrary,
  className,
}: LearningAnalyticsDashboardProps) {
  const [sessionData, setSessionData] = useState<{
    session: SimulationSession | null;
    events: LearningAnalyticsEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await getSimulationSessionDetails(sessionId);
      setSessionData(data);
      setLoading(false);
    };
    loadData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!sessionData?.session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session data not found</p>
      </div>
    );
  }

  const session = sessionData.session;
  const events = sessionData.events;

  // Calculate metrics
  const accuracy = session.optimal_path_deviation_score || 0;
  const costEfficiency = Math.max(0, 100 - (session.total_cost / 50)); // Assuming avg cost is 500
  const timeEfficiency = session.total_duration_seconds
    ? Math.max(0, 100 - (session.total_duration_seconds / 60))
    : 0;

  const metrics = {
    accuracy,
    costEfficiency,
    timeEfficiency,
    overall: Math.round((accuracy + costEfficiency + timeEfficiency) / 3),
  };

  // Get decision events
  const decisionEvents = events.filter(e => e.event_type === 'decision_made');
  const optimalDecisions = decisionEvents.filter(e => e.was_optimal).length;
  const suboptimalDecisions = decisionEvents.length - optimalDecisions;

  // Get warnings
  const warningEvents = events.filter(e =>
    e.event_type === 'constraint_warning_shown'
  );
  const heededWarnings = events.filter(e =>
    e.event_type === 'constraint_warning_heeded'
  ).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Review</h2>
          <p className="text-muted-foreground mt-1">
            {session.case_title} • {session.specialty}
          </p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onBackToLibrary && (
            <Button onClick={onBackToLibrary}>
              Back to Library
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(metrics.overall / 100) * 351.86} 351.86`}
                  className={cn(
                    "transition-all duration-1000",
                    metrics.overall >= 80 ? "text-green-500" :
                      metrics.overall >= 60 ? "text-yellow-500" :
                        "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{metrics.overall}%</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Overall Performance</h3>
              <p className="text-muted-foreground">
                {metrics.overall >= 80
                  ? "Excellent work! You demonstrated strong clinical reasoning."
                  : metrics.overall >= 60
                    ? "Good effort. There are areas where you can improve."
                    : "This case was challenging. Let's review the key learning points."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard
          icon={Target}
          label="Decision Quality"
          value={metrics.accuracy}
          description={`${optimalDecisions} optimal out of ${decisionEvents.length} decisions`}
          color={metrics.accuracy >= 80 ? "green" : metrics.accuracy >= 60 ? "yellow" : "red"}
        />
        <MetricCard
          icon={DollarSign}
          label="Cost Efficiency"
          value={costEfficiency}
          description={`Total cost: $${session.total_cost}`}
          color={costEfficiency >= 80 ? "green" : costEfficiency >= 60 ? "yellow" : "red"}
        />
        <MetricCard
          icon={Clock}
          label="Time Management"
          value={timeEfficiency}
          description={`${Math.floor((session.total_duration_seconds || 0) / 60)}m ${(session.total_duration_seconds || 0) % 60}s`}
          color={timeEfficiency >= 80 ? "green" : timeEfficiency >= 60 ? "yellow" : "red"}
        />
      </div>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Decision Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Decision Analysis
            </CardTitle>
            <CardDescription>
              Breakdown of your choices vs optimal path
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Optimal Decisions</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium">{optimalDecisions}</span>
              </div>
            </div>
            <Progress value={(optimalDecisions / Math.max(decisionEvents.length, 1)) * 100} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suboptimal Decisions</span>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{suboptimalDecisions}</span>
              </div>
            </div>
            <Progress
              value={(suboptimalDecisions / Math.max(decisionEvents.length, 1)) * 100}
              className="h-2 bg-yellow-100"
            />

            {session.critical_errors > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span className="text-sm">Critical Errors</span>
                <span className="font-bold">{session.critical_errors}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety & Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Clinical Safety
            </CardTitle>
            <CardDescription>
              How well you heeded clinical warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Warnings Shown</span>
              <Badge variant="secondary">{warningEvents.length}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Warnings Heeded</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium">{heededWarnings}</span>
              </div>
            </div>

            {warningEvents.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm">
                  You heeded {Math.round((heededWarnings / warningEvents.length) * 100)}% of clinical warnings
                </p>
              </div>
            )}

            {session.warnings_ignored > 0 && (
              <div className="text-sm text-yellow-600">
                {session.warnings_ignored} warnings were ignored
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Objectives */}
      {session.learning_objectives_achieved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Learning Objectives Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.learning_objectives_achieved.map((objective, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{objective}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cognitive Biases */}
      {session.cognitive_biases_detected.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <TrendingUp className="w-5 h-5" />
              Cognitive Patterns Observed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.cognitive_biases_detected.map((bias, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-900">{bias}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.accuracy < 80 && (
              <RecommendationItem
                type="improve"
                text="Review the optimal decision path to understand where your choices diverged"
              />
            )}
            {session.warnings_ignored > 0 && (
              <RecommendationItem
                type="safety"
                text="Pay closer attention to clinical warnings - they indicate potential safety issues"
              />
            )}
            {costEfficiency < 70 && (
              <RecommendationItem
                type="efficiency"
                text="Consider cost-effectiveness in your decision-making. Unnecessary tests add burden without benefit."
              />
            )}
            {metrics.overall >= 80 && (
              <RecommendationItem
                type="strength"
                text="Great job! Consider trying a more challenging case or a different specialty."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  color: 'green' | 'yellow' | 'red';
}

function MetricCard({ icon: Icon, label, value, description, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <Card className={cn("border-2", colorClasses[color])}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="text-3xl font-bold mb-1">{Math.round(value)}%</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface RecommendationItemProps {
  type: 'improve' | 'safety' | 'efficiency' | 'strength';
  text: string;
}

function RecommendationItem({ type, text }: RecommendationItemProps) {
  const icons = {
    improve: Target,
    safety: AlertTriangle,
    efficiency: DollarSign,
    strength: Award,
  };

  const colors = {
    improve: 'text-blue-600 bg-blue-50',
    safety: 'text-red-600 bg-red-50',
    efficiency: 'text-green-600 bg-green-50',
    strength: 'text-purple-600 bg-purple-50',
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start gap-3">
      <div className={cn("p-2 rounded-lg shrink-0", colors[type])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm mt-1">{text}</p>
    </div>
  );
}
