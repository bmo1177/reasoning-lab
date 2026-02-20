-- Phase 1: Learning Analytics Backbone
-- AI-Driven Adaptive Clinical Simulation with Learning Analytics

-- ============================================
-- 1. SIMULATION_SESSIONS
-- Tracks detailed simulation attempts with full decision paths
-- ============================================
CREATE TABLE public.simulation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  case_title TEXT,
  specialty TEXT,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- Timing metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_duration_seconds INT,
  
  -- Performance metrics
  total_cost INT NOT NULL DEFAULT 0,
  optimal_path_deviation_score FLOAT, -- Percentage match to optimal (0-100)
  stages_completed INT NOT NULL DEFAULT 0,
  decisions_made INT NOT NULL DEFAULT 0,
  critical_errors INT NOT NULL DEFAULT 0,
  warnings_ignored INT NOT NULL DEFAULT 0,
  
  -- Adaptive data
  initial_difficulty TEXT,
  adapted_difficulty TEXT,
  adaptation_reason TEXT,
  
  -- Learning analytics
  learning_objectives_achieved JSONB NOT NULL DEFAULT '[]',
  cognitive_biases_detected JSONB NOT NULL DEFAULT '[]',
  average_decision_time_seconds FLOAT,
  
  -- Full decision path for analysis
  decision_path JSONB NOT NULL DEFAULT '[]',
  
  -- Instructor assignment
  instructor_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own simulation sessions"
  ON public.simulation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulation sessions"
  ON public.simulation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulation sessions"
  ON public.simulation_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Instructor can view assigned student sessions
CREATE POLICY "Instructors can view assigned student sessions"
  ON public.simulation_sessions FOR SELECT
  USING (auth.uid() = instructor_id);

-- Indexes
CREATE INDEX idx_simulation_sessions_user_id ON public.simulation_sessions(user_id);
CREATE INDEX idx_simulation_sessions_status ON public.simulation_sessions(status);
CREATE INDEX idx_simulation_sessions_instructor_id ON public.simulation_sessions(instructor_id);
CREATE INDEX idx_simulation_sessions_case_id ON public.simulation_sessions(case_id);
CREATE INDEX idx_simulation_sessions_created_at ON public.simulation_sessions(created_at DESC);

-- ============================================
-- 2. USER_SKILL_PROFILES
-- Aggregated performance data per user for adaptive learning
-- ============================================
CREATE TABLE public.user_skill_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Specialty-specific skills
  -- Format: {"cardiology": {"level": 7.5, "cases_completed": 12, "accuracy": 0.85, "avg_cost": 450}, ...}
  specialty_skills JSONB NOT NULL DEFAULT '{}',
  
  -- Learning preferences
  preferred_difficulty TEXT NOT NULL DEFAULT 'intermediate',
  average_completion_time_by_difficulty JSONB NOT NULL DEFAULT '{}',
  
  -- Performance areas
  weakness_areas JSONB NOT NULL DEFAULT '[]',
  strength_areas JSONB NOT NULL DEFAULT '[]',
  
  -- Cognitive bias patterns
  frequent_biases JSONB NOT NULL DEFAULT '[]',
  bias_improvement_trends JSONB NOT NULL DEFAULT '{}',
  
  -- Adaptive preferences
  learning_style JSONB NOT NULL DEFAULT '{"pace": "moderate", "feedback_frequency": "immediate"}',
  
  -- Overall metrics
  total_simulations_completed INT NOT NULL DEFAULT 0,
  total_simulations_abandoned INT NOT NULL DEFAULT 0,
  overall_accuracy FLOAT,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_skill_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own skill profile"
  ON public.user_skill_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update skill profiles"
  ON public.user_skill_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Instructors can view assigned student profiles
CREATE POLICY "Instructors can view assigned student profiles"
  ON public.user_skill_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulation_sessions 
      WHERE simulation_sessions.user_id = user_skill_profiles.user_id
      AND simulation_sessions.instructor_id = auth.uid()
    )
  );

CREATE INDEX idx_user_skill_profiles_user_id ON public.user_skill_profiles(user_id);

-- ============================================
-- 3. LEARNING_ANALYTICS
-- Fine-grained event tracking for detailed analysis
-- ============================================
CREATE TABLE public.learning_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'decision_made',
    'stage_advanced',
    'info_revealed',
    'time_critical',
    'branch_triggered',
    'constraint_warning_shown',
    'constraint_warning_heeded',
    'constraint_warning_ignored',
    'whatif_explored',
    'simulation_completed',
    'simulation_abandoned',
    'patient_state_changed'
  )),
  
  -- Event details
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Context
  stage_id TEXT,
  decision_id TEXT,
  decision_type TEXT, -- 'test', 'treatment', 'consultation', etc.
  patient_state_snapshot JSONB,
  time_elapsed_seconds INT NOT NULL,
  
  -- Performance indicators
  was_optimal BOOLEAN,
  deviation_from_optimal FLOAT,
  decision_time_seconds FLOAT, -- Time spent on this decision
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analytics"
  ON public.learning_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON public.learning_analytics FOR INSERT
  WITH CHECK (true);

