import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MentorMatch {
  id: string;
  learner_id: string;
  expert_id: string | null;
  case_id: string | null;
  status: string;
  specialty: string | null;
  message: string | null;
  matched_at: string | null;
  completed_at: string | null;
  created_at: string;
  learner_profile?: { display_name: string; specialty: string | null };
  expert_profile?: { display_name: string; specialty: string | null };
}

export function useMentorMatch() {
  const { user, role } = useAuthContext();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [availableExperts, setAvailableExperts] = useState<{ user_id: string; display_name: string; specialty: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('mentor_matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.flatMap(m => [m.learner_id, m.expert_id].filter(Boolean)))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, specialty')
        .in('user_id', userIds as string[]);

      const enriched = data.map(match => ({
        ...match,
        learner_profile: profiles?.find(p => p.user_id === match.learner_id),
        expert_profile: match.expert_id ? profiles?.find(p => p.user_id === match.expert_id) : undefined,
      }));
      setMatches(enriched);
    }
    setIsLoading(false);
  }, [user]);

  const loadExperts = useCallback(async () => {
    const { data: expertRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['expert', 'admin']);

    if (expertRoles && expertRoles.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, specialty')
        .in('user_id', expertRoles.map(r => r.user_id));

      setAvailableExperts(profiles || []);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    loadExperts();

    // Realtime subscription
    const channel = supabase
      .channel('mentor-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentor_matches' }, () => {
        loadMatches();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadMatches, loadExperts]);

  const requestMentor = async (specialty?: string, message?: string, expertId?: string) => {
    if (!user) return;

    const { error } = await supabase.from('mentor_matches').insert({
      learner_id: user.id,
      expert_id: expertId || null,
      specialty: specialty || null,
      message: message || null,
      status: expertId ? 'matched' : 'pending',
      matched_at: expertId ? new Date().toISOString() : null,
    });

    if (error) {
      toast({ title: 'Error requesting mentor', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: expertId ? 'Mentor matched!' : 'Match request sent' });
      loadMatches();
    }
  };

  const acceptMatch = async (matchId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('mentor_matches')
      .update({ expert_id: user.id, status: 'matched', matched_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) {
      toast({ title: 'Error accepting match', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Match accepted!' });
      loadMatches();
    }
  };

  const completeMatch = async (matchId: string) => {
    const { error } = await supabase
      .from('mentor_matches')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', matchId);

    if (!error) {
      toast({ title: 'Session completed' });
      loadMatches();
    }
  };

  return {
    matches,
    availableExperts,
    isLoading,
    requestMentor,
    acceptMatch,
    completeMatch,
    pendingRequests: matches.filter(m => m.status === 'pending' && !m.expert_id),
    myActiveMatches: matches.filter(m => m.status === 'matched' || m.status === 'active'),
  };
}
