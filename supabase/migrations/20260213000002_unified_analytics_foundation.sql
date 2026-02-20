-- Phase 1: Unified Analytics Foundation
-- Cross-case analytics schema for all case types

-- ============================================
-- 1. EXTEND EXISTING TABLES
-- ============================================

-- Add case_type to simulation_sessions
ALTER TABLE public.simulation_sessions 
ADD COLUMN IF NOT EXISTS case_type TEXT DEFAULT 'simulation' 
CHECK (case_type IN ('clinical', 'simulation', 'error', 'uncertainty'));

-- Add case_type to learning_analytics
ALTER TABLE public.learning_analytics 
ADD COLUMN IF NOT EXISTS case_type TEXT DEFAULT 'simulation'
CHECK (case_type IN ('clinical', 'simulation', 'error', 'uncertainty'));

-- ============================================
-- 2. UNIFIED PERFORMANCE METRICS TABLE
-- Generic metrics that apply to ALL case types
-- ============================================

CREATE TABLE public.case_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  case_type TEXT NOT NULL CHECK (case_type IN ('clinical', 'simulation', 'error', 'uncertainty')),
  case_title TEXT,
  specialty TEXT,
  difficulty TEXT,
  
  -- Universal Timing Metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_duration_seconds INT,
  time_spent_on_decisions INT DEFAULT 0, -- Total time making choices
  
  -- Universal Accuracy Metrics
  accuracy_score FLOAT, -- 0-100 scale, interpretation varies by case type
  completion_status TEXT CHECK (completion_status IN ('completed', 'abandoned', 'timeout')),
  
  -- Universal Cost/Efficiency Metrics
  total_cost INT DEFAULT 0, -- For cases with cost tracking
  efficiency_score FLOAT, -- Cost-effectiveness rating
  
  -- Universal Hints/Assistance Metrics
  hints_used INT DEFAULT 0,
  hints_available INT DEFAULT 0,
  
  -- Universal Retry/Attempt Metrics
  attempt_number INT DEFAULT 1,
  is_retry BOOLEAN DEFAULT FALSE,
  previous_attempt_id UUID REFERENCES public.case_performance_metrics(id),
  
  -- Case-Type Specific Metrics (stored as JSON for flexibility)
  -- Clinical cases: test_ordering_efficiency, time_to_diagnosis
  -- Simulations: optimal_path_deviation, critical_errors
  -- Error cases: bias_identification_accuracy, red_flags_detected
  -- Uncertainty: calibration_score, brier_score
  type_specific_metrics JSONB DEFAULT '{}',
  
  -- Learning Outcomes
  learning_objectives_achieved JSONB DEFAULT '[]',
  cognitive_biases_detected JSONB DEFAULT '[]',
  
  -- Engagement
  decisions_made INT DEFAULT 0,
  interactions_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own performance metrics"
  ON public.case_performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance metrics"
  ON public.case_performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance metrics"
  ON public.case_performance_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Instructors can view assigned student metrics
CREATE POLICY "Instructors can view assigned student metrics"
  ON public.case_performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.instructor_assignments 
      WHERE instructor_assignments.student_id = case_performance_metrics.user_id
      AND instructor_assignments.instructor_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_case_performance_user_id ON public.case_performance_metrics(user_id);
CREATE INDEX idx_case_performance_case_id ON public.case_performance_metrics(case_id);
CREATE INDEX idx_case_performance_case_type ON public.case_performance_metrics(case_type);
CREATE INDEX idx_case_performance_specialty ON public.case_performance_metrics(specialty);
CREATE INDEX idx_case_performance_completed_at ON public.case_performance_metrics(completed_at DESC);
CREATE INDEX idx_case_performance_accuracy ON public.case_performance_metrics(accuracy_score);

-- ============================================
-- 3. UNIFIED LEARNING EVENTS TABLE
-- Fine-grained events across all case types
-- ============================================