-- Instructors can view assigned student analytics
CREATE POLICY "Instructors can view assigned student analytics"
  ON public.learning_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulation_sessions 
      WHERE simulation_sessions.id = learning_analytics.simulation_session_id
      AND simulation_sessions.instructor_id = auth.uid()
    )
  );

-- Indexes for analytics queries
CREATE INDEX idx_learning_analytics_session_id ON public.learning_analytics(simulation_session_id);
CREATE INDEX idx_learning_analytics_user_id ON public.learning_analytics(user_id);
CREATE INDEX idx_learning_analytics_event_type ON public.learning_analytics(event_type);
CREATE INDEX idx_learning_analytics_created_at ON public.learning_analytics(created_at DESC);
CREATE INDEX idx_learning_analytics_decision ON public.learning_analytics(decision_id);

-- ============================================
-- 4. CONSTRAINT_VIOLATIONS
-- Tracks when learners make clinically questionable decisions
-- ============================================
CREATE TABLE public.constraint_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  violation_type TEXT NOT NULL, -- 'medication_error', 'timing_error', 'contraindication', 'dose_error', 'protocol_deviation'
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'critical')),
  
  -- Context
  stage_id TEXT,
  decision_id TEXT,
  decision_label TEXT,
  violation_description TEXT NOT NULL,
  
  -- Correction guidance
  suggested_correction TEXT,
  clinical_rationale TEXT,
  
  -- Outcome
  was_heeded BOOLEAN DEFAULT FALSE,
  alternative_chosen TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.constraint_violations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own constraint violations"
  ON public.constraint_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert constraint violations"
  ON public.constraint_violations FOR INSERT
  WITH CHECK (true);

-- Instructors can view assigned student violations
CREATE POLICY "Instructors can view assigned student violations"
  ON public.constraint_violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulation_sessions 
      WHERE simulation_sessions.id = constraint_violations.simulation_session_id
      AND simulation_sessions.instructor_id = auth.uid()
    )
  );

CREATE INDEX idx_constraint_violations_session_id ON public.constraint_violations(simulation_session_id);
CREATE INDEX idx_constraint_violations_user_id ON public.constraint_violations(user_id);
CREATE INDEX idx_constraint_violations_type ON public.constraint_violations(violation_type);

-- ============================================
-- 5. INSTRUCTOR_STUDENT_ASSIGNMENTS
-- Tracks which students are assigned to which instructors
-- ============================================
CREATE TABLE public.instructor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  assignment_type TEXT NOT NULL DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'course', 'rotation')),
  notes TEXT,
  
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  
  UNIQUE(instructor_id, student_id)
);

-- Enable RLS
ALTER TABLE public.instructor_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Instructors can view their assignments"
  ON public.instructor_assignments FOR SELECT
  USING (auth.uid() = instructor_id);

CREATE POLICY "Students can view their instructor"
  ON public.instructor_assignments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage assignments"
  ON public.instructor_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_instructor_assignments_instructor ON public.instructor_assignments(instructor_id);
CREATE INDEX idx_instructor_assignments_student ON public.instructor_assignments(student_id);

