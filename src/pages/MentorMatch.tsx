import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMentorMatch } from '@/hooks/useMentorMatch';
import { Users, UserCheck, Clock, CheckCircle2, Send, Loader2, GraduationCap, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

const specialties = [
  'cardiology', 'pulmonology', 'gastroenterology', 'neurology',
  'endocrinology', 'infectious-disease', 'nephrology', 'hematology',
  'rheumatology', 'emergency',
];

export default function MentorMatch() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, role } = useAuthContext();
  const { matches, availableExperts, isLoading, requestMentor, acceptMatch, completeMatch, pendingRequests, myActiveMatches } = useMentorMatch();

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const isExpert = role === 'expert' || role === 'admin';

  const handleRequest = async () => {
    await requestMentor(selectedSpecialty || undefined, message || undefined, selectedExpert || undefined);
    setDialogOpen(false);
    setMessage('');
    setSelectedSpecialty('');
    setSelectedExpert('');
  };

  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    pending: { color: 'bg-warning/10 text-warning', icon: Clock },
    matched: { color: 'bg-info/10 text-info', icon: UserCheck },
    active: { color: 'bg-primary/10 text-primary', icon: Users },
    completed: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                Mentor Matching
              </h1>
              <p className="text-muted-foreground mt-1">
                {isExpert ? 'Guide learners through clinical reasoning sessions' : 'Get paired with an expert for guided case-solving'}
              </p>
            </div>

            {!isExpert && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Send className="h-4 w-4" /> Request Mentor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a Mentor Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Specialty (optional)</label>
                      <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger><SelectValue placeholder="Any specialty" /></SelectTrigger>
                        <SelectContent>
                          {specialties.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableExperts.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Choose Expert (optional)</label>
                        <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                          <SelectTrigger><SelectValue placeholder="Auto-match" /></SelectTrigger>
                          <SelectContent>
                            {availableExperts.filter(e => e.user_id !== user?.id).map(expert => (
                              <SelectItem key={expert.user_id} value={expert.user_id}>
                                {expert.display_name} {expert.specialty && `(${expert.specialty})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <Textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="What would you like help with?"
                      />
                    </div>

                    <Button onClick={handleRequest} className="w-full">Send Request</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Pending requests for experts */}
          {isExpert && pendingRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-warning" />
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingRequests.map(match => (
                  <Card key={match.id} className="border-warning/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{match.learner_profile?.display_name?.[0] || 'L'}</AvatarFallback></Avatar>
                        <div>
                          <CardTitle className="text-base">{match.learner_profile?.display_name || 'Learner'}</CardTitle>
                          {match.specialty && <Badge variant="outline" className="capitalize">{match.specialty.replace('-', ' ')}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {match.message && <p className="text-sm text-muted-foreground mb-3">{match.message}</p>}
                      <Button onClick={() => acceptMatch(match.id)} className="w-full gap-2">
                        <UserCheck className="h-4 w-4" /> Accept & Mentor
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active matches */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
            {myActiveMatches.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No active sessions</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myActiveMatches.map(match => {
                  const config = statusConfig[match.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <Card key={match.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar><AvatarFallback>
                              {(match.learner_id === user?.id ? match.expert_profile : match.learner_profile)?.display_name?.[0] || '?'}
                            </AvatarFallback></Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {(match.learner_id === user?.id ? match.expert_profile : match.learner_profile)?.display_name || 'Matching...'}
                              </CardTitle>
                              <CardDescription>
                                {match.learner_id === user?.id ? 'Your Mentor' : 'Your Learner'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={config.color}><StatusIcon className="h-3 w-3 mr-1" />{match.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {match.specialty && <Badge variant="outline" className="capitalize mb-2">{match.specialty.replace('-', ' ')}</Badge>}
                        <Button variant="outline" size="sm" onClick={() => completeMatch(match.id)} className="w-full mt-2">
                          Mark Complete
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Session History</h2>
            <div className="space-y-2">
              {matches.filter(m => m.status === 'completed').slice(0, 10).map(match => (
                <Card key={match.id} className="opacity-75">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">
                        {(match.learner_id === user?.id ? match.expert_profile : match.learner_profile)?.display_name || 'Unknown'}
                      </span>
                      {match.specialty && <Badge variant="secondary" className="text-xs capitalize">{match.specialty}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(match.created_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              ))}
              {matches.filter(m => m.status === 'completed').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No completed sessions yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
