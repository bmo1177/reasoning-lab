import { useState, useEffect, useCallback } from 'react';
import { ClinicalCase, DiagnosticTest, ReasoningNode } from '@/types/case';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Stethoscope,
  Activity,
  FlaskConical,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  Heart,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Pill,
  AlertTriangle,
  Lightbulb,
  Target,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { specialtyLabels, difficultyLabels } from '@/data/sampleCases';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CasePanelProps {
  clinicalCase: ClinicalCase;
  onTestOrdered?: (testId: string) => void;
}

interface DifferentialItem {
  id: string;
  name: string;
  likelihood: 'high' | 'moderate' | 'low';
  supportingEvidence: string[];
  againstEvidence: string[];
}

export function CasePanel({ clinicalCase, onTestOrdered }: CasePanelProps) {
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set(['presentation']));
  const [orderedTests, setOrderedTests] = useState<Set<string>>(new Set());
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [differentials, setDifferentials] = useState<DifferentialItem[]>([]);
  const [newDifferential, setNewDifferential] = useState('');
  const [activeTab, setActiveTab] = useState<'case' | 'differential'>('case');

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSection = (section: string) => {
    setRevealedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleOrderTest = (test: DiagnosticTest) => {
    setOrderedTests((prev) => new Set([...prev, test.id]));
    setExpandedTests((prev) => new Set([...prev, test.id]));
    onTestOrdered?.(test.id);
  };

  const toggleTestExpanded = (testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const addDifferential = useCallback(() => {
    if (newDifferential.trim()) {
      setDifferentials((prev) => [
        ...prev,
        {
          id: `diff-${Date.now()}`,
          name: newDifferential.trim(),
          likelihood: 'moderate',
          supportingEvidence: [],
          againstEvidence: [],
        },
      ]);
      setNewDifferential('');
    }
  }, [newDifferential]);

  const removeDifferential = useCallback((id: string) => {
    setDifferentials((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDifferentialLikelihood = useCallback((id: string, likelihood: 'high' | 'moderate' | 'low') => {
    setDifferentials((prev) =>
      prev.map((d) => (d.id === id ? { ...d, likelihood } : d))
    );
  }, []);

  const testCategories = {
    lab: clinicalCase.availableTests.filter((t) => t.category === 'lab'),
    imaging: clinicalCase.availableTests.filter((t) => t.category === 'imaging'),
    procedure: clinicalCase.availableTests.filter((t) => t.category === 'procedure'),
    physical: clinicalCase.availableTests.filter((t) => t.category === 'physical'),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with tabs */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {specialtyLabels[clinicalCase.specialty]}
          </Badge>
          <Badge variant="outline">{difficultyLabels[clinicalCase.difficulty]}</Badge>
        </div>
        <h2 className="text-base font-semibold leading-tight mb-2">{clinicalCase.title}</h2>
        
        {/* Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatTime(elapsedTime)}</span>
            <span className="text-xs">/ est. {clinicalCase.estimatedMinutes} min</span>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'case' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveTab('case')}
            >
              Case
            </Button>
            <Button
              variant={activeTab === 'differential' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveTab('differential')}
            >
              Differential ({differentials.length})
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 pb-8">
          {activeTab === 'case' ? (
            <>
              {/* Patient info */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {clinicalCase.patient.age} year old {clinicalCase.patient.sex}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chief Complaint
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-foreground">
                      {clinicalCase.patient.chiefComplaint}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs Card */}
              {clinicalCase.vitalSigns && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-node-symptom" />
                      Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="grid grid-cols-2 gap-3">
                      <VitalSignItem
                        icon={Gauge}
                        label="Blood Pressure"
                        value={clinicalCase.vitalSigns.bloodPressure}
                        unit="mmHg"
                        status={getBPStatus(clinicalCase.vitalSigns.bloodPressure)}
                      />
                      <VitalSignItem
                        icon={Heart}
                        label="Heart Rate"
                        value={clinicalCase.vitalSigns.heartRate.toString()}
                        unit="bpm"
                        status={getHRStatus(clinicalCase.vitalSigns.heartRate)}
                      />
                      <VitalSignItem
                        icon={Wind}
                        label="Respiratory Rate"
                        value={clinicalCase.vitalSigns.respiratoryRate.toString()}
                        unit="/min"
                        status={getRRStatus(clinicalCase.vitalSigns.respiratoryRate)}
                      />
                      <VitalSignItem
                        icon={Thermometer}
                        label="Temperature"
                        value={clinicalCase.vitalSigns.temperature.toString()}
                        unit="°C"
                        status={getTempStatus(clinicalCase.vitalSigns.temperature)}
                      />
                      <VitalSignItem
                        icon={Droplets}
                        label="SpO2"
                        value={clinicalCase.vitalSigns.oxygenSaturation.toString()}
                        unit="%"
                        status={getSpO2Status(clinicalCase.vitalSigns.oxygenSaturation)}
                        className="col-span-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Findings Summary - revealable */}
              <RevealableCard
                title="Key Findings"
                icon={Lightbulb}
                iconColor="text-amber-600"
                revealed={revealedSections.has('keyFindings')}
                onToggle={() => toggleSection('keyFindings')}
                className="bg-amber-50/50 border-amber-200"
              >
                  <ul className="space-y-1.5 pt-2">
                    <li className="text-sm flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{clinicalCase.patient.chiefComplaint}</span>
                    </li>
                    {clinicalCase.vitalSigns && (
                      <>
                        {clinicalCase.vitalSigns.heartRate > 100 && (
                          <li className="text-sm flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Tachycardia ({clinicalCase.vitalSigns.heartRate} bpm)</span>
                          </li>
                        )}
                        {clinicalCase.vitalSigns.temperature > 37.5 && (
                          <li className="text-sm flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Fever ({clinicalCase.vitalSigns.temperature}°C)</span>
                          </li>
                        )}
                        {clinicalCase.vitalSigns.oxygenSaturation < 95 && (
                          <li className="text-sm flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>Hypoxemia ({clinicalCase.vitalSigns.oxygenSaturation}%)</span>
                          </li>
                        )}
                      </>
                    )}
                    {orderedTests.size > 0 && (
                      <li className="text-sm flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{orderedTests.size} test(s) ordered</span>
                      </li>
                    )}
                  </ul>
              </RevealableCard>

              {/* Presentation */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Presentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {clinicalCase.presentation}
                  </p>
                </CardContent>
              </Card>

              {/* History - revealable */}
              {clinicalCase.history && (
                <RevealableCard
                  title="History"
                  icon={FileText}
                  iconColor="text-node-finding"
                  revealed={revealedSections.has('history')}
                  onToggle={() => toggleSection('history')}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {clinicalCase.history}
                  </p>
                </RevealableCard>
              )}

              {/* Physical Exam - revealable */}
              {clinicalCase.physicalExam && (
                <RevealableCard
                  title="Physical Exam"
                  icon={Stethoscope}
                  iconColor="text-node-diagnosis"
                  revealed={revealedSections.has('exam')}
                  onToggle={() => toggleSection('exam')}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {clinicalCase.physicalExam}
                  </p>
                </RevealableCard>
              )}

              {/* Learning Objectives - revealable */}
              <RevealableCard
                title="Learning Objectives"
                icon={Target}
                iconColor="text-blue-800"
                revealed={revealedSections.has('learningObjectives')}
                onToggle={() => toggleSection('learningObjectives')}
                className="bg-blue-50/50 border-blue-200"
              >
                  <ul className="space-y-1.5 pt-2">
                    {clinicalCase.learningObjectives.map((objective, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2 text-blue-900">
                        <span className="text-blue-600 mt-0.5">{idx + 1}.</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
              </RevealableCard>

              <Separator />

              {/* Diagnostic Tests */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-node-test" />
                  Order Tests
                  {orderedTests.size > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {orderedTests.size} ordered
                    </Badge>
                  )}
                </h3>
                
                {/* Labs */}
                {testCategories.lab.length > 0 && (
                  <TestCategorySection
                    title="Laboratory"
                    tests={testCategories.lab}
                    orderedTests={orderedTests}
                    expandedTests={expandedTests}
                    onOrder={handleOrderTest}
                    onToggle={toggleTestExpanded}
                  />
                )}

                {/* Imaging */}
                {testCategories.imaging.length > 0 && (
                  <TestCategorySection
                    title="Imaging"
                    tests={testCategories.imaging}
                    orderedTests={orderedTests}
                    expandedTests={expandedTests}
                    onOrder={handleOrderTest}
                    onToggle={toggleTestExpanded}
                  />
                )}

                {/* Procedures */}
                {testCategories.procedure.length > 0 && (
                  <TestCategorySection
                    title="Procedures"
                    tests={testCategories.procedure}
                    orderedTests={orderedTests}
                    expandedTests={expandedTests}
                    onOrder={handleOrderTest}
                    onToggle={toggleTestExpanded}
                  />
                )}
              </div>
            </>
          ) : (
            /* Differential Diagnosis Tab */
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Active Differential Diagnoses</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4 space-y-3">
                  {differentials.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No differentials added yet. Start building your differential!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {differentials.map((diff) => (
                        <DifferentialCard
                          key={diff.id}
                          differential={diff}
                          onRemove={() => removeDifferential(diff.id)}
                          onUpdateLikelihood={(likelihood) =>
                            updateDifferentialLikelihood(diff.id, likelihood)
                          }
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add New Differential */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Add Differential</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter diagnosis..."
                      value={newDifferential}
                      onChange={(e) => setNewDifferential(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDifferential()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addDifferential}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

// Helper Components

function VitalSignItem({
  icon: Icon,
  label,
  value,
  unit,
  status,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  className?: string;
}) {
  const statusColors = {
    normal: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  };

  const iconColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className={cn('rounded-lg border p-2.5', statusColors[status], className)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-3.5 w-3.5', iconColors[status])} />
        <span className="text-xs opacity-70">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-semibold">{value}</span>
        <span className="text-xs opacity-70">{unit}</span>
      </div>
    </div>
  );
}

function RevealableCard({
  title,
  icon: Icon,
  iconColor,
  revealed,
  onToggle,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  revealed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Collapsible open={revealed}>
      <Card className={cn(!revealed && 'opacity-75', className)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', iconColor)} />
                {title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="py-2 px-4 pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function TestCategorySection({
  title,
  tests,
  orderedTests,
  expandedTests,
  onOrder,
  onToggle,
}: {
  title: string;
  tests: DiagnosticTest[];
  orderedTests: Set<string>;
  expandedTests: Set<string>;
  onOrder: (test: DiagnosticTest) => void;
  onToggle: (testId: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-2">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            ordered={orderedTests.has(test.id)}
            expanded={expandedTests.has(test.id)}
            onOrder={() => onOrder(test)}
            onToggle={() => onToggle(test.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TestCard({
  test,
  ordered,
  expanded,
  onOrder,
  onToggle,
}: {
  test: DiagnosticTest;
  ordered: boolean;
  expanded: boolean;
  onOrder: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        ordered ? 'border-node-test/50 bg-node-test/5' : 'border-border bg-card hover:border-muted-foreground/30'
      )}
    >
      <div className="flex items-center justify-between p-2.5 px-3">
        <div className="flex items-center gap-2">
          {ordered && <CheckCircle2 className="h-4 w-4 text-node-test" />}
          <span className="text-sm font-medium">{test.name}</span>
        </div>
        {!ordered ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOrder}>
            Order
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onToggle}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <AnimatePresence>
        {ordered && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 border-t border-node-test/20 pt-2 space-y-2">
              <div>
                <p className="text-xs font-medium text-foreground mb-0.5">Result</p>
                <p className="text-sm text-muted-foreground">{test.result}</p>
              </div>
              {test.interpretation && (
                <div className="bg-node-test/10 rounded p-2">
                  <p className="text-xs font-medium text-node-test mb-0.5">Interpretation</p>
                  <p className="text-sm text-muted-foreground">{test.interpretation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DifferentialCard({
  differential,
  onRemove,
  onUpdateLikelihood,
}: {
  differential: DifferentialItem;
  onRemove: () => void;
  onUpdateLikelihood: (likelihood: 'high' | 'moderate' | 'low') => void;
}) {
  const likelihoodColors = {
    high: 'bg-red-50 border-red-200 text-red-900',
    moderate: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    low: 'bg-green-50 border-green-200 text-green-900',
  };

  const likelihoodLabels = {
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
  };

  return (
    <div className={cn('rounded-lg border p-3', likelihoodColors[differential.likelihood])}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{differential.name}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-1">
        {(['high', 'moderate', 'low'] as const).map((likelihood) => (
          <Button
            key={likelihood}
            variant={differential.likelihood === likelihood ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs flex-1"
            onClick={() => onUpdateLikelihood(likelihood)}
          >
            {likelihoodLabels[likelihood]}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Vital Signs Status Helpers
function getBPStatus(bp: string): 'normal' | 'warning' | 'critical' {
  const [systolic] = bp.split('/').map(Number);
  if (systolic >= 180) return 'critical';
  if (systolic >= 140) return 'warning';
  return 'normal';
}

function getHRStatus(hr: number): 'normal' | 'warning' | 'critical' {
  if (hr > 120 || hr < 50) return 'critical';
  if (hr > 100 || hr < 60) return 'warning';
  return 'normal';
}

function getRRStatus(rr: number): 'normal' | 'warning' | 'critical' {
  if (rr > 30 || rr < 10) return 'critical';
  if (rr > 24 || rr < 12) return 'warning';
  return 'normal';
}

function getTempStatus(temp: number): 'normal' | 'warning' | 'critical' {
  if (temp >= 39 || temp < 35) return 'critical';
  if (temp >= 38 || temp < 36) return 'warning';
  return 'normal';
}

function getSpO2Status(spo2: number): 'normal' | 'warning' | 'critical' {
  if (spo2 < 90) return 'critical';
  if (spo2 < 95) return 'warning';
  return 'normal';
}
