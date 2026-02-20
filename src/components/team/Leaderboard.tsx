import { useCompetition } from '@/hooks/useCompetition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Clock, Target, Brain, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function Leaderboard() {
  const { leaderboard, isLoading } = useCompetition();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No competition results yet. Complete a team session to appear on the leaderboard!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((result, index) => (
          <div
            key={result.id}
            className={`p-4 rounded-lg border ${
              index === 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : index === 1
                ? 'bg-gray-500/10 border-gray-500/30'
                : index === 2
                ? 'bg-amber-600/10 border-amber-600/30'
                : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">{getRankIcon(index + 1)}</div>
                <div>
                  <p className="font-semibold">{result.teamName}</p>
                  <p className="text-xs text-muted-foreground">{result.caseTitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{result.totalScore}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Speed: {result.speedScore}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3 w-3" />
                Efficiency: {result.efficiencyScore}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Brain className="h-3 w-3" />
                Reasoning: {result.reasoningScore}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Target className="h-3 w-3" />
                Accuracy: {result.accuracyScore}
              </Badge>
            </div>

            {/* Team members */}
            <div className="mt-3 flex items-center gap-1">
              {result.teamMembers.slice(0, 4).map((member, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white -ml-1 first:ml-0 border-2 border-background"
                  style={{ backgroundColor: member.color }}
                  title={member.displayName}
                >
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {formatDistanceToNow(result.completedAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
