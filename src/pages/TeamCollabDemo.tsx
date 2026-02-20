import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    NodeProps,
    ValidationPolicy,
    Connection,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
    ArrowLeft,
    MessageSquare,
    Users,
    Vote,
    Trophy,
    Mic,
    Clock,
    User,
    Activity,
    FileText,
    Stethoscope,
    FlaskConical,
    Target,
    Lightbulb,
    Heart,
    Wind,
    Thermometer,
    Droplets,
    Gauge,
    Send,
    CheckCircle2,
    AlertTriangle,
    GitBranch,
    Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReasoningNodeComponent from '@/components/canvas/ReasoningNode';
import ConnectionEdge from '@/components/canvas/ConnectionEdge';
import { ReasoningNodeType } from '@/types/case';

// Custom Node Wrapper to include Author Badge
const DemoNode = ({ data, selected }: NodeProps) => {
    return (
        <div className="relative group/demo">
            <ReasoningNodeComponent
                id=""
                data={data}
                selected={selected}
                zIndex={0}
                isConnectable={false}
                positionAbsoluteX={0}
                positionAbsoluteY={0}
                type="demo"
                dragging={false}
                dragHandle=""
            />
            <div
                className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-sm z-10 animate-in fade-in zoom-in duration-300"
                style={{ backgroundColor: data.authorColor as string || '#3b82f6' }}
            >
                {data.author as string}
            </div>
        </div>
    );
};

const nodeTypes = {
    demo: DemoNode,
};

const edgeTypes = {
    connection: ConnectionEdge,
};

// Simulated case data
const demoCase = {
    title: 'Chest Pain in a Middle-Aged Executive',
    specialty: 'cardiology',
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    patient: {
        age: 52,
        sex: 'male',
        chiefComplaint: 'Severe chest pain for the past 2 hours',
    },
    vitalSigns: {
        bloodPressure: '165/95',
        heartRate: 98,
        respiratoryRate: 22,
        temperature: 37,
        oxygenSaturation: 96,
    },
    presentation:
        'Mr. Johnson is a 52-year-old male who presents to the emergency department with severe substernal chest pain that started 2 hours ago while he was in a business meeting. He describes the pain as "crushing" and rates it 8/10. The pain radiates to his left arm and jaw. He appears diaphoretic and anxious.',
    history: 'Patient has a history of hypertension and hyperlipidemia. He is a current smoker (1 pack/day for 30 years). Father had MI at age 55. No previous cardiac history.',
    physicalExam: 'Alert, anxious, diaphoretic. Heart: Regular rate and rhythm, no murmurs. Lungs: Clear bilaterally. Extremities: No edema.',
    learningObjectives: [
        'Recognize classic presentation of acute myocardial infarction',
        'Understand the urgency of STEMI diagnosis and treatment',
        'Identify major cardiac risk factors',
        'Differentiate MI from other causes of chest pain',
    ],
    availableTests: [
        { id: 'troponin', name: 'Troponin I', category: 'lab' },
        { id: 'bmp', name: 'Basic Metabolic Panel', category: 'lab' },
        { id: 'cbc', name: 'Complete Blood Count', category: 'lab' },
        { id: 'ddimer', name: 'D-Dimer', category: 'lab' },
        { id: 'cxr', name: 'Chest X-Ray', category: 'imaging' },
        { id: 'ecg', name: 'ECG/EKG', category: 'procedure' },
    ],
};

// Simulated team members
const teamMembers = [
    { id: 'aymen', name: 'Aymen', color: '#3b82f6', isHost: true },
    { id: 'kamal', name: 'Kamal', color: '#10b981', isHost: false },
];