-- ============================================
-- 6. WHATIF_SCENARIOS (For future What-If Reasoning feature)
-- Stores alternative decision paths
-- ============================================
CREATE TABLE public.whatif_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  
  -- Original decision context
  stage_id TEXT NOT NULL,
  decision_made TEXT NOT NULL,
  decision_made_label TEXT,
  
  -- Alternative decision
  alternative_decision TEXT NOT NULL,
  alternative_decision_label TEXT,
  
  -- Generated scenario
  scenario_title TEXT,
  scenario_description TEXT,
  predicted_outcome TEXT CHECK (predicted_outcome IN ('better', 'worse', 'similar', 'different')),
  predicted_patient_state JSONB,
  explanation TEXT,
  
  -- Learning value
  learning_objective TEXT,
  key_insight TEXT,
  
  -- Engagement tracking
  was_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  was_explored BOOLEAN NOT NULL DEFAULT FALSE,
  explored_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatif_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own what-if scenarios"
  ON public.whatif_scenarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulation_sessions 
      WHERE simulation_sessions.id = whatif_scenarios.simulation_session_id
      AND simulation_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert what-if scenarios"
  ON public.whatif_scenarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own what-if scenarios"
  ON public.whatif_scenarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.simulation_sessions 
      WHERE simulation_sessions.id = whatif_scenarios.simulation_session_id
      AND simulation_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX idx_whatif_scenarios_session_id ON public.whatif_scenarios(simulation_session_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user skill profile after simulation completion
CREATE OR REPLACE FUNCTION public.update_user_skill_profile(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_specialty TEXT;
  v_difficulty TEXT;
  v_completed INT;
  v_accuracy FLOAT;
  v_specialty_data JSONB;
BEGIN
  -- Get aggregate data for each specialty
  FOR v_specialty IN
    SELECT DISTINCT specialty 
    FROM public.simulation_sessions 
    WHERE user_id = p_user_id 
    AND specialty IS NOT NULL
  LOOP
    -- Calculate metrics for this specialty
    SELECT 
      COUNT(*) FILTER (WHERE status = 'completed'),
      AVG(optimal_path_deviation_score) FILTER (WHERE status = 'completed'),
      AVG(total_cost) FILTER (WHERE status = 'completed')
    INTO v_completed, v_accuracy, v_specialty_data
    FROM public.simulation_sessions
    WHERE user_id = p_user_id
    AND specialty = v_specialty;
    
    -- Update or insert specialty skill data
    UPDATE public.user_skill_profiles
    SET specialty_skills = jsonb_set(
      COALESCE(specialty_skills, '{}'),
      ARRAY[v_specialty],
      jsonb_build_object(
        'cases_completed', v_completed,
        'accuracy', COALESCE(v_accuracy, 0),
        'avg_cost', COALESCE((v_specialty_data->>'avg')::float, 0),
        'last_updated', now()
      )
    ),
    updated_at = now()
    WHERE user_id = p_user_id;
  END LOOP;
  
  -- Update overall metrics
  UPDATE public.user_skill_profiles
  SET 
    total_simulations_completed = (
      SELECT COUNT(*) FROM public.simulation_sessions 
      WHERE user_id = p_user_id AND status = 'completed'
    ),
    total_simulations_abandoned = (
      SELECT COUNT(*) FROM public.simulation_sessions 
      WHERE user_id = p_user_id AND status = 'abandoned'
    ),
    overall_accuracy = (
      SELECT AVG(optimal_path_deviation_score) 
      FROM public.simulation_sessions 
      WHERE user_id = p_user_id AND status = 'completed'
    ),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to get instructor's students performance summary
CREATE OR REPLACE FUNCTION public.get_instructor_students_summary(p_instructor_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  total_simulations INT,
  completed_simulations INT,
  average_accuracy FLOAT,
  top_weakness TEXT,
  last_active TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS student_id,
    p.display_name AS student_name,
    COUNT(ss.id) AS total_simulations,
    COUNT(ss.id) FILTER (WHERE ss.status = 'completed') AS completed_simulations,
    AVG(ss.optimal_path_deviation_score) FILTER (WHERE ss.status = 'completed') AS average_accuracy,
    (usp.weakness_areas->>0) AS top_weakness,
    MAX(ss.updated_at) AS last_active
  FROM public.profiles p
  INNER JOIN public.simulation_sessions ss ON ss.user_id = p.id
  LEFT JOIN public.user_skill_profiles usp ON usp.user_id = p.id
  WHERE ss.instructor_id = p_instructor_id
  GROUP BY p.id, p.display_name, usp.weakness_areas
  ORDER BY last_active DESC;
END;
$$;

-- Enable realtime for simulation sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_analytics;

-- Trigger to auto-update skill profile on simulation completion
CREATE OR REPLACE FUNCTION public.trigger_update_skill_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM public.update_user_skill_profile(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_simulation_completed
  AFTER UPDATE ON public.simulation_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.trigger_update_skill_profile();

COMMENT ON TABLE public.simulation_sessions IS 'Tracks detailed simulation attempts with full decision paths for learning analytics';
COMMENT ON TABLE public.user_skill_profiles IS 'Aggregated performance data per user for adaptive learning and personalization';
COMMENT ON TABLE public.learning_analytics IS 'Fine-grained event tracking for detailed learning analysis';
COMMENT ON TABLE public.constraint_violations IS 'Tracks when learners make clinically questionable decisions for safety monitoring';
COMMENT ON TABLE public.instructor_assignments IS 'Tracks instructor-student relationships for data access control';
COMMENT ON TABLE public.whatif_scenarios IS 'Stores alternative decision paths for what-if reasoning exploration';
