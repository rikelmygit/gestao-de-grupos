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
      ad_accounts: {
        Row: {
          client_id: string
          created_at: string
          external_id: string
          id: string
          name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          external_id: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          external_id?: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_sets: {
        Row: {
          campaign_external_id: string | null
          client_id: string
          cpl: number | null
          created_at: string
          external_id: string
          id: string
          leads: number | null
          name: string
          spend: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          campaign_external_id?: string | null
          client_id: string
          cpl?: number | null
          created_at?: string
          external_id: string
          id?: string
          leads?: number | null
          name: string
          spend?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          campaign_external_id?: string | null
          client_id?: string
          cpl?: number | null
          created_at?: string
          external_id?: string
          id?: string
          leads?: number | null
          name?: string
          spend?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_sets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          adset_external_id: string | null
          clicks: number | null
          client_id: string
          cpl: number | null
          created_at: string
          creative_id: string | null
          external_id: string
          id: string
          impressions: number | null
          leads: number | null
          name: string
          spend: number | null
          updated_at: string
        }
        Insert: {
          adset_external_id?: string | null
          clicks?: number | null
          client_id: string
          cpl?: number | null
          created_at?: string
          creative_id?: string | null
          external_id: string
          id?: string
          impressions?: number | null
          leads?: number | null
          name: string
          spend?: number | null
          updated_at?: string
        }
        Update: {
          adset_external_id?: string | null
          clicks?: number | null
          client_id?: string
          cpl?: number | null
          created_at?: string
          creative_id?: string | null
          external_id?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          name?: string
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          clicks: number | null
          client_id: string
          cpl: number | null
          created_at: string
          external_id: string
          id: string
          impressions: number | null
          leads: number | null
          name: string
          reach: number | null
          spend: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          clicks?: number | null
          client_id: string
          cpl?: number | null
          created_at?: string
          external_id: string
          id?: string
          impressions?: number | null
          leads?: number | null
          name: string
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          clicks?: number | null
          client_id?: string
          cpl?: number | null
          created_at?: string
          external_id?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          name?: string
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ad_account_id: string | null
          created_at: string
          email: string | null
          id: string
          meta_cpl: number | null
          nicho: string | null
          nome_negocio: string
          nome_responsavel: string | null
          orcamento_diario: number | null
          resumo_operacao: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meta_cpl?: number | null
          nicho?: string | null
          nome_negocio: string
          nome_responsavel?: string | null
          orcamento_diario?: number | null
          resumo_operacao?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meta_cpl?: number | null
          nicho?: string | null
          nome_negocio?: string
          nome_responsavel?: string | null
          orcamento_diario?: number | null
          resumo_operacao?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      operation_summaries: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          clicks: number | null
          client_id: string
          cpl: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          leads: number | null
          reach: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          clicks?: number | null
          client_id: string
          cpl?: number | null
          created_at?: string
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          clicks?: number | null
          client_id?: string
          cpl?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
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
      is_gestor: { Args: never; Returns: boolean }
      my_client_ids: { Args: never; Returns: string[] }
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
    Enums: {},
  },
} as const