CREATE TABLE public.learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID, -- Optional link to case_performance_metrics
  
  -- Event Classification
  case_type TEXT NOT NULL CHECK (case_type IN ('clinical', 'simulation', 'error', 'uncertainty')),
  case_id TEXT NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    -- Universal events
    'case_started',
    'case_completed',
    'case_abandoned',
    'hint_requested',
    'hint_viewed',
    
    -- Clinical case events
    'test_ordered',
    'test_result_viewed',
    'diagnosis_made',
    'reasoning_node_added',
    'reasoning_node_connected',
    'expert_map_compared',
    
    -- Simulation events
    'decision_made',
    'stage_advanced',
    'patient_state_changed',
    'constraint_warning_shown',
    'constraint_warning_heeded',
    'constraint_warning_ignored',
    'whatif_explored',
    'branch_triggered',
    
    -- Error case events
    'bias_selected',
    'bias_correctly_identified',
    'bias_missed',
    'red_flag_detected',
    'red_flag_missed',
    'correct_diagnosis_identified',
    
    -- Uncertainty events
    'probability_assigned',
    'test_selected',
    'bayesian_update_viewed',
    'confidence_calibrated'
  )),
  
  -- Event Details
  event_data JSONB DEFAULT '{}',
  
  -- Context
  stage_id TEXT,
  decision_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  time_elapsed_seconds INT,
  
  -- Performance Context
  was_correct BOOLEAN,
  was_optimal BOOLEAN,
  accuracy_deviation FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own learning events"
  ON public.learning_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert learning events"
  ON public.learning_events FOR INSERT
  WITH CHECK (true);

-- Instructors can view assigned student events
CREATE POLICY "Instructors can view assigned student events"
  ON public.learning_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.instructor_assignments 
      WHERE instructor_assignments.student_id = learning_events.user_id
      AND instructor_assignments.instructor_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_learning_events_user_id ON public.learning_events(user_id);
CREATE INDEX idx_learning_events_case_id ON public.learning_events(case_id);
CREATE INDEX idx_learning_events_case_type ON public.learning_events(case_type);
CREATE INDEX idx_learning_events_event_type ON public.learning_events(event_type);
CREATE INDEX idx_learning_events_timestamp ON public.learning_events(timestamp DESC);

-- ============================================
-- 4. ENHANCED USER SKILL PROFILE
-- Cross-case skill aggregation
-- ============================================

-- Add cross-case metrics to existing user_skill_profiles
ALTER TABLE public.user_skill_profiles 
ADD COLUMN IF NOT EXISTS cross_case_metrics JSONB DEFAULT '{
  "clinical": {"cases_completed": 0, "avg_accuracy": 0, "total_cost_efficiency": 0},
  "simulation": {"cases_completed": 0, "avg_accuracy": 0, "critical_error_rate": 0},
  "error": {"cases_completed": 0, "bias_identification_rate": 0, "red_flag_detection_rate": 0},
  "uncertainty": {"cases_completed": 0, "calibration_score": 0, "brier_score": 0}
}';

ALTER TABLE public.user_skill_profiles 
ADD COLUMN IF NOT EXISTS case_type_preferences JSONB DEFAULT '{
  "preferred_types": [],
  "type_rotation_schedule": [],
  "last_case_type": null
}';

ALTER TABLE public.user_skill_profiles 
ADD COLUMN IF NOT EXISTS overall_learning_velocity FLOAT; -- Rate of improvement across all types

-- ============================================
-- 5. CROSS-CASE RECOMMENDATIONS
-- Global adaptive case suggestions
-- ============================================

CREATE TABLE public.cross_case_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'skill_gap',           -- Target a weak area
    'variety',             -- Try different case type
    'mastery',             -- Continue with successful type
    'calibration',         -- Balance confidence
    'review',              -- Retry failed case
    'challenge'            -- Try harder difficulty
  )),
  
  recommended_case_id TEXT NOT NULL,
  recommended_case_type TEXT NOT NULL,
  recommended_case_title TEXT,
  
  -- Reasoning
  primary_reason TEXT NOT NULL,
  supporting_data JSONB DEFAULT '{}',
  
  -- Status
  was_viewed BOOLEAN DEFAULT FALSE,
  was_accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  
  -- Priority
  priority_score FLOAT, -- 0-100
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cross_case_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON public.cross_case_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.cross_case_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get user's performance across all case types
CREATE OR REPLACE FUNCTION public.get_user_cross_case_performance(p_user_id UUID)
RETURNS TABLE (
  case_type TEXT,
  total_cases BIGINT,
  completed_cases BIGINT,
  avg_accuracy FLOAT,
  avg_efficiency FLOAT,
  last_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpm.case_type,
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE cpm.completion_status = 'completed') as completed_cases,
    AVG(cpm.accuracy_score) as avg_accuracy,
    AVG(cpm.efficiency_score) as avg_efficiency,
    MAX(cpm.completed_at) as last_completed_at
  FROM public.case_performance_metrics cpm
  WHERE cpm.user_id = p_user_id
  GROUP BY cpm.case_type
  ORDER BY cpm.case_type;
