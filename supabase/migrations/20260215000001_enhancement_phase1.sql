-- Migration: Enhancement Phase 1 — New Tables
-- Created: 2026-02-15
-- Description: Adds 5 new tables for ECA sessions, competency framework,
--              learner competencies, error classifications, and skill trajectories.

-- ============================================
-- 1. ECA Session State
-- Stores the conversation history and state for the
-- Embodied Conversational Agent during a simulation.
-- ============================================
CREATE TABLE IF NOT EXISTS public.eca_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    affective_state TEXT DEFAULT 'neutral' CHECK (affective_state IN ('neutral', 'frustrated', 'confused', 'engaged', 'confident', 'overwhelmed')),
    hint_level INT DEFAULT 0 CHECK (hint_level >= 0 AND hint_level <= 3),
    total_hints_given INT DEFAULT 0,
    total_questions_asked INT DEFAULT 0,
    total_eca_responses INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. Competency Framework Nodes
-- Hierarchical competency tree:
-- Domain → Competency → Capability → Skill → Challenge
-- ============================================
CREATE TABLE IF NOT EXISTS public.competency_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.competency_nodes(id) ON DELETE SET NULL,
    node_key TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('domain', 'competency', 'capability', 'skill', 'challenge')),
    name TEXT NOT NULL,
    description TEXT,
    assessment_criteria JSONB DEFAULT '{}'::jsonb,
    color TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. Learner Competency Progress
-- Tracks each learner's mastery on each competency node.
-- ============================================
CREATE TABLE IF NOT EXISTS public.learner_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competency_node_id UUID REFERENCES public.competency_nodes(id) ON DELETE CASCADE,
    mastery_level FLOAT DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    attempts INT DEFAULT 0,
    last_assessed_at TIMESTAMPTZ,
    trajectory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, competency_node_id)
);

-- ============================================
-- 4. Error Classifications
-- Logs classified errors during simulations.
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL CHECK (error_type IN ('syntax', 'semantic', 'hesitation', 'premature_closure')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    stage_id TEXT,
    decision_id TEXT,
    description TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    hint_level_given INT DEFAULT 0,
    was_corrected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. Skill Trajectories (Longitudinal Tracking)
-- Records skill scores after each simulation for
-- longitudinal analysis and growth visualization.
-- ============================================
CREATE TABLE IF NOT EXISTS public.skill_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    competency_node_key TEXT,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 100),
    session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE SET NULL,
    measured_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_eca_sessions_simulation ON public.eca_sessions(simulation_session_id);
CREATE INDEX IF NOT EXISTS idx_eca_sessions_user ON public.eca_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_competency_nodes_parent ON public.competency_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_competency_nodes_level ON public.competency_nodes(level);
CREATE INDEX IF NOT EXISTS idx_learner_competencies_user ON public.learner_competencies(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_competencies_node ON public.learner_competencies(competency_node_id);
CREATE INDEX IF NOT EXISTS idx_error_classifications_session ON public.error_classifications(simulation_session_id);
CREATE INDEX IF NOT EXISTS idx_error_classifications_user ON public.error_classifications(user_id);
CREATE INDEX IF NOT EXISTS idx_error_classifications_type ON public.error_classifications(error_type);
CREATE INDEX IF NOT EXISTS idx_skill_trajectories_user ON public.skill_trajectories(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_trajectories_specialty ON public.skill_trajectories(specialty);
CREATE INDEX IF NOT EXISTS idx_skill_trajectories_measured ON public.skill_trajectories(measured_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- ECA Sessions
ALTER TABLE public.eca_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ECA sessions"
    ON public.eca_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ECA sessions"
    ON public.eca_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ECA sessions"
    ON public.eca_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Competency Nodes (read-only for all authenticated users)
ALTER TABLE public.competency_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view competency nodes"
    ON public.competency_nodes FOR SELECT
    USING (auth.role() = 'authenticated');

-- Learner Competencies
ALTER TABLE public.learner_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competencies"
    ON public.learner_competencies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competencies"
    ON public.learner_competencies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competencies"
    ON public.learner_competencies FOR UPDATE
    USING (auth.uid() = user_id);

-- Error Classifications
ALTER TABLE public.error_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own error classifications"
    ON public.error_classifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own error classifications"
    ON public.error_classifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Skill Trajectories
ALTER TABLE public.skill_trajectories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill trajectories"
    ON public.skill_trajectories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill trajectories"
    ON public.skill_trajectories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_eca_sessions_updated_at
    BEFORE UPDATE ON public.eca_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_learner_competencies_updated_at
    BEFORE UPDATE ON public.learner_competencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
