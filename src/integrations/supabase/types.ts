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
      assessment_results: {
        Row: {
          ai_prediction: Json | null
          confidence_score: number | null
          correct_answers: number
          created_at: string
          gaps: Json | null
          id: string
          level: string
          question_responses: Json | null
          student_id: string | null
          student_username: string
          total_questions: number
          track: string
        }
        Insert: {
          ai_prediction?: Json | null
          confidence_score?: number | null
          correct_answers?: number
          created_at?: string
          gaps?: Json | null
          id?: string
          level?: string
          question_responses?: Json | null
          student_id?: string | null
          student_username: string
          total_questions?: number
          track: string
        }
        Update: {
          ai_prediction?: Json | null
          confidence_score?: number | null
          correct_answers?: number
          created_at?: string
          gaps?: Json | null
          id?: string
          level?: string
          question_responses?: Json | null
          student_id?: string | null
          student_username?: string
          total_questions?: number
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_uploads: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_count: number
          file_name: string
          id: string
          processed_count: number
          status: string
          total_records: number
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_count?: number
          file_name: string
          id?: string
          processed_count?: number
          status?: string
          total_records?: number
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_count?: number
          file_name?: string
          id?: string
          processed_count?: number
          status?: string
          total_records?: number
          uploaded_by?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string
          duration_hours: number | null
          id: string
          instructor: string | null
          is_free: boolean
          platform: string
          rating: number | null
          skill_covered: string
          title: string
          track: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          is_free?: boolean
          platform: string
          rating?: number | null
          skill_covered: string
          title: string
          track: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          is_free?: boolean
          platform?: string
          rating?: number | null
          skill_covered?: string
          title?: string
          track?: string
          url?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          is_completed: boolean
          priority: number
          skill_gap: string
          student_id: string | null
          student_username: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: number
          skill_gap: string
          student_id?: string | null
          student_username: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          priority?: number
          skill_gap?: string
          student_id?: string | null
          student_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_username: string
          sender_role: string
          sender_username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_username: string
          sender_role: string
          sender_username: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_username?: string
          sender_role?: string
          sender_username?: string
        }
        Relationships: []
      }
      placement_rounds: {
        Row: {
          company_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          requirements: string | null
          round_date: string
          round_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: string | null
          round_date: string
          round_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: string | null
          round_date?: string
          round_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          analysis_json: Json | null
          created_at: string
          extracted_text: string | null
          file_name: string | null
          file_url: string | null
          id: string
          overall_score: number | null
          skills_found: Json | null
          student_id: string | null
          student_username: string
          updated_at: string
        }
        Insert: {
          analysis_json?: Json | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          overall_score?: number | null
          skills_found?: Json | null
          student_id?: string | null
          student_username: string
          updated_at?: string
        }
        Update: {
          analysis_json?: Json | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          overall_score?: number | null
          skills_found?: Json | null
          student_id?: string | null
          student_username?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlisted_students: {
        Row: {
          created_at: string
          id: string
          notification_sent: boolean
          notification_status: string | null
          round_id: string | null
          sent_at: string | null
          student_id: string | null
          student_username: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_sent?: boolean
          notification_status?: string | null
          round_id?: string | null
          sent_at?: string | null
          student_id?: string | null
          student_username: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_sent?: boolean
          notification_status?: string | null
          round_id?: string | null
          sent_at?: string | null
          student_id?: string | null
          student_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlisted_students_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "placement_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlisted_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_registered: boolean
          parent_email: string | null
          phone: string | null
          updated_at: string
          username: string
          year: number | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_registered?: boolean
          parent_email?: string | null
          phone?: string | null
          updated_at?: string
          username: string
          year?: number | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_registered?: boolean
          parent_email?: string | null
          phone?: string | null
          updated_at?: string
          username?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
