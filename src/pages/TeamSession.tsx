import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Users, Vote, Loader2, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReasoningCanvas } from '@/components/canvas/ReasoningCanvas';
import { CasePanel } from '@/components/studio/CasePanel';
import { TeamChat } from '@/components/team/TeamChat';
import { TeamCursors } from '@/components/team/TeamCursors';
import { TeamVoting } from '@/components/team/TeamVoting';
import { SocraticTeamPrompt } from '@/components/team/SocraticTeamPrompt';
import { TeamSessionTimer } from '@/components/team/TeamSessionTimer';
import { VoiceChat } from '@/components/team/VoiceChat';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useTeamRoom } from '@/hooks/useTeamRoom';
import { useCompetition } from '@/hooks/useCompetition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicalCase } from '@/types/case';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TeamSession() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [showVoting, setShowVoting] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState<{ label: string; votes: number }[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [sessionStartTime] = useState(new Date());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [testsOrderedCount, setTestsOrderedCount] = useState(0);
  const [nodesCount, setNodesCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  
  const {
    roomCode,
    roomStatus,
    isHost,
    members,
    currentMember,
    messages,
    sendMessage,
    caseData,
    canvasState,
    updateCanvasState,
    leaveRoom,
    updateCursor,
    isLoading,
    error,
  } = useTeamRoom({ initialRoomId: urlRoomId });

  const { submitResult } = useCompetition();

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateCursor(e.clientX, e.clientY);
  }, [updateCursor]);

  // Handle canvas state changes - sync to room
  const handleCanvasChange = useCallback((state: { nodes: any[]; edges: any[] }) => {
    updateCanvasState(state);
  }, [updateCanvasState]);

  // Handle canvas metrics changes for Socratic prompts
  const handleMetricsChange = useCallback((metrics: { nodesCount: number; connectionsCount: number }) => {
    setNodesCount(metrics.nodesCount);
    setConnectionsCount(metrics.connectionsCount);
  }, []);

  // Timeout for loading state
  useEffect(() => {
    if (!caseData && !loadingTimeout) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [caseData, loadingTimeout]);

  // Cast caseData to ClinicalCase
  const clinicalCase = caseData as ClinicalCase | null;

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/team');
  };

  const handleStartVote = () => {
    // Simple voting example
    if (clinicalCase) {
      setVoteQuestion('What is the most likely diagnosis?');
      setVoteOptions([
        { label: 'Option A', votes: 0 },
        { label: 'Option B', votes: 0 },
        { label: 'Option C', votes: 0 },
        { label: 'Need more information', votes: 0 },
      ]);
      setShowVoting(true);
      setHasVoted(false);
    }
  };

  const handleVote = (optionIndex: number) => {
    setVoteOptions((prev) =>
      prev.map((opt, idx) =>
        idx === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt
      )
    );
    setHasVoted(true);
  };

  // Loading state with timeout handling
  if (!clinicalCase) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {isLoading && !loadingTimeout ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Loading session...</p>
              <p className="text-sm text-muted-foreground">Connecting to room...</p>
            </>
          ) : error || loadingTimeout ? (
            <>
              <p className="text-lg font-medium text-destructive">
                {error || 'Failed to load case data'}
              </p>
              <p className="text-sm text-muted-foreground">
                The session may have ended or you're not a member of this room.
              </p>
              <Button onClick={() => navigate('/team')}>
                Back to Team Room
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Loading case...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Live cursors */}
      {currentMember && (
        <TeamCursors members={members} currentMemberId={currentMember.id} />
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleLeave}>
            <ArrowLeft className="h-4 w-4" />
            Leave
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold leading-tight">{clinicalCase.title}</h1>
              <Badge variant="outline" className="text-xs">
                Room: {roomCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {clinicalCase.patient.age}yo {clinicalCase.patient.sex} — {clinicalCase.patient.chiefComplaint}
            </p>
          </div>
          <div className="h-6 w-px bg-border ml-2" />
          <TeamSessionTimer 
            startTime={sessionStartTime} 
            onTimeUpdate={setTimeElapsed} 
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Team members indicators */}
          <div className="flex -space-x-2 mr-4">
            {members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: member.color }}
                title={member.displayName}
              >
                {member.displayName.charAt(0).toUpperCase()}
              </div>
            ))}
            {members.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +{members.length - 5}
              </div>
            )}
          </div>

          {/* Voice chat */}
          <VoiceChat 
            onTranscript={(text, role) => {
              if (role === 'user') {
                sendMessage(`🎤 ${text}`);
              }
            }}
          />

          {isHost && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleStartVote}>
              <Vote className="h-4 w-4" />
              Start Vote
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate('/competition')}
          >
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
          {/* Case panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-r bg-card">
              <CasePanel clinicalCase={clinicalCase} onTestOrdered={() => setTestsOrderedCount(c => c + 1)} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Canvas */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <div className="h-full relative">
              <ReasoningCanvas 
                caseId={`team-${roomCode}`}
                initialCanvasState={canvasState}
                onCanvasChange={handleCanvasChange}
                onMetricsChange={handleMetricsChange}
              />

              {/* Socratic team prompts */}
              <SocraticTeamPrompt
                nodesCount={nodesCount}
                connectionsCount={connectionsCount}
                testsOrdered={testsOrderedCount}
                timeElapsedSeconds={timeElapsed}
              />

              {/* Team voting overlay */}
              {showVoting && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 z-20">
                  <TeamVoting
                    question={voteQuestion}
                    options={voteOptions}
                    totalMembers={members.length}
                    hasVoted={hasVoted}
                    onVote={handleVote}
                    onClose={() => setShowVoting(false)}
                    isHost={isHost}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Team panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-l bg-card">
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
                <TabsContent value="chat" className="flex-1 m-0">
                  {currentMember && (
                    <TeamChat
                      messages={messages}
                      members={members}
                      currentMemberId={currentMember.id}
                      onSendMessage={sendMessage}
                    />
                  )}
                </TabsContent>
                <TabsContent value="team" className="flex-1 m-0 p-4">
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Team Members ({members.length})</h3>
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-medium text-sm">{member.displayName}</span>
                        {member.isHost && (
                          <Badge variant="secondary" className="text-xs">Host</Badge>
                        )}
                        {member.id === currentMember?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.div>
    </div>
  );
}
