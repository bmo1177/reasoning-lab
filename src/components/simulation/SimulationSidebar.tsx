import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, Database, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientVitals } from '@/components/simulation/PatientVitals';
import type { PatientState } from '@/types/simulation';
import type { ConstraintValidation } from '@/services/constraintValidator';
import { cn } from '@/lib/utils';

interface SimulationSidebarProps {
    patientState: PatientState;
    revealedInfo: string[];
    warningHistory: ConstraintValidation[];
}

export function SimulationSidebar({
    patientState,
    revealedInfo,
    warningHistory,
}: SimulationSidebarProps) {
    return (
        <aside className="h-full flex flex-col gap-3 overflow-hidden">
            {/* Live Patient Monitor — capped at 40% height, scrollable */}
            <Card
                className="shrink-0 border-primary/20 bg-card/50 backdrop-blur-sm shadow-md overflow-hidden flex flex-col"
                style={{ maxHeight: '40%' }}
            >
                <CardHeader className="shrink-0 pb-1 pt-2 px-3 bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xs font-heading flex items-center gap-2 text-primary">
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Live Monitor
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-0 overflow-y-auto custom-scrollbar">
                    <div className="p-3">
                        <PatientVitals state={patientState} />
                    </div>
                </CardContent>
            </Card>

            {/* Information Gathered — fills remaining space */}
            <Card
                className="flex-1 min-h-0 flex flex-col border-border/60 bg-card/60 backdrop-blur-sm"
                style={{ minHeight: '45%' }}
            >
                <CardHeader className="shrink-0 pb-1 pt-2 px-3 border-b border-border/50">
                    <CardTitle className="text-xs font-heading flex items-center gap-2 text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        Clinical Data
                        {revealedInfo.length > 0 && (
                            <span className="ml-auto text-[10px] font-normal text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                                {revealedInfo.length}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
                    <div className="h-full overflow-y-auto px-3 py-2 custom-scrollbar">
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {revealedInfo.map((info, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10, height: 0 }}
                                        animate={{ opacity: 1, x: 0, height: "auto" }}
                                        className="p-2 rounded-lg bg-background/80 border border-border/50 text-xs shadow-sm flex gap-2"
                                    >
                                        <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                        <span>{info}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {revealedInfo.length === 0 && (
                                <div className="text-center text-xs text-muted-foreground py-6 italic">
                                    No findings gathered yet.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Warning History */}
            {warningHistory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="shrink-0"
                >
                    <Card className="border-warning/30 bg-warning/10">
                        <CardHeader className="pb-1 py-1.5 px-3">
                            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-warning">
                                <AlertTriangle className="h-3 w-3" />
                                Safety Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {warningHistory.map((warning, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "p-1.5 rounded text-xs border",
                                            warning.severity === 'critical' ? "bg-destructive/15 border-destructive/30 text-destructive" :
                                                "bg-warning/15 border-warning/30 text-warning"
                                        )}
                                    >
                                        {warning.message}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </aside>
    );
}
