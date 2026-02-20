import { Header } from '@/components/layout/Header';
import { Leaderboard } from '@/components/team/Leaderboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompetitionLeaderboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/team')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team Room
            </Button>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Competition Leaderboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Top teams ranked by reasoning quality, accuracy, and efficiency
            </p>
          </div>

          {/* Scoring explanation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">How Scoring Works</CardTitle>
              <CardDescription>
                Teams are scored on four dimensions (max 100 points total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Speed (25 pts)</p>
                  <p className="text-muted-foreground text-xs">
                    Faster case resolution = higher score
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Efficiency (25 pts)</p>
                  <p className="text-muted-foreground text-xs">
                    Optimal test ordering, minimal waste
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Reasoning (25 pts)</p>
                  <p className="text-muted-foreground text-xs">
                    Quality of reasoning map & connections
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Accuracy (25 pts)</p>
                  <p className="text-muted-foreground text-xs">
                    Correct diagnosis + calibrated confidence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Leaderboard />

          {/* Call to action */}
          <Card className="mt-6">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Ready to compete?</p>
                    <p className="text-sm text-muted-foreground">
                      Create or join a team room to start a competition
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/team')}>
                  Start Competing
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
