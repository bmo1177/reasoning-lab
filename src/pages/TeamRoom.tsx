import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, LogIn, Copy, Check, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTeamRoom } from '@/hooks/useTeamRoom';
import { sampleCases, specialtyLabels } from '@/data/sampleCases';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TeamRoom() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCaseSelect, setShowCaseSelect] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  const {
    roomId,
    roomCode,
    roomStatus,
    isHost,
    members,
    currentMember,
    messages,
    caseData,
    createRoom,
    joinRoom,
    leaveRoom,
    startSession,
    setCaseData,
    isLoading,
  } = useTeamRoom();

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    await createRoom(displayName);
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 6) {
      toast.error('Please enter a valid 6-character room code');
      return;
    }
    const success = await joinRoom(joinCode, displayName);
    if (success && roomStatus === 'active') {
      navigate(`/team-session/${roomId}`);
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied!');
    }
  };

  const handleSelectCase = async () => {
    if (!selectedCaseId) return;
    const selectedCase = sampleCases.find((c) => c.id === selectedCaseId);
    if (selectedCase) {
      await setCaseData(selectedCase);
      setShowCaseSelect(false);
      toast.success('Case selected!');
    }
  };

  const handleStartSession = async () => {
    if (!caseData) {
      toast.error('Please select a case first');
      return;
    }
    await startSession();
    navigate(`/team-session/${roomId}`);
  };

  // If in a room, show lobby
  if (roomId && roomStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Team Lobby</CardTitle>
                <CardDescription>
                  Waiting for team members to join...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room code */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Room Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold tracking-widest">{roomCode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with your team members
                  </p>
                </div>

                {/* Members list */}
                <div>
                  <h3 className="font-medium mb-3">Team Members ({members.length})</h3>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-medium">{member.displayName}</span>
                        {member.isHost && (
                          <Badge variant="secondary" className="text-xs">Host</Badge>
                        )}
                        {member.id === currentMember?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case selection (host only) */}
                {isHost && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Select Case</h3>
                    {caseData ? (
                      <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                        <p className="font-medium">{caseData.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {specialtyLabels[caseData.specialty]} • {caseData.difficulty}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowCaseSelect(true)}
                        >
                          Change Case
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowCaseSelect(true)}
                      >
                        Select a Case
                      </Button>
                    )}
                  </div>
                )}

                {/* Show selected case for non-hosts */}
                {!isHost && caseData && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Selected Case</h3>
                    <div className="p-3 rounded-lg border">
                      <p className="font-medium">{caseData.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {specialtyLabels[caseData.specialty]} • {caseData.difficulty}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={leaveRoom}>
                    Leave Room
                  </Button>
                  {isHost && (
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleStartSession}
                      disabled={members.length < 2 || !caseData}
                    >
                      <Play className="h-4 w-4" />
                      Start Session
                    </Button>
                  )}
                  {!isHost && (
                    <p className="flex-1 text-sm text-muted-foreground text-center self-center">
                      Waiting for host to start...
                    </p>
                  )}
                </div>
                {isHost && members.length < 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Need at least 2 members to start
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>

        {/* Case selection dialog */}
        <Dialog open={showCaseSelect} onOpenChange={setShowCaseSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Case</DialogTitle>
              <DialogDescription>
                Choose a clinical case for your team to solve together
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" className="max-h-[300px]">
                  {sampleCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {specialtyLabels[c.specialty]} • {c.difficulty}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={handleSelectCase}
                disabled={!selectedCaseId}
              >
                Confirm Selection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default: show create/join options
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
            <p className="mt-2 text-muted-foreground">
              Work through clinical cases together in real-time with your peers.
            </p>
          </div>

          {/* Name input */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Your Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <CardTitle>Create a Room</CardTitle>
                <CardDescription>
                  Start a new collaborative session and invite your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full gap-2"
                  onClick={handleCreateRoom}
                  disabled={isLoading || !displayName.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create New Room
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <LogIn className="h-6 w-6" />
                </div>
                <CardTitle>Join a Room</CardTitle>
                <CardDescription>
                  Enter a room code to join an existing session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Enter room code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg tracking-widest uppercase"
                />
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  onClick={handleJoinRoom}
                  disabled={isLoading || !displayName.trim() || joinCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Join Room
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Demo Link */}
          <Card className="mt-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">See Team Collaboration in Action</h3>
                    <p className="text-sm text-muted-foreground">
                      Watch a simulated session between Aymen & Kamal
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/team-demo')} className="gap-2">
                  View Demo
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Collaborative Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  <span>
                    <strong>Shared Canvas</strong> - Multiple users can edit the same
                    reasoning map simultaneously, like Figma
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  <span>
                    <strong>Live Cursors</strong> - See where your teammates are
                    working on the canvas in real-time
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  <span>
                    <strong>Team Chat</strong> - Discuss your reasoning with
                    integrated text chat alongside the canvas
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    4
                  </span>
                  <span>
                    <strong>Voting & Decisions</strong> - Use polls to make group
                    decisions about diagnoses
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
