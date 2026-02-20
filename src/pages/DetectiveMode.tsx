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
import { Search, AlertTriangle, Scale, Sparkles, Clock, Brain } from 'lucide-react';
import { ErrorCaseGenerator } from '@/components/detective/ErrorCaseGenerator';

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

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Detective Mode</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Learn from clinical errors. Analyze flawed reasoning, identify cognitive biases, 
              and practice building correct diagnostic pathways.
            </p>
          </div>

          {/* AI Generator Section */}
          <div className="mb-8">
            <ErrorCaseGenerator onCaseGenerated={(id) => navigate(`/detective/${id}`)} />
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="error-cases" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error-Based Learning
              </TabsTrigger>
              <TabsTrigger value="uncertainty" className="gap-2">
                <Scale className="h-4 w-4" />
                Uncertainty Training
              </TabsTrigger>
            </TabsList>

            <TabsContent value="error-cases">
              <div className="grid gap-6 md:grid-cols-2">
                {filteredErrorCases.map((errorCase, index) => (
                  <motion.div
                    key={errorCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="clinical-card h-full hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/detective/${errorCase.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{errorCase.title}</CardTitle>
                          <Badge className={getDifficultyClass(errorCase.difficulty)}>
                            {errorCase.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {errorCase.error.errorSummary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{errorCase.estimatedMinutes} minutes</span>
                            <span className="mx-2">•</span>
                            <span className="capitalize">{errorCase.specialty}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {errorCase.analysis.cognitiveBiases.slice(0, 3).map(bias => (
                              <Badge key={bias} variant="outline" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                {bias.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                            {errorCase.analysis.cognitiveBiases.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{errorCase.analysis.cognitiveBiases.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between text-sm">
                            <div className="text-destructive font-medium">
                              Misdiagnosed: {errorCase.error.initialDiagnosis}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredErrorCases.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No error cases match your search.
                </div>
              )}
            </TabsContent>

            <TabsContent value="uncertainty">
              <div className="grid gap-6 md:grid-cols-2">
                {filteredUncertaintyCases.map((uCase, index) => (
                  <motion.div
                    key={uCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="clinical-card h-full hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/uncertainty/${uCase.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{uCase.title}</CardTitle>
                          <Badge className={getDifficultyClass(uCase.difficulty)}>
                            {uCase.difficulty}
                          </Badge>
                        </div>
                        <CardDescription>
                          {uCase.presentation.chiefComplaint}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{uCase.specialty}</span>
                            <span className="mx-2">•</span>
                            <span>{uCase.presentation.age}yo {uCase.presentation.sex}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {uCase.differentials.length} differential diagnoses to consider
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Practice Bayesian reasoning
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredUncertaintyCases.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No uncertainty cases match your search.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
