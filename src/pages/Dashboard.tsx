import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Target,
  Clock,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Zap,
  ArrowRight,
  Sparkles,
  Award,
  Activity,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const quickActions = [
  {
    title: 'Start a Case',
    description: 'Practice with clinical scenarios',
    icon: Zap,
    href: '/cases',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'View Simulations',
    description: 'Interactive branching scenarios',
    icon: Activity,
    href: '/simulations',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50'
  },
  {
    title: 'Detective Mode',
    description: 'Find errors in cases',
    icon: AlertTriangle,
    href: '/detective',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50'
  },
];

const learningPaths = [
  {
    title: 'Beginner Path',
    description: 'Master the basics of clinical reasoning',
    progress: 0,
    totalCases: 5,
    completedCases: 0,
    color: 'bg-emerald-500',
    icon: Activity
  },
  {
    title: 'Emergency Medicine',
    description: 'Fast-paced critical care scenarios',
    progress: 0,
    totalCases: 8,
    completedCases: 0,
    color: 'bg-red-500',
    icon: AlertTriangle
  },
  {
    title: 'Diagnostic Expert',
    description: 'Complex multi-system cases',
    progress: 0,
    totalCases: 12,
    completedCases: 0,
    color: 'bg-blue-500',
    icon: Brain
  },
];

export default function Dashboard() {
  const [reflections, setReflections] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('think-studio-reflections');
      if (stored) {
        setReflections(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse reflections:', e);
    }
  }, []);

  const totalCases = reflections.length;
  const avgScore = totalCases > 0
    ? Math.round(reflections.reduce((sum, r) => sum + (r.score || 0), 0) / totalCases)
    : 0;

  // Simplified stats for now
  const stats = [
    {
      label: 'Cases Completed',
      value: totalCases.toString(),
      subtext: totalCases > 0 ? 'Keep up the good work!' : 'Start your first case',
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600',
      trend: null
    },
    {
      label: 'Avg. Time',
      value: totalCases > 0 ? '12' : '--', // Placeholder for time until we track duration
      subtext: 'min per case',
      icon: Clock,
      color: 'bg-purple-500/10 text-purple-600',
      trend: null
    },
    {
      label: 'Accuracy',
      value: totalCases > 0 ? `${avgScore}%` : '--%',
      subtext: 'diagnostic rate',
      icon: Target,
      color: 'bg-emerald-500/10 text-emerald-600',
      trend: null
    },
    {
      label: 'Learning Streak',
      value: totalCases > 0 ? '1' : '0', // Placeholder for streak logic
      subtext: 'days',
      icon: Flame,
      color: 'bg-orange-500/10 text-orange-600',
      trend: null
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 lg:p-12 border border-primary/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Welcome Back
                  </Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Your Learning Dashboard
                </h1>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
                  Track your clinical reasoning progress, identify patterns, and master diagnostic thinking.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                      </div>
                      <div className={cn("p-3 rounded-xl", stat.color)}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link to={action.href}>
                    <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                      <CardContent className="p-6 relative">
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity", action.bgColor)} />
                        <div className="relative z-10">
                          <div className={cn("inline-flex p-3 rounded-xl bg-gradient-to-r mb-4 group-hover:scale-110 transition-transform", action.color)}>
                            <action.icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Get Started</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Learning Paths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2"
            >
              <Card className="h-full border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Learning Paths
                      </CardTitle>
                      <CardDescription>
                        Structured curricula to guide your learning
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/cases" className="gap-1">
                        View All
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {learningPaths.map((path, index) => (
                    <motion.div
                      key={path.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="group"
                    >
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className={cn("p-3 rounded-xl shrink-0", path.color, "bg-opacity-10 text-white")}>
                          <path.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{path.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {path.completedCases}/{path.totalCases} cases
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {path.description}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{path.progress}%</span>
                            </div>
                            <Progress value={path.progress} className="h-2" />
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Cognitive Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="h-full border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Cognitive Skills
                  </CardTitle>
                  <CardDescription>
                    Areas to develop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { name: 'Differential Breadth', desc: 'Considering multiple diagnoses', value: 0 },
                    { name: 'Test Efficiency', desc: 'Ordering appropriate tests', value: 0 },
                    { name: 'Confidence Calibration', desc: 'Accurate self-assessment', value: 0 },
                  ].map((skill, index) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">{skill.desc}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {skill.value > 0 ? `${skill.value}%` : 'Start'}
                        </Badge>
                      </div>
                      <Progress value={skill.value} className="h-1.5" />
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        Complete cases to unlock skill tracking and personalized insights.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest learning sessions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/simulations">Browse Cases</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reflections.length > 0 ? (
                  <div className="space-y-4">
                    {reflections.slice().reverse().slice(0, 5).map((reflection, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-muted/50 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                          </div>
                          <div>
                            <h4 className="font-medium">{reflection.caseTitle || reflection.caseId || 'Simulation'}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <span>Completed {formatDistanceToNow(new Date(reflection.submittedAt), { addSuffix: true })}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>Score: {reflection.score}%</span>
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex rounded-full">
                          <Link to="/simulations">
                            Review
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6"
                    >
                      <BookOpen className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      You haven't completed any cases yet. Begin with a beginner-friendly case to start tracking your progress and receiving personalized insights.
                    </p>
                    <Button size="lg" asChild className="rounded-full px-8">
                      <Link to="/simulations">
                        <Zap className="h-4 w-4 mr-2" />
                        View Simulations
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
