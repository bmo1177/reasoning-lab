
-- Mentor matching requests table
CREATE TABLE public.mentor_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  expert_id UUID,
  case_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'active', 'completed', 'cancelled')),
  specialty TEXT,
  message TEXT,
  matched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.mentor_matches FOR SELECT
  USING (auth.uid() = learner_id OR auth.uid() = expert_id);

CREATE POLICY "Learners can create match requests"
  ON public.mentor_matches FOR INSERT
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Participants can update their matches"
  ON public.mentor_matches FOR UPDATE
  USING (auth.uid() = learner_id OR auth.uid() = expert_id);

-- Scratch pad / sub-graph storage
CREATE TABLE public.canvas_scratch_pads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  parent_node_id TEXT,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Scratch Pad',
  content JSONB NOT NULL DEFAULT '{}',
  pad_type TEXT NOT NULL DEFAULT 'scratch' CHECK (pad_type IN ('scratch', 'subgraph')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.canvas_scratch_pads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scratch pads"
  ON public.canvas_scratch_pads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Graph narratives (AI-generated text from graphs)
CREATE TABLE public.graph_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  canvas_state JSONB NOT NULL,
  narrative TEXT NOT NULL,
  narrative_type TEXT NOT NULL DEFAULT 'clinical' CHECK (narrative_type IN ('clinical', 'differential', 'summary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.graph_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own narratives"
  ON public.graph_narratives FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for mentor matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_matches;
