import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Play, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BranchingCase } from '@/types/simulation';

interface SimulationPreStartProps {
    branchingCase: BranchingCase;
    onStart: () => void;
}

export function SimulationPreStart({ branchingCase, onStart }: SimulationPreStartProps) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-3xl">
                <Button asChild variant="ghost" className="mb-6 gap-2">
                    <Link to="/simulations">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Simulations
                    </Link>
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge>{branchingCase.specialty}</Badge>
                                <Badge variant="outline">{branchingCase.difficulty}</Badge>
                                {branchingCase.hasTimeLimit && (
                                    <Badge variant="destructive" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        Timed
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-2xl">{branchingCase.title}</CardTitle>
                            <CardDescription>{branchingCase.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Initial presentation */}
                            <div className="p-4 rounded-lg bg-muted">
                                <h3 className="font-medium mb-2">Initial Presentation</h3>
                                <p className="text-sm whitespace-pre-line">
                                    {branchingCase.initialPresentation}
                                </p>
                            </div>

                            {/* Learning objectives */}
                            <div>
                                <h3 className="font-medium mb-2">Learning Objectives</h3>
                                <ul className="space-y-1">
                                    {branchingCase.learningObjectives.map((obj, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            {obj}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Warning for timed cases */}
                            {branchingCase.hasTimeLimit && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
                                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Time-Critical Scenario</p>
                                        <p>
                                            You have {Math.floor((branchingCase.timeLimitSeconds || 600) / 60)} minutes
                                            to complete this case. Decisions have real consequences—delayed actions may
                                            worsen patient outcomes.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={onStart}
                                className="w-full gap-2"
                                size="lg"
                            >
                                <Play className="h-5 w-5" />
                                Start Simulation
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