// Initial Nodes Data
const initialDemoNodes: Node[] = [
    {
        id: '1',
        type: 'demo',
        position: { x: 50, y: 50 },
        data: { label: 'Crushing chest pain', nodeType: 'symptom', author: 'Aymen', authorColor: '#3b82f6' }
    },
    {
        id: '2',
        type: 'demo',
        position: { x: 280, y: 50 },
        data: { label: 'Radiates to arm/jaw', nodeType: 'symptom', author: 'Kamal', authorColor: '#10b981' }
    },
    {
        id: '3',
        type: 'demo',
        position: { x: 500, y: 50 },
        data: { label: 'Diaphoresis', nodeType: 'finding', author: 'Kamal', authorColor: '#10b981' }
    },
    {
        id: '4',
        type: 'demo',
        position: { x: 50, y: 200 },
        data: { label: 'HTN 165/95', nodeType: 'finding', author: 'Aymen', authorColor: '#3b82f6' }
    },
    {
        id: '5',
        type: 'demo',
        position: { x: 280, y: 200 },
        data: { label: 'STEMI?', nodeType: 'diagnosis', author: 'Both', authorColor: '#6366f1', confidence: 75 }
    },
    {
        id: '6',
        type: 'demo',
        position: { x: 500, y: 200 },
        data: { label: 'ECG ordered', nodeType: 'test', author: 'Kamal', authorColor: '#10b981' }
    },
];

// Initial Edges Data
const initialDemoEdges: Edge[] = [
    { id: 'e1-5', source: '1', target: '5', type: 'connection', data: { connectionType: 'supports-strong' } },
    { id: 'e2-5', source: '2', target: '5', type: 'connection', data: { connectionType: 'supports-strong' } },
    { id: 'e3-5', source: '3', target: '5', type: 'connection', data: { connectionType: 'supports-weak' } },
    { id: 'e4-5', source: '4', target: '5', type: 'connection', data: { connectionType: 'supports-weak' } },
    { id: 'e5-6', source: '5', target: '6', type: 'connection', data: { connectionType: 'neutral' } },
];

