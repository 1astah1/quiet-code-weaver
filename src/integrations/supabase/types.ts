export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      banners: {
        Row: {
          button_action: string
          button_text: string
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number | null
          title: string
        }
        Insert: {
          button_action: string
          button_text: string
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          title: string
        }
        Update: {
          button_action?: string
          button_text?: string
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      case_skins: {
        Row: {
          case_id: string | null
          custom_probability: number | null
          id: string
          never_drop: boolean | null
          probability: number | null
          skin_id: string | null
        }
        Insert: {
          case_id?: string | null
          custom_probability?: number | null
          id?: string
          never_drop?: boolean | null
          probability?: number | null
          skin_id?: string | null
        }
        Update: {
          case_id?: string | null
          custom_probability?: number | null
          id?: string
          never_drop?: boolean | null
          probability?: number | null
          skin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_skins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_type: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_free: boolean | null
          last_free_open: string | null
          likes_count: number | null
          name: string
          price: number
          rarity_color: string | null
        }
        Insert: {
          case_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          last_free_open?: string | null
          likes_count?: number | null
          name: string
          price: number
          rarity_color?: string | null
        }
        Update: {
          case_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          last_free_open?: string | null
          likes_count?: number | null
          name?: string
          price?: number
          rarity_color?: string | null
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          is_active: boolean | null
          reward_coins: number
          reward_item_id: string | null
          reward_type: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          is_active?: boolean | null
          reward_coins?: number
          reward_item_id?: string | null
          reward_type?: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          is_active?: boolean | null
          reward_coins?: number
          reward_item_id?: string | null
          reward_type?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          reward_coins: number
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          reward_coins: number
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          reward_coins?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string | null
          correct_answer: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          category?: string | null
          correct_answer: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          category?: string | null
          correct_answer?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
        }
        Relationships: []
      }
      recent_wins: {
        Row: {
          case_id: string | null
          id: string
          skin_id: string | null
          user_id: string | null
          won_at: string | null
        }
        Insert: {
          case_id?: string | null
          id?: string
          skin_id?: string | null
          user_id?: string | null
          won_at?: string | null
        }
        Update: {
          case_id?: string | null
          id?: string
          skin_id?: string | null
          user_id?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_wins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_wins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_wins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_wins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          coins_earned: number
          earned_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string | null
        }
        Insert: {
          coins_earned: number
          earned_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          coins_earned?: number
          earned_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      skin_withdrawal_requests: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          inventory_item_id: string
          status: string
          steam_trade_offer_id: string | null
          steam_trade_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id: string
          status?: string
          steam_trade_offer_id?: string | null
          steam_trade_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id?: string
          status?: string
          steam_trade_offer_id?: string | null
          steam_trade_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skin_withdrawal_requests_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: true
            referencedRelation: "user_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skin_withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skin_withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skins: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          probability: number | null
          rarity: string
          weapon_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          probability?: number | null
          rarity: string
          weapon_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          probability?: number | null
          rarity?: string
          weapon_type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          reward_coins: number
          task_url: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          reward_coins: number
          task_url?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          reward_coins?: number
          task_url?: string | null
          title?: string
        }
        Relationships: []
      }
      user_daily_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          day_number: number
          id: string
          reward_coins: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          day_number: number
          id?: string
          reward_coins?: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          day_number?: number
          id?: string
          reward_coins?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          id: string
          is_sold: boolean | null
          obtained_at: string | null
          skin_id: string | null
          sold_at: string | null
          sold_price: number | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_sold?: boolean | null
          obtained_at?: string | null
          skin_id?: string | null
          sold_at?: string | null
          sold_price?: number | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_sold?: boolean | null
          obtained_at?: string | null
          skin_id?: string | null
          sold_at?: string | null
          sold_price?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promo_codes: {
        Row: {
          id: string
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_promo_codes_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promo_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promo_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_progress: {
        Row: {
          completed: boolean | null
          correct_answers: number | null
          date: string | null
          id: string
          questions_answered: number | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          correct_answers?: number | null
          date?: string | null
          id?: string
          questions_answered?: number | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          correct_answers?: number | null
          date?: string | null
          id?: string
          questions_answered?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_steam_settings: {
        Row: {
          connected_at: string | null
          created_at: string | null
          id: string
          steam_avatar_url: string | null
          steam_id: string | null
          steam_nickname: string | null
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          id?: string
          steam_avatar_url?: string | null
          steam_id?: string | null
          steam_nickname?: string | null
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          id?: string
          steam_avatar_url?: string | null
          steam_id?: string | null
          steam_nickname?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_steam_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_rankings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_steam_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_task_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          coins: number | null
          created_at: string | null
          daily_streak: number | null
          email: string | null
          id: string
          is_admin: boolean | null
          language_code: string | null
          last_ad_life_restore: string | null
          last_daily_login: string | null
          last_free_case_notification: string | null
          last_life_restore: string | null
          last_quiz_date: string | null
          most_expensive_skin_value: number | null
          premium_until: string | null
          profile_private: boolean | null
          quiz_lives: number | null
          quiz_streak: number | null
          referral_code: string | null
          referred_by: string | null
          sound_enabled: boolean | null
          steam_connected: boolean | null
          steam_trade_url: string | null
          total_cases_opened: number | null
          total_spent: number | null
          username: string
          vibration_enabled: boolean | null
        }
        Insert: {
          auth_id?: string | null
          coins?: number | null
          created_at?: string | null
          daily_streak?: number | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          language_code?: string | null
          last_ad_life_restore?: string | null
          last_daily_login?: string | null
          last_free_case_notification?: string | null
          last_life_restore?: string | null
          last_quiz_date?: string | null
          most_expensive_skin_value?: number | null
          premium_until?: string | null
          profile_private?: boolean | null
          quiz_lives?: number | null
          quiz_streak?: number | null
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean | null
          steam_connected?: boolean | null
          steam_trade_url?: string | null
          total_cases_opened?: number | null
          total_spent?: number | null
          username: string
          vibration_enabled?: boolean | null
        }
        Update: {
          auth_id?: string | null
          coins?: number | null
          created_at?: string | null
          daily_streak?: number | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          language_code?: string | null
          last_ad_life_restore?: string | null
          last_daily_login?: string | null
          last_free_case_notification?: string | null
          last_life_restore?: string | null
          last_quiz_date?: string | null
          most_expensive_skin_value?: number | null
          premium_until?: string | null
          profile_private?: boolean | null
          quiz_lives?: number | null
          quiz_streak?: number | null
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean | null
          steam_connected?: boolean | null
          steam_trade_url?: string | null
          total_cases_opened?: number | null
          total_spent?: number | null
          username?: string
          vibration_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      user_rankings: {
        Row: {
          id: string | null
          most_expensive_skin_value: number | null
          total_cases_opened: number | null
          total_inventory_value: number | null
          total_items_count: number | null
          total_spent: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_max_attempts?: number
          p_time_window_minutes?: number
        }
        Returns: boolean
      }
      check_time_limit: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_interval_minutes?: number
        }
        Returns: boolean
      }
      cleanup_duplicate_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      safe_open_case: {
        Args: {
          p_user_id: string
          p_case_id: string
          p_skin_id: string
          p_is_free?: boolean
        }
        Returns: Json
      }
      safe_update_coins: {
        Args: {
          p_user_id: string
          p_coin_change: number
          p_operation_type?: string
        }
        Returns: boolean
      }
      safe_update_coins_v2: {
        Args: {
          p_user_id: string
          p_coin_change: number
          p_operation_type?: string
        }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
