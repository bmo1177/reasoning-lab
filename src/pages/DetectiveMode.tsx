import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { sampleErrorCases, sampleUncertaintyCases } from '@/data/sampleErrorCases';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Search,
  AlertTriangle,
  Scale,
  Sparkles,
  Clock,
  Brain,
  ArrowRight,
  BookOpen,
  Target,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { ErrorCaseGenerator } from '@/components/detective/ErrorCaseGenerator';
import { cn } from '@/lib/utils';

// Bias label descriptions for tooltip-style display
const biasDescriptions: Record<string, string> = {
  'anchoring-bias': 'Over-relying on the first piece of information encountered',
  'availability-heuristic': 'Judging likelihood by how easily examples come to mind',
  'confirmation-bias': 'Searching for information that confirms pre-existing beliefs',
  'premature-closure': 'Accepting a diagnosis before it is fully verified',
  'diagnosis-momentum': 'Once a label is attached, it gathers momentum and becomes harder to change',
  'gender-bias': 'Unconsciously treating patients differently based on gender',
  'age-bias': 'Assumptions about diagnosis based on patient age',
  'overconfidence': 'Excessive belief in the accuracy of one\'s own judgment',
  'representativeness-heuristic': 'Judging probability based on how similar something is to a prototype',
  'base-rate-neglect': 'Ignoring the actual prevalence of a condition when estimating probability',
};

// Collect unique biases across all error cases
const allBiasesInCases = Array.from(
  new Set(sampleErrorCases.flatMap(c => c.analysis.cognitiveBiases))
);

export default function DetectiveMode() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('error-cases');

  const filteredErrorCases = useMemo(() => {
    return sampleErrorCases.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredUncertaintyCases = useMemo(() => {
    return sampleUncertaintyCases.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', border: 'border-l-emerald-500' };
      case 'intermediate': return { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', border: 'border-l-amber-500' };
      case 'advanced': return { badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20', border: 'border-l-rose-500' };
      default: return { badge: '', border: '' };
    }
  };

  const stats = [
    {
      label: 'Error Cases',
      value: sampleErrorCases.length.toString(),
      subtext: 'Clinical error scenarios',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600',
    },
    {
      label: 'Uncertainty Cases',
      value: sampleUncertaintyCases.length.toString(),
      subtext: 'Bayesian reasoning exercises',
      icon: Scale,
      color: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Biases Covered',
      value: allBiasesInCases.length.toString(),
      subtext: 'Cognitive bias types',
      icon: Brain,
      color: 'bg-blue-500/10 text-blue-600',
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
          {/* Hero Section */}
          <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-background p-8 lg:p-12 border border-rose-500/10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Detective Mode
                  </Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Learn from Clinical Errors
                </h1>
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
                  Analyze flawed reasoning, identify cognitive biases, practice Bayesian updating,
                  and build correct diagnostic pathways. Every error is a lesson that can save lives.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
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

          {/* AI Generator Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <ErrorCaseGenerator onCaseGenerated={(id) => navigate(`/detective/${id}`)} />
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="relative mb-6"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases by title, specialty, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-muted-foreground/20"
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 h-12 p-1 rounded-xl">
                <TabsTrigger value="error-cases" className="gap-2 rounded-lg px-6 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                  Error-Based Learning
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5 rounded-full">
                    {sampleErrorCases.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="uncertainty" className="gap-2 rounded-lg px-6 data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600">
                  <Scale className="h-4 w-4" />
                  Uncertainty Training
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5 rounded-full">
                    {sampleUncertaintyCases.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="error-cases">
                {/* Intro blurb */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-6">
                  <div className="p-2 rounded-lg bg-rose-500/10 shrink-0">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">How it works</p>
                    <p className="text-sm text-muted-foreground">
                      Each case presents a real-world clinical error. Your mission: identify the cognitive biases,
                      spot the missed red flags, suggest the right questions, and reconstruct the correct reasoning path.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {filteredErrorCases.map((errorCase, index) => {
                    const diff = getDifficultyColor(errorCase.difficulty);
                    return (
                      <motion.div
                        key={errorCase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -4 }}
                      >
                        <Card
                          className={cn(
                            "h-full border-l-4 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden",
                            diff.border
                          )}
                          onClick={() => navigate(`/detective/${errorCase.id}`)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg group-hover:text-rose-600 transition-colors">
                                {errorCase.title}
                              </CardTitle>
                              <Badge className={cn("shrink-0 border", diff.badge)}>
                                {errorCase.difficulty}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {errorCase.error.errorSummary}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Metadata row */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs capitalize font-normal">
                                  {errorCase.specialty.replace(/-/g, ' ')}
                                </Badge>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{errorCase.estimatedMinutes} min</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{errorCase.scenario.patientAge}yo {errorCase.scenario.patientSex}</span>
                              </div>

                              {/* Biases tags */}
                              <div className="flex flex-wrap gap-1.5">
                                {errorCase.analysis.cognitiveBiases.slice(0, 3).map(bias => (
                                  <Badge key={bias} variant="outline" className="text-xs font-normal bg-muted/30">
                                    <Brain className="h-3 w-3 mr-1 opacity-60" />
                                    {bias.replace(/-/g, ' ')}
                                  </Badge>
                                ))}
                                {errorCase.analysis.cognitiveBiases.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-normal bg-muted/30">
                                    +{errorCase.analysis.cognitiveBiases.length - 3} more
                                  </Badge>
                                )}
                              </div>

                              {/* Error summary row */}
                              <div className="pt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                  <span className="text-sm font-medium text-destructive">
                                    Misdiagnosed: {errorCase.error.initialDiagnosis}
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredErrorCases.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">No matching error cases</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="uncertainty">
                {/* Intro blurb */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-6">
                  <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                    <Scale className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">How it works</p>
                    <p className="text-sm text-muted-foreground">
                      Given an ambiguous presentation, rate your confidence for each differential diagnosis,
                      order diagnostic tests, update your probabilities using Bayesian reasoning, and calibrate your uncertainty.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {filteredUncertaintyCases.map((uCase, index) => {
                    const diff = getDifficultyColor(uCase.difficulty);
                    return (
                      <motion.div
                        key={uCase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -4 }}
                      >
                        <Card
                          className={cn(
                            "h-full border-l-4 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden",
                            diff.border
                          )}
                          onClick={() => navigate(`/uncertainty/${uCase.id}`)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg group-hover:text-violet-600 transition-colors">
                                {uCase.title}
                              </CardTitle>
                              <Badge className={cn("shrink-0 border", diff.badge)}>
                                {uCase.difficulty}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {uCase.presentation.chiefComplaint}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Metadata row */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs capitalize font-normal">
                                  {uCase.specialty.replace(/-/g, ' ')}
                                </Badge>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{uCase.presentation.age}yo {uCase.presentation.sex}</span>
                              </div>

                              {/* Differential info */}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Target className="h-4 w-4 text-violet-500" />
                                  <span>{uCase.differentials.length} differentials</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <BookOpen className="h-4 w-4 text-violet-500" />
                                  <span>{uCase.availableTests.length} tests available</span>
                                </div>
                              </div>

                              {/* Bayesian badge */}
                              <div className="pt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-violet-500" />
                                  <span className="text-sm text-muted-foreground">Practice Bayesian reasoning</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredUncertaintyCases.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">No matching uncertainty cases</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
