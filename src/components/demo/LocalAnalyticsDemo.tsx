import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Activity,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAnalytics } from '@/hooks/useLocalAnalytics';
import type { CaseType } from '@/types/unifiedAnalytics';
import { applyDemoScenario, clearMockData } from '@/services/mockDataService';
import { MockDataControls } from './MockDataControls';
import { cn } from '@/lib/utils';

export function LocalAnalyticsDemo() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const analytics = useLocalAnalytics({
    caseType: 'clinical',
    caseId: 'demo',
    userId: user?.id || 'demo-user',
  });

  // Load data on mount and when updated
  const loadData = async () => {
    if (!user?.id) return;
    
    const userStats = analytics.getStats();
    const userPerformance = await analytics.getCrossCasePerformance();
    const userRecommendations = await analytics.getRecommendations();
    
    setStats(userStats);
    setPerformance(userPerformance);
    setRecommendations(userRecommendations);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleScenarioApplied = () => {
    loadData();
  };

  const handleClearData = () => {
    clearMockData();
    loadData();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to view analytics demo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Local Analytics Demo
          </h1>
          <p className="text-muted-foreground mt-1">
            Client-side simulation using localStorage (no database needed)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <MockDataControls 
          onScenarioApplied={handleScenarioApplied}
          onClearData={handleClearData}
        />
      </div>

      {!stats || stats.totalCases === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate mock data using the controls above to see analytics in action
            </p>
            <Button onClick={() => applyDemoScenario(user.id, 'intermediate')}>
              Generate Sample Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard
                icon={Target}
                label="Total Cases"
                value={stats.totalCases}
                subtext={`${stats.completedCases} completed`}
                color="blue"
              />
              <MetricCard
                icon={Award}
                label="Average Accuracy"
                value={`${Math.round(stats.averageAccuracy)}%`}
                subtext={`${stats.abandonedCases} abandoned`}
                color={stats.averageAccuracy >= 70 ? "green" : stats.averageAccuracy >= 50 ? "yellow" : "red"}
              />
              <MetricCard
                icon={Clock}
                label="Total Time"
                value={formatTime(stats.totalTimeSpent)}
                subtext="Across all cases"
                color="purple"
              />
              <MetricCard
                icon={TrendingUp}
                label="Learning Velocity"
                value={`${calculateVelocity(performance)}%`}
                subtext="Improvement rate"
                color="orange"
              />
            </div>

            {/* Case Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance by Case Type
                </CardTitle>
                <CardDescription>
                  How you're performing across different learning modalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byCaseType.map((type: any) => (
                    <CaseTypeRow key={type.case_type} data={type} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Recommendations Preview */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Top Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.slice(0, 2).map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} compact />
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('recommendations')}
                  >
                    View All Recommendations
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance by Case Type</CardTitle>
                <CardDescription>
                  Comprehensive breakdown of your learning across all modalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {performance.map((type) => (
                    <DetailedPerformanceCard key={type.case_type} data={type} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions based on your learning patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recommendations available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete more cases to get personalized suggestions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage Details</CardTitle>
                <CardDescription>
                  Technical information about your local analytics data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Performance Metrics</p>
                    <p className="text-2xl font-bold">{stats.totalCases}</p>
                    <p className="text-xs text-muted-foreground">stored in localStorage</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Learning Events</p>
                    <p className="text-2xl font-bold">
                      {analytics.getSessionEvents().length}
                    </p>
                    <p className="text-xs text-muted-foreground">across all sessions</p>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Local Storage Only</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        This data is stored in your browser's localStorage and will be lost if you clear your browser data. 
                        This is for demonstration purposes only.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Helper Components

function MetricCard({ icon: Icon, label, value, subtext, color }: {
  icon: any;
  label: string;
  value: string | number;
  subtext: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <Card className={cn("border-2", colors[color])}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 opacity-70" />
          <span className="text-sm font-medium opacity-80">{label}</span>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs opacity-70 mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function CaseTypeRow({ data }: { data: any }) {
  const typeLabels: Record<string, string> = {
    clinical: 'Clinical Reasoning',
    simulation: 'Clinical Simulation',
    error: 'Error Analysis',
    uncertainty: 'Uncertainty Management',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{typeLabels[data.case_type] || data.case_type}</Badge>
        <span className="text-sm text-muted-foreground">
          {data.completed_cases} completed
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-32">
          <Progress value={data.avg_accuracy || 0} className="h-2" />
        </div>
        <span className="text-sm font-medium w-12 text-right">
          {data.avg_accuracy ? Math.round(data.avg_accuracy) : 0}%
        </span>
      </div>
    </div>
  );
}

function DetailedPerformanceCard({ data }: { data: any }) {
  const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    clinical: { label: 'Clinical Reasoning', icon: Activity, color: 'blue' },
    simulation: { label: 'Clinical Simulation', icon: Target, color: 'green' },
    error: { label: 'Error Analysis', icon: AlertTriangle, color: 'orange' },
    uncertainty: { label: 'Uncertainty Management', icon: Brain, color: 'purple' },
  };

  const config = typeConfig[data.case_type] || typeConfig.clinical;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border rounded-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-opacity-10", `bg-${config.color}-500`)}>
            <Icon className={cn("h-5 w-5", `text-${config.color}-500`)} />
          </div>
          <div>
            <h4 className="font-semibold">{config.label}</h4>
            <p className="text-sm text-muted-foreground">
              {data.total_cases} total cases • {data.completed_cases} completed
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {data.avg_accuracy ? Math.round(data.avg_accuracy) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">avg accuracy</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-muted rounded">
          <p className="text-lg font-semibold">{data.avg_accuracy ? Math.round(data.avg_accuracy) : 0}%</p>
          <p className="text-xs text-muted-foreground">Accuracy</p>
        </div>
        <div className="text-center p-3 bg-muted rounded">
          <p className="text-lg font-semibold">{data.avg_efficiency ? Math.round(data.avg_efficiency) : 0}%</p>
          <p className="text-xs text-muted-foreground">Efficiency</p>
        </div>
        <div className="text-center p-3 bg-muted rounded">
          <p className="text-lg font-semibold">
            {data.last_completed_at 
              ? new Date(data.last_completed_at).toLocaleDateString()
              : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">Last Active</p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationCard({ recommendation, compact }: { 
  recommendation: any;
  compact?: boolean;
}) {
  const typeColors: Record<string, string> = {
    skill_gap: 'bg-red-50 border-red-200 text-red-900',
    variety: 'bg-blue-50 border-blue-200 text-blue-900',
    mastery: 'bg-green-50 border-green-200 text-green-900',
    calibration: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    review: 'bg-purple-50 border-purple-200 text-purple-900',
    challenge: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  const typeLabels: Record<string, string> = {
    skill_gap: 'Skill Gap',
    variety: 'Try Something New',
    mastery: 'Mastery Path',
    calibration: 'Calibration Needed',
    review: 'Review Recommended',
    challenge: 'Challenge Yourself',
  };

  if (compact) {
    return (
      <div className={cn("p-3 rounded-lg border", typeColors[recommendation.recommendation_type])}>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {typeLabels[recommendation.recommendation_type]}
          </Badge>
          <span className="text-xs opacity-70">Priority: {recommendation.priority_score}/100</span>
        </div>
        <p className="font-medium text-sm">{recommendation.recommended_case_title}</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4 rounded-lg border", typeColors[recommendation.recommendation_type])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {typeLabels[recommendation.recommendation_type]}
            </Badge>
            <Progress value={recommendation.priority_score} className="w-24 h-2" />
            <span className="text-xs opacity-70">{recommendation.priority_score}/100</span>
          </div>
          <h4 className="font-semibold mb-1">{recommendation.recommended_case_title}</h4>
          <p className="text-sm opacity-90">{recommendation.primary_reason}</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function calculateVelocity(performance: any[]): number {
  if (performance.length < 2) return 0;
  
  const sorted = performance
    .filter(p => p.avg_accuracy !== null)
    .sort((a, b) => (a.avg_accuracy || 0) - (b.avg_accuracy || 0));
  
  if (sorted.length < 2) return 0;
  
  const lowest = sorted[0].avg_accuracy || 0;
  const highest = sorted[sorted.length - 1].avg_accuracy || 0;
  
  if (lowest === 0) return 0;
  return Math.round(((highest - lowest) / lowest) * 100);
}
