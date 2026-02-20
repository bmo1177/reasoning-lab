-- Table to store competition results for team leaderboards
CREATE TABLE public.competition_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  case_id TEXT NOT NULL,
  case_title TEXT NOT NULL,
  
  -- Scoring components
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  tests_ordered INTEGER NOT NULL DEFAULT 0,
  nodes_created INTEGER NOT NULL DEFAULT 0,
  connections_created INTEGER NOT NULL DEFAULT 0,
  diagnosis_correct BOOLEAN DEFAULT NULL,
  confidence_rating INTEGER DEFAULT NULL,
  
  -- Composite scores (calculated)
  speed_score INTEGER NOT NULL DEFAULT 0,        -- Based on time
  efficiency_score INTEGER NOT NULL DEFAULT 0,   -- Based on tests/steps
  reasoning_score INTEGER NOT NULL DEFAULT 0,    -- Based on canvas quality
  accuracy_score INTEGER NOT NULL DEFAULT 0,     -- Based on correct diagnosis
  total_score INTEGER NOT NULL DEFAULT 0,        -- Combined score
  
  -- Team members (stored as JSON array)
  team_members JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;

-- Anyone can view competition results (leaderboard is public)
CREATE POLICY "Anyone can view competition results"
ON public.competition_results
FOR SELECT
USING (true);

-- Anyone can create competition results
CREATE POLICY "Anyone can create competition results"
ON public.competition_results
FOR INSERT
WITH CHECK (true);

-- Create index for leaderboard queries
CREATE INDEX idx_competition_results_total_score ON public.competition_results(total_score DESC);
CREATE INDEX idx_competition_results_completed_at ON public.competition_results(completed_at DESC);

-- Enable realtime for competition_results
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_results;