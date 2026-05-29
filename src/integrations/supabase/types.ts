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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      block_events: {
        Row: {
          blocked_at: string
          child_id: string | null
          device_id: string | null
          domain: string
          family_id: string
          id: string
        }
        Insert: {
          blocked_at?: string
          child_id?: string | null
          device_id?: string | null
          domain: string
          family_id: string
          id?: string
        }
        Update: {
          blocked_at?: string
          child_id?: string | null
          device_id?: string | null
          domain?: string
          family_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      blocklist_sites: {
        Row: {
          blocklist_id: string
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          blocklist_id: string
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          blocklist_id?: string
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocklist_sites_blocklist_id_fkey"
            columns: ["blocklist_id"]
            isOneToOne: false
            referencedRelation: "blocklists"
            referencedColumns: ["id"]
          },
        ]
      }
      blocklists: {
        Row: {
          created_at: string
          description: string | null
          family_id: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["profile_kind"]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          family_id: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["profile_kind"]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          family_id?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["profile_kind"]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocklists_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          family_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          family_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          child_id: string | null
          created_at: string
          device_token: string
          family_id: string
          id: string
          last_seen_at: string | null
          name: string
          paired_at: string | null
          pairing_code: string | null
          pairing_code_expires_at: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          device_token: string
          family_id: string
          id?: string
          last_seen_at?: string | null
          name: string
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          device_token?: string
          family_id?: string
          id?: string
          last_seen_at?: string | null
          name?: string
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          platform?: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          parent_pin_hash: string | null
          updated_at: string
          vpn_blocklist_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          parent_pin_hash?: string | null
          updated_at?: string
          vpn_blocklist_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          parent_pin_hash?: string | null
          updated_at?: string
          vpn_blocklist_enabled?: boolean
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          blocklist_id: string | null
          child_id: string | null
          created_at: string
          device_id: string | null
          ended_at: string | null
          ends_at: string
          family_id: string
          id: string
          intensity: Database["public"]["Enums"]["focus_intensity"]
          started_at: string
        }
        Insert: {
          blocklist_id?: string | null
          child_id?: string | null
          created_at?: string
          device_id?: string | null
          ended_at?: string | null
          ends_at: string
          family_id: string
          id?: string
          intensity?: Database["public"]["Enums"]["focus_intensity"]
          started_at?: string
        }
        Update: {
          blocklist_id?: string | null
          child_id?: string | null
          created_at?: string
          device_id?: string | null
          ended_at?: string | null
          ends_at?: string
          family_id?: string
          id?: string
          intensity?: Database["public"]["Enums"]["focus_intensity"]
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_blocklist_id_fkey"
            columns: ["blocklist_id"]
            isOneToOne: false
            referencedRelation: "blocklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          family_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          family_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          family_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          blocklist_id: string | null
          child_id: string | null
          created_at: string
          days_of_week: number[]
          end_time: string
          family_id: string
          id: string
          is_active: boolean
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          blocklist_id?: string | null
          child_id?: string | null
          created_at?: string
          days_of_week?: number[]
          end_time: string
          family_id: string
          id?: string
          is_active?: boolean
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          blocklist_id?: string | null
          child_id?: string | null
          created_at?: string
          days_of_week?: number[]
          end_time?: string
          family_id?: string
          id?: string
          is_active?: boolean
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_blocklist_id_fkey"
            columns: ["blocklist_id"]
            isOneToOne: false
            referencedRelation: "blocklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          family_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          platform: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          platform?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          platform?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_family: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "parent" | "child"
      device_platform:
        | "chrome_extension"
        | "android"
        | "ios"
        | "firefox_extension"
        | "edge_extension"
      focus_intensity: "soft" | "hard" | "nuclear"
      profile_kind: "default" | "study" | "exam" | "assignment" | "custom"
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
      app_role: ["parent", "child"],
      device_platform: [
        "chrome_extension",
        "android",
        "ios",
        "firefox_extension",
        "edge_extension",
      ],
      focus_intensity: ["soft", "hard", "nuclear"],
      profile_kind: ["default", "study", "exam", "assignment", "custom"],
    },
  },
} as const
