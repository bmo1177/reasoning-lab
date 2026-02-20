export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      canvas_scratch_pads: {
        Row: {
          case_id: string
          content: Json
          created_at: string
          id: string
          pad_type: string
          parent_node_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          content?: Json
          created_at?: string
          id?: string
          pad_type?: string
          parent_node_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          content?: Json
          created_at?: string
          id?: string
          pad_type?: string
          parent_node_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      case_solutions: {
        Row: {
          canvas_state: Json
          case_id: string
          case_title: string
          confidence_rating: number | null
          created_at: string
          final_diagnosis: string | null
          id: string
          is_public: boolean
          reflection: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_state: Json
          case_id: string
          case_title: string
          confidence_rating?: number | null
          created_at?: string
          final_diagnosis?: string | null
          id?: string
          is_public?: boolean
          reflection?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_state?: Json
          case_id?: string
          case_title?: string
          confidence_rating?: number | null
          created_at?: string
          final_diagnosis?: string | null
          id?: string
          is_public?: boolean
          reflection?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competition_results: {
        Row: {
          accuracy_score: number
          case_id: string
          case_title: string
          completed_at: string
          confidence_rating: number | null
          connections_created: number
          created_at: string
          diagnosis_correct: boolean | null
          duration_seconds: number
          efficiency_score: number
          id: string
          nodes_created: number
          reasoning_score: number
          room_id: string
          speed_score: number
          team_members: Json
          team_name: string
          tests_ordered: number
          total_score: number
        }
        Insert: {
          accuracy_score?: number
          case_id: string
          case_title: string
          completed_at?: string
          confidence_rating?: number | null
          connections_created?: number
          created_at?: string
          diagnosis_correct?: boolean | null
          duration_seconds?: number
          efficiency_score?: number
          id?: string
          nodes_created?: number
          reasoning_score?: number
          room_id: string
          speed_score?: number
          team_members?: Json
          team_name: string
          tests_ordered?: number
          total_score?: number
        }
        Update: {
          accuracy_score?: number
          case_id?: string
          case_title?: string
          completed_at?: string
          confidence_rating?: number | null
          connections_created?: number
          created_at?: string
          diagnosis_correct?: boolean | null
          duration_seconds?: number
          efficiency_score?: number
          id?: string
          nodes_created?: number
          reasoning_score?: number
          room_id?: string
          speed_score?: number
          team_members?: Json
          team_name?: string
          tests_ordered?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      constraint_violations: {
        Row: {
          alternative_chosen: string | null
          clinical_rationale: string | null
          created_at: string
          decision_id: string | null
          decision_label: string | null
          id: string
          severity: string
          simulation_session_id: string
          stage_id: string | null
          suggested_correction: string | null
          user_id: string
          violation_description: string
          violation_type: string
          was_heeded: boolean | null
        }
        Insert: {
          alternative_chosen?: string | null
          clinical_rationale?: string | null
          created_at?: string
          decision_id?: string | null
          decision_label?: string | null
          id?: string
          severity: string
          simulation_session_id: string
          stage_id?: string | null
          suggested_correction?: string | null
          user_id: string
          violation_description: string
          violation_type: string
          was_heeded?: boolean | null
        }
        Update: {
          alternative_chosen?: string | null
          clinical_rationale?: string | null
          created_at?: string
          decision_id?: string | null
          decision_label?: string | null
          id?: string
          severity?: string
          simulation_session_id?: string
          stage_id?: string | null
          suggested_correction?: string | null
          user_id?: string
          violation_description?: string
          violation_type?: string
          was_heeded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "constraint_violations_simulation_session_id_fkey"
            columns: ["simulation_session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_applications: {
        Row: {
          created_at: string
          experience_years: number
          id: string
          qualifications: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string
          status: Database["public"]["Enums"]["expert_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_years: number
          id?: string
          qualifications: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty: string
          status?: Database["public"]["Enums"]["expert_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          experience_years?: number
          id?: string
          qualifications?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string
          status?: Database["public"]["Enums"]["expert_status"]
          user_id?: string
        }
        Relationships: []
      }
      graph_narratives: {
        Row: {
          canvas_state: Json
          case_id: string
          created_at: string
          id: string
          narrative: string
          narrative_type: string
          user_id: string
        }
        Insert: {
          canvas_state: Json
          case_id: string
          created_at?: string
          id?: string
          narrative: string
          narrative_type?: string
          user_id: string
        }
        Update: {
          canvas_state?: Json
          case_id?: string
          created_at?: string
          id?: string
          narrative?: string
          narrative_type?: string
          user_id?: string
        }
        Relationships: []
      }
      instructor_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          id: string
          instructor_id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          id?: string
          instructor_id: string
          notes?: string | null
          student_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: []
      }
      learning_analytics: {
        Row: {
          created_at: string
          decision_id: string | null
          decision_time_seconds: number | null
          decision_type: string | null
          deviation_from_optimal: number | null
          event_data: Json
          event_type: string
          id: string
          patient_state_snapshot: Json | null
          simulation_session_id: string
          stage_id: string | null
          time_elapsed_seconds: number
          user_id: string
          was_optimal: boolean | null
        }
        Insert: {
          created_at?: string
          decision_id?: string | null
          decision_time_seconds?: number | null
          decision_type?: string | null
          deviation_from_optimal?: number | null
          event_data?: Json
          event_type: string
          id?: string
          patient_state_snapshot?: Json | null
          simulation_session_id: string
          stage_id?: string | null
          time_elapsed_seconds: number
          user_id: string
          was_optimal?: boolean | null
        }
        Update: {
          created_at?: string
          decision_id?: string | null
          decision_time_seconds?: number | null
          decision_type?: string | null
          deviation_from_optimal?: number | null
          event_data?: Json
          event_type?: string
          id?: string
          patient_state_snapshot?: Json | null
          simulation_session_id?: string
          stage_id?: string | null
          time_elapsed_seconds?: number
          user_id?: string
          was_optimal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_analytics_simulation_session_id_fkey"
            columns: ["simulation_session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_matches: {
        Row: {
          case_id: string | null
          completed_at: string | null
          created_at: string
          expert_id: string | null
          id: string
          learner_id: string
          matched_at: string | null
          message: string | null
          specialty: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          learner_id: string
          matched_at?: string | null
          message?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          learner_id?: string
          matched_at?: string | null
          message?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_id: string
          reviewer_id: string
          solution_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          reviewer_id: string
          solution_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          reviewer_id?: string
          solution_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "case_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          color: string
          cursor_x: number | null
          cursor_y: number | null
          display_name: string
          id: string
          is_host: boolean | null
          joined_at: string
          last_seen_at: string
          room_id: string
          session_key: string
        }
        Insert: {
          color: string
          cursor_x?: number | null
          cursor_y?: number | null
          display_name: string
          id?: string
          is_host?: boolean | null
          joined_at?: string
          last_seen_at?: string
          room_id: string
          session_key: string
        }
        Update: {
          color?: string
          cursor_x?: number | null
          cursor_y?: number | null
          display_name?: string
          id?: string
          is_host?: boolean | null
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          session_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          created_at: string
          id: string
          member_id: string
          message: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          message: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          message?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "room_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          canvas_state: Json | null
          case_data: Json | null
          case_id: string | null
          created_at: string
          host_session_key: string
          id: string
          room_code: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          canvas_state?: Json | null
          case_data?: Json | null
          case_id?: string | null
          created_at?: string
          host_session_key: string
          id?: string
          room_code: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          canvas_state?: Json | null
          case_data?: Json | null
          case_id?: string | null
          created_at?: string
          host_session_key?: string
          id?: string
          room_code?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: []
      }
      saved_cases: {
        Row: {
          case_data: Json | null
          case_id: string
          case_title: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          case_data?: Json | null
          case_id: string
          case_title: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          case_data?: Json | null
          case_id?: string
          case_title?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session_biases: {
        Row: {
          bias_type: string
          context: string | null
          detected_at: string
          id: string
          session_id: string
        }
        Insert: {
          bias_type: string
          context?: string | null
          detected_at?: string
          id?: string
          session_id: string
        }
        Update: {
          bias_type?: string
          context?: string | null
          detected_at?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_biases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          case_id: string
          case_title: string
          completed_at: string | null
          confidence_rating: number | null
          connections_created: number | null
          correct_diagnosis: boolean | null
          created_at: string
          diagnoses_considered: number | null
          difficulty: string | null
          duration_seconds: number | null
          final_canvas_state: Json | null
          id: string
          nodes_created: number | null
          notes_count: number | null
          session_key: string
          specialty: string | null
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          tests_ordered: number | null
        }
        Insert: {
          case_id: string
          case_title: string
          completed_at?: string | null
          confidence_rating?: number | null
          connections_created?: number | null
          correct_diagnosis?: boolean | null
          created_at?: string
          diagnoses_considered?: number | null
          difficulty?: string | null
          duration_seconds?: number | null
          final_canvas_state?: Json | null
          id?: string
          nodes_created?: number | null
          notes_count?: number | null
          session_key: string
          specialty?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          tests_ordered?: number | null
        }
        Update: {
          case_id?: string
          case_title?: string
          completed_at?: string | null
          confidence_rating?: number | null
          connections_created?: number | null
          correct_diagnosis?: boolean | null
          created_at?: string
          diagnoses_considered?: number | null
          difficulty?: string | null
          duration_seconds?: number | null
          final_canvas_state?: Json | null
          id?: string
          nodes_created?: number | null
          notes_count?: number | null
          session_key?: string
          specialty?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          tests_ordered?: number | null
        }
        Relationships: []
      }
      simulation_sessions: {
        Row: {
          adaptation_reason: string | null
          adapted_difficulty: string | null
          average_decision_time_seconds: number | null
          case_id: string
          case_title: string | null
          cognitive_biases_detected: Json
          completed_at: string | null
          created_at: string
          critical_errors: number
          decision_path: Json
          decisions_made: number
          difficulty: string | null
          id: string
          initial_difficulty: string | null
          instructor_id: string | null
          learning_objectives_achieved: Json
          optimal_path_deviation_score: number | null
          specialty: string | null
          stages_completed: number
          started_at: string
          status: string
          total_cost: number
          total_duration_seconds: number | null
          updated_at: string
          user_id: string
          warnings_ignored: number
        }
        Insert: {
          adaptation_reason?: string | null
          adapted_difficulty?: string | null
          average_decision_time_seconds?: number | null
          case_id: string
          case_title?: string | null
          cognitive_biases_detected?: Json
          completed_at?: string | null
          created_at?: string
          critical_errors?: number
          decision_path?: Json
          decisions_made?: number
          difficulty?: string | null
          id?: string
          initial_difficulty?: string | null
          instructor_id?: string | null
          learning_objectives_achieved?: Json
          optimal_path_deviation_score?: number | null
          specialty?: string | null
          stages_completed?: number
          started_at?: string
          status?: string
          total_cost?: number
          total_duration_seconds?: number | null
          updated_at?: string
          user_id: string
          warnings_ignored?: number
        }
        Update: {
          adaptation_reason?: string | null
          adapted_difficulty?: string | null
          average_decision_time_seconds?: number | null
          case_id?: string
          case_title?: string | null
          cognitive_biases_detected?: Json
          completed_at?: string | null
          created_at?: string
          critical_errors?: number
          decision_path?: Json
          decisions_made?: number
          difficulty?: string | null
          id?: string
          initial_difficulty?: string | null
          instructor_id?: string | null
          learning_objectives_achieved?: Json
          optimal_path_deviation_score?: number | null
          specialty?: string | null
          stages_completed?: number
          started_at?: string
          status?: string
          total_cost?: number
          total_duration_seconds?: number | null
          updated_at?: string
          user_id?: string
          warnings_ignored?: number
        }
        Relationships: []
      }
      solution_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number | null
          reviewer_id: string
          solution_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_id: string
          solution_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_id?: string
          solution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solution_reviews_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "case_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_profiles: {
        Row: {
          average_completion_time_by_difficulty: Json
          bias_improvement_trends: Json
          frequent_biases: Json
          id: string
          learning_style: Json
          overall_accuracy: number | null
          preferred_difficulty: string
          specialty_skills: Json
          strength_areas: Json
          total_simulations_abandoned: number
          total_simulations_completed: number
          updated_at: string
          user_id: string
          weakness_areas: Json
        }
        Insert: {
          average_completion_time_by_difficulty?: Json
          bias_improvement_trends?: Json
          frequent_biases?: Json
          id?: string
          learning_style?: Json
          overall_accuracy?: number | null
          preferred_difficulty?: string
          specialty_skills?: Json
          strength_areas?: Json
          total_simulations_abandoned?: number
          total_simulations_completed?: number
          updated_at?: string
          user_id: string
          weakness_areas?: Json
        }
        Update: {
          average_completion_time_by_difficulty?: Json
          bias_improvement_trends?: Json
          frequent_biases?: Json
          id?: string
          learning_style?: Json
          overall_accuracy?: number | null
          preferred_difficulty?: string
          specialty_skills?: Json
          strength_areas?: Json
          total_simulations_abandoned?: number
          total_simulations_completed?: number
          updated_at?: string
          user_id?: string
          weakness_areas?: Json
        }
        Relationships: []
      }
      whatif_scenarios: {
        Row: {
          alternative_decision: string
          alternative_decision_label: string | null
          created_at: string
          decision_made: string
          decision_made_label: string | null
          explanation: string | null
          explored_at: string | null
          id: string
          key_insight: string | null
          learning_objective: string | null
          predicted_outcome: string | null
          predicted_patient_state: Json | null
          scenario_description: string | null
          scenario_title: string | null
          simulation_session_id: string
          stage_id: string
          was_explored: boolean
          was_viewed: boolean
        }
        Insert: {
          alternative_decision: string
          alternative_decision_label?: string | null
          created_at?: string
          decision_made: string
          decision_made_label?: string | null
          explanation?: string | null
          explored_at?: string | null
          id?: string
          key_insight?: string | null
          learning_objective?: string | null
          predicted_outcome?: string | null
          predicted_patient_state?: Json | null
          scenario_description?: string | null
          scenario_title?: string | null
          simulation_session_id: string
          stage_id: string
          was_explored?: boolean
          was_viewed?: boolean
        }
        Update: {
          alternative_decision?: string
          alternative_decision_label?: string | null
          created_at?: string
          decision_made?: string
          decision_made_label?: string | null
          explanation?: string | null
          explored_at?: string | null
          id?: string
          key_insight?: string | null
          learning_objective?: string | null
          predicted_outcome?: string | null
          predicted_patient_state?: Json | null
          scenario_description?: string | null
          scenario_title?: string | null
          simulation_session_id?: string
          stage_id?: string
          was_explored?: boolean
          was_viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "whatif_scenarios_simulation_session_id_fkey"
            columns: ["simulation_session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_common_constraint_violations: {
        Args: {
          p_case_id: string | null
        }
        Returns: {
          violation_type: string
          count: number
          severity: string
        }[]
      }
      get_instructor_students_summary: {
        Args: {
          p_instructor_id: string
        }
        Returns: {
          student_id: string
          student_name: string
          total_simulations: number
          completed_simulations: number
          average_accuracy: number
          top_weakness: string
          last_active: string
        }[]
      }
      generate_room_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_user_skill_profile: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      app_role: "learner" | "expert" | "admin"
      expert_status: "pending" | "approved" | "rejected"
      room_status: "waiting" | "active" | "completed"
      session_status: "in_progress" | "completed" | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["learner", "expert", "admin"],
      expert_status: ["pending", "approved", "rejected"],
      room_status: ["waiting", "active", "completed"],
      session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
