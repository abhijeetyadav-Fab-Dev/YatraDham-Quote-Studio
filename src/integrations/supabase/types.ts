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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string
          at: string
          detail: string
          id: number
        }
        Insert: {
          action: string
          actor: string
          at?: string
          detail: string
          id?: never
        }
        Update: {
          action?: string
          actor?: string
          at?: string
          detail?: string
          id?: never
        }
        Relationships: []
      }
      cities: {
        Row: {
          aliases: string[]
          city_name: string
          created_at: string
          district: string | null
          id: number
          is_active: boolean
          state_id: number
        }
        Insert: {
          aliases?: string[]
          city_name: string
          created_at?: string
          district?: string | null
          id?: number
          is_active?: boolean
          state_id: number
        }
        Update: {
          aliases?: string[]
          city_name?: string
          created_at?: string
          district?: string | null
          id?: number
          is_active?: boolean
          state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          city_id: number
          destination_name: string
          destination_type: string
          id: number
          is_active: boolean
        }
        Insert: {
          city_id: number
          destination_name: string
          destination_type?: string
          id?: number
          is_active?: boolean
        }
        Update: {
          city_id?: number
          destination_name?: string
          destination_type?: string
          id?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "destinations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body: Json
          id: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          body: Json
          id: string
          updated_at?: string
          updated_by: string
          version: number
        }
        Update: {
          body?: Json
          id?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: []
      }
      durations: {
        Row: {
          days: number
          display_label: string
          id: number
          is_active: boolean
          nights: number
        }
        Insert: {
          days: number
          display_label: string
          id?: number
          is_active?: boolean
          nights: number
        }
        Update: {
          days?: number
          display_label?: string
          id?: number
          is_active?: boolean
          nights?: number
        }
        Relationships: []
      }
      package_names: {
        Row: {
          id: number
          is_active: boolean
          name: string
          state_name: string | null
          subcategory_id: number | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
          state_name?: string | null
          subcategory_id?: number | null
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
          state_name?: string | null
          subcategory_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "package_names_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          legacy_username: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          legacy_username?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          legacy_username?: string | null
          username?: string
        }
        Relationships: []
      }
      shares: {
        Row: {
          body: Json
          created_at: string
          created_by: string
          expires_at: string
          revoked: boolean
          token_hash: string
        }
        Insert: {
          body: Json
          created_at?: string
          created_by: string
          expires_at: string
          revoked?: boolean
          token_hash: string
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string
          expires_at?: string
          revoked?: boolean
          token_hash?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          id: number
          is_active: boolean
          name: string
          package_name_id: number | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
          package_name_id?: number | null
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
          package_name_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_package_name_id_fkey"
            columns: ["package_name_id"]
            isOneToOne: false
            referencedRelation: "package_names"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          category: string
          display_order: number
          id: number
          is_active: boolean
          seating_capacity: number | null
          vehicle_name: string
        }
        Insert: {
          category: string
          display_order?: number
          id?: number
          is_active?: boolean
          seating_capacity?: number | null
          vehicle_name: string
        }
        Update: {
          category?: string
          display_order?: number
          id?: number
          is_active?: boolean
          seating_capacity?: number | null
          vehicle_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actor_name: { Args: never; Returns: string }
      create_share: { Args: { _id: string }; Returns: Json }
      current_role_name: { Args: never; Returns: string }
      get_share: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_shares: {
        Args: never
        Returns: {
          created_by: string
          expires: number
          id: string
          revoked: boolean
        }[]
      }
      revoke_share: { Args: { _id: string }; Returns: undefined }
      save_document: { Args: { _doc: Json; _version: number }; Returns: number }
      write_audit: {
        Args: { _action: string; _detail: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
