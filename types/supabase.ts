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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          budget_limit: number | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          budget_limit?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          budget_limit?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          invite_token: string | null
          last_transaction_at: string | null
          linked_user_id: string | null
          name: string
          net_balance: number | null
          phone: string | null
          transaction_count: number | null
          type: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          invite_token?: string | null
          last_transaction_at?: string | null
          linked_user_id?: string | null
          name: string
          net_balance?: number | null
          phone?: string | null
          transaction_count?: number | null
          type?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          invite_token?: string | null
          last_transaction_at?: string | null
          linked_user_id?: string | null
          name?: string
          net_balance?: number | null
          phone?: string | null
          transaction_count?: number | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          id: string
          initiator_id: string | null
          status: string | null
          user_id_1: string | null
          user_id_2: string | null
        }
        Insert: {
          id?: string
          initiator_id?: string | null
          status?: string | null
          user_id_1?: string | null
          user_id_2?: string | null
        }
        Update: {
          id?: string
          initiator_id?: string | null
          status?: string | null
          user_id_1?: string | null
          user_id_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          avatar_url: string | null
          ghost_name: string | null
          group_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          ghost_name?: string | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          ghost_name?: string | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invite_code: string | null
          name: string
          type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string | null
          name: string
          type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          currency_symbol: string | null
          discoverable_by_phone: boolean | null
          discoverable_by_username: boolean | null
          email: string | null
          friend_invite_token: string | null
          full_name: string | null
          id: string
          phone: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          discoverable_by_phone?: boolean | null
          discoverable_by_username?: boolean | null
          email?: string | null
          friend_invite_token?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          discoverable_by_phone?: boolean | null
          discoverable_by_username?: boolean | null
          email?: string | null
          friend_invite_token?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          active: boolean | null
          amount: number
          category_id: string | null
          created_at: string | null
          flow: string | null
          frequency: string
          id: string
          last_run_date: string | null
          name: string
          next_run_date: string
          note: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          flow?: string | null
          frequency: string
          id?: string
          last_run_date?: string | null
          name: string
          next_run_date: string
          note?: string | null
          start_date?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          flow?: string | null
          frequency?: string
          id?: string
          last_run_date?: string | null
          name?: string
          next_run_date?: string
          note?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_splits: {
        Row: {
          amount: number
          group_member_id: string | null
          id: string
          is_settled: boolean | null
          member_name_snapshot: string | null
          percentage: number | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          group_member_id?: string | null
          id?: string
          is_settled?: boolean | null
          member_name_snapshot?: string | null
          percentage?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          group_member_id?: string | null
          id?: string
          is_settled?: boolean | null
          member_name_snapshot?: string | null
          percentage?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_group_member_id_fkey"
            columns: ["group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          business_id: string | null
          category_id: string | null
          contact_id: string | null
          created_at: string | null
          date: string
          due_date: string | null
          flow: string | null
          group_id: string | null
          id: string
          mode: string | null
          name: string
          note: string | null
          payer_group_member_id: string | null
          payer_id: string | null
          split_type: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          business_id?: string | null
          category_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          due_date?: string | null
          flow?: string | null
          group_id?: string | null
          id?: string
          mode?: string | null
          name: string
          note?: string | null
          payer_group_member_id?: string | null
          payer_id?: string | null
          split_type?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          business_id?: string | null
          category_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          due_date?: string | null
          flow?: string | null
          group_id?: string | null
          id?: string
          mode?: string | null
          name?: string
          note?: string | null
          payer_group_member_id?: string | null
          payer_id?: string | null
          split_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payer_group_member_id_fkey"
            columns: ["payer_group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          business_accent: string | null
          business_theme: string | null
          created_at: string | null
          personal_accent: string | null
          personal_theme: string | null
          sync_themes: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_accent?: string | null
          business_theme?: string | null
          created_at?: string | null
          personal_accent?: string | null
          personal_theme?: string | null
          sync_themes?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_accent?: string | null
          business_theme?: string | null
          created_at?: string | null
          personal_accent?: string | null
          personal_theme?: string | null
          sync_themes?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      unified_contact_transactions: {
        Row: {
          account_id: string | null
          amount: number | null
          attachment_url: string | null
          business_id: string | null
          category_id: string | null
          contact_id: string | null
          created_at: string | null
          date: string | null
          due_date: string | null
          flow: string | null
          group_id: string | null
          id: string | null
          local_contact_id: string | null
          local_flow: string | null
          mode: string | null
          name: string | null
          note: string | null
          payer_group_member_id: string | null
          payer_id: string | null
          split_type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_contact_invite: { Args: { token: string }; Returns: Json }
      accept_friend_invite: { Args: { invite_token: string }; Returns: Json }
      accept_in_app_request: {
        Args: { p_friendship_id: string }
        Returns: Json
      }
      add_transaction_with_splits: {
        Args: {
          p_account_id: string
          p_amount: number
          p_business_id: string
          p_category_id: string
          p_contact_id: string
          p_date: string
          p_due_date: string
          p_flow: string
          p_group_id: string
          p_mode: string
          p_name: string
          p_note: string
          p_payer_group_member_id: string
          p_payer_id: string
          p_split_type: string
          p_splits: Json
          p_user_id: string
        }
        Returns: Json
      }
      contribute_to_goal: {
        Args: { p_amount: number; p_goal_id: string }
        Returns: Json
      }
      detect_user_by_phone: {
        Args: { p_phone: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_group_by_invite: {
        Args: { invite_code_input: string }
        Returns: {
          ghost_members: Json
          group_avatar_url: string
          group_id: string
          group_name: string
        }[]
      }
      get_monthly_category_spend: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          category_color: string
          category_name: string
          total_spent: number
        }[]
      }
      get_my_group_ids: {
        Args: never
        Returns: {
          group_id: string
        }[]
      }
      is_transaction_creator: { Args: { txn_id: string }; Returns: boolean }
      join_group: {
        Args: { claim_ghost_member_id?: string; invite_code_input: string }
        Returns: Json
      }
      link_ghost_to_friend: {
        Args: {
          p_friend_user_id: string
          p_ghost_member_id: string
          p_group_id: string
        }
        Returns: Json
      }
      recalculate_all_balances: { Args: never; Returns: undefined }
      recalculate_all_contact_balances: { Args: never; Returns: undefined }
      remove_friend: { Args: { friend_id: string }; Returns: undefined }
      send_friend_request: {
        Args: { p_contact_id: string; p_target_user_id: string }
        Returns: Json
      }
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