export default function TeamCollabDemo() {
    const navigate = useNavigate();
    const [elapsedTime, setElapsedTime] = useState(38);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialDemoNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialDemoEdges);

    const [orderedTests, setOrderedTests] = useState<Set<string>>(new Set(['ecg']));
    const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set(['presentation']));
    const [activeTab, setActiveTab] = useState<'case' | 'differential'>('case');
    const [chatInput, setChatInput] = useState('');

    // Timer simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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

    const handleOrderTest = (testId: string) => {
        setOrderedTests((prev) => new Set([...prev, testId]));
    };

    // Simulated chat messages
    const simulatedMessages = [
        { id: '1', memberId: 'aymen', memberName: 'Aymen', memberColor: '#3b82f6', message: 'Classic presentation of ACS. We should consider STEMI.', createdAt: new Date(Date.now() - 300000) },
        { id: '2', memberId: 'kamal', memberName: 'Kamal', memberColor: '#10b981', message: 'Agreed. The crushing pain radiating to arm and jaw is very concerning.', createdAt: new Date(Date.now() - 240000) },
        { id: '3', memberId: 'aymen', memberName: 'Aymen', memberColor: '#3b82f6', message: 'Should we order troponin and ECG first?', createdAt: new Date(Date.now() - 180000) },
        { id: '4', memberId: 'kamal', memberName: 'Kamal', memberColor: '#10b981', message: 'Yes, ECG is critical. Also check the BP - 165/95 is elevated.', createdAt: new Date(Date.now() - 120000) },
    ];

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b px-4 py-2 bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/team')}>
                        <ArrowLeft className="h-4 w-4" />
                        Leave
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-semibold leading-tight">{demoCase.title}</h1>
                            <Badge variant="outline" className="text-xs">
                                Room: FL4DYR
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {demoCase.patient.age}yo {demoCase.patient.sex} — {demoCase.patient.chiefComplaint}
                        </p>
                    </div>
                    <div className="h-6 w-px bg-border ml-2" />
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Team member avatars */}
                    <div className="flex -space-x-2 mr-4">
                        {teamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: member.color }}
                                title={member.name}
                            >
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>

                    <Button variant="outline" size="sm" className="gap-2">
                        <Mic className="h-4 w-4" />
                        Voice Chat
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Vote className="h-4 w-4" />
                        Start Vote
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Trophy className="h-4 w-4" />
                        Leaderboard
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-hidden"
            >
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left: Case Panel */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <div className="h-full border-r bg-card flex flex-col">
                            {/* Case header with tabs */}
                            <div className="border-b bg-card px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        Cardiology
                                    </Badge>
                                    <Badge variant="outline">Intermediate</Badge>
                                </div>
                                <h2 className="text-base font-semibold leading-tight mb-2">{demoCase.title}</h2>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-medium">{formatTime(elapsedTime)}</span>
                                        <span className="text-xs">/ est. {demoCase.estimatedMinutes} min</span>
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
                                            Differential (0)
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-4">
                                    {/* Patient info */}
                                    <Card className="border-l-4 border-l-primary">
                                        <CardHeader className="py-3 px-4">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                Patient Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4 space-y-2">
                                            <p className="text-sm font-medium">
                                                {demoCase.patient.age} year old {demoCase.patient.sex}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Chief Complaint</p>
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <p className="text-sm font-medium">{demoCase.patient.chiefComplaint}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Vital Signs */}
                                    <Card>
                                        <CardHeader className="py-3 px-4">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-blue-500" />
                                                Vital Signs
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <VitalItem icon={Gauge} label="Blood Pressure" value={demoCase.vitalSigns.bloodPressure} unit="mmHg" status="warning" />
                                                <VitalItem icon={Heart} label="Heart Rate" value={demoCase.vitalSigns.heartRate.toString()} unit="bpm" status="warning" />
                                                <VitalItem icon={Wind} label="Respiratory Rate" value={demoCase.vitalSigns.respiratoryRate.toString()} unit="/min" status="warning" />
                                                <VitalItem icon={Thermometer} label="Temperature" value={demoCase.vitalSigns.temperature.toString()} unit="°C" status="normal" />
                                                <VitalItem icon={Droplets} label="SpO2" value={demoCase.vitalSigns.oxygenSaturation.toString()} unit="%" status="normal" className="col-span-2" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Key Findings */}
                                    <Card className="bg-amber-50/50 border-amber-200">
                                        <CardHeader className="py-3 px-4">
                                            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                                                <Lightbulb className="h-4 w-4" />
                                                Key Findings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4">
                                            <ul className="space-y-1.5">
                                                <li className="text-sm flex items-start gap-2">
                                                    <span className="text-amber-600 mt-0.5">•</span>
                                                    <span>Severe chest pain for the past 2 hours</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    {/* Presentation */}
                                    <Card>
                                        <CardHeader className="py-3 px-4">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                Presentation
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4">
                                            <p className="text-sm text-muted-foreground leading-relaxed">{demoCase.presentation}</p>
                                        </CardContent>
                                    </Card>

                                    {/* History - collapsible */}
                                    <Card className={cn(!revealedSections.has('history') && 'opacity-75')}>
                                        <CardHeader
                                            className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleSection('history')}
                                        >
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-purple-500" />
                                                History
                                            </CardTitle>
                                        </CardHeader>
                                        <AnimatePresence>
                                            {revealedSections.has('history') && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <CardContent className="py-2 px-4 pt-0">
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{demoCase.history}</p>
                                                    </CardContent>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>

                                    {/* Order Tests */}
                                    <div>
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <FlaskConical className="h-4 w-4 text-amber-500" />
                                            Order Tests
                                        </h3>
                                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Laboratory</p>
                                        <div className="space-y-2 mb-4">
                                            {demoCase.availableTests.filter(t => t.category === 'lab').map((test) => (
                                                <TestItem
                                                    key={test.id}
                                                    name={test.name}
                                                    ordered={orderedTests.has(test.id)}
                                                    onOrder={() => handleOrderTest(test.id)}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Imaging</p>
                                        <div className="space-y-2 mb-4">
                                            {demoCase.availableTests.filter(t => t.category === 'imaging').map((test) => (
                                                <TestItem
                                                    key={test.id}
                                                    name={test.name}
                                                    ordered={orderedTests.has(test.id)}
                                                    onOrder={() => handleOrderTest(test.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Center: Canvas */}
                    <ResizablePanel defaultSize={55} minSize={40}>
                        <div className="h-full relative bg-canvas-background">
                            {/* React Flow Diagram */}
                            <ReactFlowProvider>
                                <div className="absolute inset-0">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        nodeTypes={nodeTypes}
                                        edgeTypes={edgeTypes}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                                        panOnDrag={false}
                                        panOnScroll={false}
                                        zoomOnScroll={false}
                                        zoomOnPinch={false}
                                        nodesDraggable={false}
                                        proOptions={{ hideAttribution: true }}
                                        snapToGrid
                                        snapGrid={[15, 15]}
                                        className="bg-canvas-background"
                                    >
                                        <Background gap={20} size={1} className="opacity-50" />
                                        <Controls showInteractive={false} />
                                        <MiniMap
                                            nodeColor={(node) => {
                                                const type = node.data?.nodeType as ReasoningNodeType;
                                                const colors: Record<ReasoningNodeType, string> = {
                                                    symptom: 'hsl(var(--node-symptom))',
                                                    finding: 'hsl(var(--node-finding))',
                                                    diagnosis: 'hsl(var(--node-diagnosis))',
                                                    test: 'hsl(var(--node-test))',
                                                    note: 'hsl(var(--muted-foreground))',
                                                    treatment: '#10b981',
                                                    outcome: '#3b82f6',
                                                    'risk-factor': '#f97316',
                                                    complication: '#ef4444',
                                                };
                                                return colors[type] || 'hsl(var(--primary))';
                                            }}
                                            maskColor="hsl(var(--background) / 0.8)"
                                            className="!bg-card !border !border-border rounded-lg"
                                        />
                                    </ReactFlow>
                                </div>
                            </ReactFlowProvider>

                            {/* Animated cursors overlay */}
                            <div className="absolute inset-0 pointer-events-none z-10">
                                <motion.div
                                    animate={{ x: [400, 430, 400], y: [220, 240, 220] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute"
                                >
                                    <div className="relative">
                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent border-l-transparent rotate-45" />
                                        <span className="absolute left-3 top-0 text-[10px] bg-blue-500 text-white px-1 rounded shadow-sm">Aymen</span>
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={{ x: [280, 300, 280], y: [160, 180, 160] }}
                                    transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                                    className="absolute"
                                >
                                    <div className="relative">
                                        <div className="w-3 h-3 border-2 border-green-500 border-t-transparent border-l-transparent rotate-45" />
                                        <span className="absolute left-3 top-0 text-[10px] bg-green-500 text-white px-1 rounded shadow-sm">Kamal</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Canvas Toolbar (left side) */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-card border rounded-lg shadow-lg p-2 space-y-2 z-20">
                                <div className="text-[10px] font-medium text-center text-muted-foreground mb-1">Add Node</div>
                                {[
                                    { type: 'symptom', label: 'Symptom', color: 'bg-blue-500' },
                                    { type: 'finding', label: 'Finding', color: 'bg-purple-500' },
                                    { type: 'diagnosis', label: 'Diagnosis', color: 'bg-teal-500' },
                                    { type: 'test', label: 'Test', color: 'bg-amber-500' },
                                ].map((item) => (
                                    <Button
                                        key={item.type}
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2 h-8 text-xs justify-start"
                                    >
                                        <span className={`w-3 h-3 rounded ${item.color}`} />
                                        {item.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Scratch Pad hint */}
                            <div className="absolute right-3 bottom-3 bg-card border rounded-lg shadow-lg p-3 w-48 z-20">
                                <div className="text-xs font-medium mb-1">Scratch Pad</div>
                                <p className="text-[10px] text-muted-foreground">
                                    No pads yet. Create one
                                </p>
                                <p className="text-[10px] text-primary mt-2 italic">
                                    Verbalizing uncertainty helps the whole team learn.
                                </p>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right: Chat/Team Panel */}
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                        <div className="h-full border-l bg-card flex flex-col">
                            <Tabs defaultValue="chat" className="h-full flex flex-col">
                                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                                    <TabsTrigger value="chat" className="gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Chat
                                    </TabsTrigger>
                                    <TabsTrigger value="team" className="gap-2">
                                        <Users className="h-4 w-4" />
                                        Team
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="chat" className="flex-1 m-0 flex flex-col">
                                    {/* Chat header */}
                                    <div className="p-3 border-b">
                                        <h3 className="font-semibold text-sm">Team Chat</h3>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {teamMembers.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                                    style={{ backgroundColor: `${member.color}20`, color: member.color }}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }} />
                                                    {member.name}
                                                    {member.isHost && <span className="text-[10px] opacity-70">(host)</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <ScrollArea className="flex-1 p-3">
                                        <div className="space-y-3">
                                            {simulatedMessages.map((msg) => (
                                                <div key={msg.id} className="flex flex-col items-start">
                                                    <span
                                                        className="text-xs font-medium mb-0.5"
                                                        style={{ color: msg.memberColor }}
                                                    >
                                                        {msg.memberName}
                                                    </span>
                                                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted">
                                                        {msg.message}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    {/* Chat input */}
                                    <div className="p-3 border-t">
                                        <div className="flex gap-2">
                                            <Input
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1"
                                            />
                                            <Button size="icon" disabled={!chatInput.trim()}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="team" className="flex-1 m-0 p-4">
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-sm">Team Members (2)</h3>
                                        {teamMembers.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                                                <span className="font-medium text-sm">{member.name}</span>
                                                {member.isHost && <Badge variant="secondary" className="text-xs">Host</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </motion.div>

            {/* Footer metrics bar */}
            <footer className="border-t bg-card px-4 py-3">
                <div className="flex items-center justify-center gap-8">
                    <MetricItem icon={Share2} label="Contributions" value="21" color="text-primary" />
                    <MetricItem icon={CheckCircle2} label="Peer Reviews" value="19" color="text-green-500" />
                    <MetricItem icon={AlertTriangle} label="Contradictions" value="2" color="text-red-500" />
                    <MetricItem icon={Users} label="Consensus" value="5" color="text-blue-500" />
                    <MetricItem icon={GitBranch} label="Nodes" value="6" color="text-purple-500" />
                    <MetricItem icon={Clock} label="Duration" value={formatTime(elapsedTime)} color="text-amber-500" />
                </div>
            </footer>
        </div>
    );
}

// Helper Components
function VitalItem({
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
        <div className={cn('rounded-lg border p-2', statusColors[status], className)}>
            <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={cn('h-3 w-3', iconColors[status])} />
                <span className="text-[10px] opacity-70">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold">{value}</span>
                <span className="text-sm opacity-70 ml-1">{unit}</span>
            </div>
        </div>
    );
}

function TestItem({ name, ordered, onOrder }: { name: string; ordered: boolean; onOrder: () => void }) {
    return (
        <div
            className={cn(
                'rounded-lg border transition-all flex items-center justify-between p-2 px-3',
                ordered ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-card hover:border-muted-foreground/30'
            )}
        >
            <div className="flex items-center gap-2">
                {ordered && <CheckCircle2 className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">{name}</span>
            </div>
            {!ordered && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOrder}>
                    Order
                </Button>
            )}
        </div>
    );
}

function MetricItem({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', color)} />
            <div className="text-center">
                <span className="font-semibold text-sm">{value}</span>
                <span className="text-xs text-muted-foreground ml-1">{label}</span>
            </div>
        </div>
    );
}
