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
      application_events: {
        Row: {
          application_id: string
          created_at: string
          event_type: string
          id: string
          new_status: string | null
          old_status: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          event_type: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          event_type?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_files: {
        Row: {
          application_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_files_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_date: string
          company: string
          created_at: string
          deadline_date: string | null
          id: string
          platform: string | null
          reminder_enabled: boolean
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_date?: string
          company: string
          created_at?: string
          deadline_date?: string | null
          id?: string
          platform?: string | null
          reminder_enabled?: boolean
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_date?: string
          company?: string
          created_at?: string
          deadline_date?: string | null
          id?: string
          platform?: string | null
          reminder_enabled?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          application_id: string
          created_at: string
          followed_up_at: string
          id: string
          next_follow_up_date: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          followed_up_at?: string
          id?: string
          next_follow_up_date?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          followed_up_at?: string
          id?: string
          next_follow_up_date?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          applied_date: string
          company: string
          created_at: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_date?: string
          company: string
          created_at?: string
          id?: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_date?: string
          company?: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          public_profile_enabled: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          public_profile_enabled?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          public_profile_enabled?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          created_at: string
          end_date: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          razorpay_subscription_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_subscription_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_subscription_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggestion_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          snooze_until: string | null
          suggestion_key: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          snooze_until?: string | null
          suggestion_key: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          snooze_until?: string | null
          suggestion_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          career_insights_enabled: boolean
          created_at: string
          deadline_reminders_enabled: boolean
          follow_up_suggestions_enabled: boolean
          id: string
          inactivity_alert_days: number
          inactivity_alerts_enabled: boolean
          insight_suggestions_enabled: boolean
          interview_reminders_enabled: boolean
          smart_suggestions_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          career_insights_enabled?: boolean
          created_at?: string
          deadline_reminders_enabled?: boolean
          follow_up_suggestions_enabled?: boolean
          id?: string
          inactivity_alert_days?: number
          inactivity_alerts_enabled?: boolean
          insight_suggestions_enabled?: boolean
          interview_reminders_enabled?: boolean
          smart_suggestions_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          career_insights_enabled?: boolean
          created_at?: string
          deadline_reminders_enabled?: boolean
          follow_up_suggestions_enabled?: boolean
          id?: string
          inactivity_alert_days?: number
          inactivity_alerts_enabled?: boolean
          insight_suggestions_enabled?: boolean
          interview_reminders_enabled?: boolean
          smart_suggestions_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile_data: {
        Args: { profile_username: string }
        Returns: {
          applications: Json
          display_name: string
          interviews: number
          offers: number
          total_applications: number
        }[]
      }
    }
    Enums: {
      billing_cycle: "monthly" | "yearly"
      subscription_plan: "free" | "pro"
      subscription_status: "active" | "cancelled" | "expired"
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
      billing_cycle: ["monthly", "yearly"],
      subscription_plan: ["free", "pro"],
      subscription_status: ["active", "cancelled", "expired"],
    },
  },
} as const
