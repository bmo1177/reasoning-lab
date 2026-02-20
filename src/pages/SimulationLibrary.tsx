import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Play,
  Brain,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { sampleBranchingCases } from '@/data/sampleBranchingCases';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

const difficultyBorder: Record<string, string> = {
  beginner: 'border-l-success',
  intermediate: 'border-l-warning',
  advanced: 'border-l-destructive',
};

export default function SimulationLibrary() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filteredCases =
    activeTab === 'all'
      ? sampleBranchingCases
      : activeTab === 'timed'
        ? sampleBranchingCases.filter((c) => c.hasTimeLimit)
        : sampleBranchingCases.filter((c) => c.specialty === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 max-w-5xl">
        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              Clinical Simulations
            </h1>
            <p className="text-muted-foreground mt-1.5 max-w-lg text-sm">
              Practice decision-making with branching patient scenarios. Every choice shapes the outcome.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/simulation/${sampleBranchingCases[0]?.id}`)}
            className="shrink-0 gap-2"
          >
            <Play className="h-4 w-4" />
            Start a Case
          </Button>
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-muted-foreground tracking-wide uppercase">
                {filteredCases.length} simulation{filteredCases.length !== 1 ? 's' : ''}
              </p>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="timed" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Timed
                </TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
                <TabsTrigger value="endocrinology">Endocrine</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCases.map((sim, index) => (
                  <motion.div
                    key={sim.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <Card
                      className={cn(
                        "group cursor-pointer border-l-4 glass-card",
                        "hover:shadow-lg hover:-translate-y-0.5",
                        difficultyBorder[sim.difficulty] || 'border-l-border'
                      )}
                      onClick={() => navigate(`/simulation/${sim.id}`)}
                    >
                      <CardContent className="p-5">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="secondary" className="capitalize text-[11px] font-medium">
                            {sim.specialty}
                          </Badge>
                          <Badge className={cn("text-[11px] font-medium border-0", difficultyColors[sim.difficulty])}>
                            {sim.difficulty}
                          </Badge>
                          {sim.hasTimeLimit && (
                            <Badge variant="destructive" className="text-[11px] gap-1">
                              <Clock className="h-3 w-3" />
                              Timed
                            </Badge>
                          )}
                          {index < 3 && activeTab === 'all' && (
                            <Badge className="text-[11px] bg-primary/10 text-primary border-0 ml-auto">
                              <Zap className="h-3 w-3 mr-0.5" />
                              Recommended
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-primary transition-colors">
                          {sim.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {sim.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            ~{sim.estimatedMinutes} min
                          </span>
                          <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Start
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Empty state */}
        {filteredCases.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No simulations match this filter.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setActiveTab('all')}
            >
              View All
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
