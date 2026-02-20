import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompetitionResult {
  id: string;
  roomId: string;
  teamName: string;
  caseId: string;
  caseTitle: string;
  durationSeconds: number;
  testsOrdered: number;
  nodesCreated: number;
  connectionsCreated: number;
  diagnosisCorrect: boolean | null;
  confidenceRating: number | null;
  speedScore: number;
  efficiencyScore: number;
  reasoningScore: number;
  accuracyScore: number;
  totalScore: number;
  teamMembers: { id: string; displayName: string; color: string }[];
  completedAt: Date;
}

interface UseCompetitionReturn {
  leaderboard: CompetitionResult[];
  isLoading: boolean;
  submitResult: (result: Omit<CompetitionResult, 'id' | 'speedScore' | 'efficiencyScore' | 'reasoningScore' | 'accuracyScore' | 'totalScore' | 'completedAt'>) => Promise<void>;
  calculateScores: (params: {
    durationSeconds: number;
    testsOrdered: number;
    nodesCreated: number;
    connectionsCreated: number;
    diagnosisCorrect: boolean | null;
    confidenceRating: number | null;
  }) => { speedScore: number; efficiencyScore: number; reasoningScore: number; accuracyScore: number; totalScore: number };
}

export function useCompetition(): UseCompetitionReturn {
  const [leaderboard, setLeaderboard] = useState<CompetitionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('competition_results')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLeaderboard(
        (data || []).map((r) => ({
          id: r.id,
          roomId: r.room_id,
          teamName: r.team_name,
          caseId: r.case_id,
          caseTitle: r.case_title,
          durationSeconds: r.duration_seconds,
          testsOrdered: r.tests_ordered,
          nodesCreated: r.nodes_created,
          connectionsCreated: r.connections_created,
          diagnosisCorrect: r.diagnosis_correct,
          confidenceRating: r.confidence_rating,
          speedScore: r.speed_score,
          efficiencyScore: r.efficiency_score,
          reasoningScore: r.reasoning_score,
          accuracyScore: r.accuracy_score,
          totalScore: r.total_score,
          teamMembers: (r.team_members as any[]) || [],
          completedAt: new Date(r.completed_at),
        }))
      );
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'competition_results' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  // Calculate scores based on performance metrics
  const calculateScores = useCallback(
    (params: {
      durationSeconds: number;
      testsOrdered: number;
      nodesCreated: number;
      connectionsCreated: number;
      diagnosisCorrect: boolean | null;
      confidenceRating: number | null;
    }) => {
      const { durationSeconds, testsOrdered, nodesCreated, connectionsCreated, diagnosisCorrect, confidenceRating } = params;

      // Speed score: faster = better (max 25 points)
      // Baseline: 30 minutes = 1800 seconds
      const speedScore = Math.max(0, Math.min(25, Math.round(25 * (1 - durationSeconds / 3600))));

      // Efficiency score: fewer tests for correct diagnosis = better (max 25 points)
      // Baseline: 5 tests is optimal
      const efficiencyScore = Math.max(0, Math.min(25, Math.round(25 * Math.max(0, 1 - Math.abs(testsOrdered - 5) / 10))));

      // Reasoning quality score: based on canvas complexity (max 25 points)
      // Good reasoning has multiple nodes and connections
      const nodeScore = Math.min(10, nodesCreated);
      const connectionScore = Math.min(15, connectionsCreated * 3);
      const reasoningScore = Math.round(nodeScore + connectionScore);

      // Accuracy score: correct diagnosis + calibrated confidence (max 25 points)
      let accuracyScore = 0;
      if (diagnosisCorrect === true) {
        accuracyScore = 20;
        // Bonus for well-calibrated confidence
        if (confidenceRating !== null && confidenceRating >= 70) {
          accuracyScore += 5;
        }
      } else if (diagnosisCorrect === false) {
        // Partial credit for high uncertainty awareness
        if (confidenceRating !== null && confidenceRating < 50) {
          accuracyScore = 5;
        }
      }

      const totalScore = speedScore + efficiencyScore + reasoningScore + accuracyScore;

      return { speedScore, efficiencyScore, reasoningScore, accuracyScore, totalScore };
    },
    []
  );

  // Submit competition result
  const submitResult = useCallback(
    async (
      result: Omit<CompetitionResult, 'id' | 'speedScore' | 'efficiencyScore' | 'reasoningScore' | 'accuracyScore' | 'totalScore' | 'completedAt'>
    ) => {
      const scores = calculateScores({
        durationSeconds: result.durationSeconds,
        testsOrdered: result.testsOrdered,
        nodesCreated: result.nodesCreated,
        connectionsCreated: result.connectionsCreated,
        diagnosisCorrect: result.diagnosisCorrect,
        confidenceRating: result.confidenceRating,
      });

      try {
        const { error } = await supabase.from('competition_results').insert({
          room_id: result.roomId,
          team_name: result.teamName,
          case_id: result.caseId,
          case_title: result.caseTitle,
          duration_seconds: result.durationSeconds,
          tests_ordered: result.testsOrdered,
          nodes_created: result.nodesCreated,
          connections_created: result.connectionsCreated,
          diagnosis_correct: result.diagnosisCorrect,
          confidence_rating: result.confidenceRating,
          speed_score: scores.speedScore,
          efficiency_score: scores.efficiencyScore,
          reasoning_score: scores.reasoningScore,
          accuracy_score: scores.accuracyScore,
          total_score: scores.totalScore,
          team_members: result.teamMembers,
        });

        if (error) throw error;

        toast.success('Competition result submitted!');
        fetchLeaderboard();
      } catch (err) {
        console.error('Failed to submit result:', err);
        toast.error('Failed to submit competition result');
      }
    },
    [calculateScores, fetchLeaderboard]
  );

  return {
    leaderboard,
    isLoading,
    submitResult,
    calculateScores,
  };
}