END;
$$;

-- Function to identify user's weakest case type
CREATE OR REPLACE FUNCTION public.get_user_weakest_case_type(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weakest_type TEXT;
BEGIN
  SELECT case_type INTO v_weakest_type
  FROM public.get_user_cross_case_performance(p_user_id)
  WHERE completed_cases >= 3  -- Need minimum sample size
  ORDER BY avg_accuracy ASC NULLS LAST
  LIMIT 1;
  
  RETURN v_weakest_type;
END;
$$;

-- Function to calculate learning velocity (improvement rate)
CREATE OR REPLACE FUNCTION public.calculate_learning_velocity(p_user_id UUID, p_case_type TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_early_avg FLOAT;
  v_recent_avg FLOAT;
  v_velocity FLOAT;
BEGIN
  -- Average accuracy of first 3 cases
  SELECT AVG(accuracy_score) INTO v_early_avg
  FROM (
    SELECT accuracy_score
    FROM public.case_performance_metrics
    WHERE user_id = p_user_id AND case_type = p_case_type
    ORDER BY started_at ASC
    LIMIT 3
  ) early_cases;
  
  -- Average accuracy of most recent 3 cases
  SELECT AVG(accuracy_score) INTO v_recent_avg
  FROM (
    SELECT accuracy_score
    FROM public.case_performance_metrics
    WHERE user_id = p_user_id AND case_type = p_case_type
    ORDER BY started_at DESC
    LIMIT 3
  ) recent_cases;
  
  -- Calculate velocity (improvement per case)
  IF v_early_avg IS NOT NULL AND v_recent_avg IS NOT NULL AND v_early_avg > 0 THEN
    v_velocity := ((v_recent_avg - v_early_avg) / v_early_avg) * 100;
  ELSE
    v_velocity := 0;
  END IF;
  
  RETURN v_velocity;
END;
$$;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger to update user skill profile when case is completed
CREATE OR REPLACE FUNCTION public.update_user_skill_profile_on_case_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cross_case_metrics JSONB;
  v_case_type_key TEXT;
BEGIN
  IF NEW.completion_status = 'completed' AND (OLD.completion_status IS NULL OR OLD.completion_status != 'completed') THEN
    -- Get current metrics
    SELECT cross_case_metrics INTO v_cross_case_metrics
    FROM public.user_skill_profiles
    WHERE user_id = NEW.user_id;
    
    v_case_type_key := NEW.case_type;
    
    -- Update metrics for this case type
    v_cross_case_metrics := jsonb_set(
      v_cross_case_metrics,
      ARRAY[v_case_type_key, 'cases_completed'],
      to_jsonb(COALESCE((v_cross_case_metrics->v_case_type_key->>'cases_completed')::int, 0) + 1)
    );
    
    v_cross_case_metrics := jsonb_set(
      v_cross_case_metrics,
      ARRAY[v_case_type_key, 'avg_accuracy'],
      to_jsonb(NEW.accuracy_score)
    );
    
    -- Update the profile
    UPDATE public.user_skill_profiles
    SET 
      cross_case_metrics = v_cross_case_metrics,
      last_case_type = NEW.case_type,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_case_performance_completed
  AFTER UPDATE ON public.case_performance_metrics
  FOR EACH ROW
  WHEN (NEW.completion_status = 'completed')
  EXECUTE FUNCTION public.update_user_skill_profile_on_case_complete();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cross_case_recommendations;

-- Comments
COMMENT ON TABLE public.case_performance_metrics IS 'Unified performance tracking across all case types';
COMMENT ON TABLE public.learning_events IS 'Fine-grained learning events for all case types';
COMMENT ON TABLE public.cross_case_recommendations IS 'Global adaptive case recommendations across all types';
