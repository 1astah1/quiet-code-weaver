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
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          order_index: number
          title: string
        }
        Insert: {
          button_action: string
          button_text: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number
          title: string
        }
        Update: {
          button_action?: string
          button_text?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      case_rewards: {
        Row: {
          case_id: string
          coin_reward_id: string | null
          created_at: string
          id: string
          is_active: boolean
          never_drop: boolean
          probability: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          skin_id: string | null
        }
        Insert: {
          case_id: string
          coin_reward_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          never_drop?: boolean
          probability: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          skin_id?: string | null
        }
        Update: {
          case_id?: string
          coin_reward_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          never_drop?: boolean
          probability?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          skin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_rewards_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_rewards_coin_reward_id_fkey"
            columns: ["coin_reward_id"]
            isOneToOne: false
            referencedRelation: "coin_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_rewards_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_type: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_free: boolean
          likes_count: number
          name: string
          price: number
          rarity_color: string
        }
        Insert: {
          case_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          likes_count?: number
          name: string
          price: number
          rarity_color?: string
        }
        Update: {
          case_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          likes_count?: number
          name?: string
          price?: number
          rarity_color?: string
        }
        Relationships: []
      }
      coin_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string
          day_number: number
          id: string
          is_active: boolean
          reward_coins: number
          reward_item_id: string | null
          reward_type: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          is_active?: boolean
          reward_coins: number
          reward_item_id?: string | null
          reward_type?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          is_active?: boolean
          reward_coins?: number
          reward_item_id?: string | null
          reward_type?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          reward_coins: number
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          reward_coins: number
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          reward_coins?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          category?: string
          correct_answer: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
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
          case_id: string
          coin_reward_id: string | null
          id: string
          reward_data: Json | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          skin_id: string | null
          user_id: string
          won_at: string
        }
        Insert: {
          case_id: string
          coin_reward_id?: string | null
          id?: string
          reward_data?: Json | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          skin_id?: string | null
          user_id: string
          won_at?: string
        }
        Update: {
          case_id?: string
          coin_reward_id?: string | null
          id?: string
          reward_data?: Json | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          skin_id?: string | null
          user_id?: string
          won_at?: string
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
            foreignKeyName: "recent_wins_coin_reward_id_fkey"
            columns: ["coin_reward_id"]
            isOneToOne: false
            referencedRelation: "coin_rewards"
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          coins_earned: number
          earned_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          coins_earned: number
          earned_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          coins_earned?: number
          earned_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_withdrawal_requests: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          inventory_item_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          steam_trade_offer_id: string | null
          steam_trade_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          inventory_item_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          steam_trade_offer_id?: string | null
          steam_trade_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          inventory_item_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          steam_trade_offer_id?: string | null
          steam_trade_url?: string
          updated_at?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skins: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          probability: number
          rarity: string
          weapon_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          probability?: number
          rarity: string
          weapon_type: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          probability?: number
          rarity?: string
          weapon_type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          reward_coins: number
          task_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          reward_coins: number
          task_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          reward_coins?: number
          task_url?: string | null
          title?: string
        }
        Relationships: []
      }
      user_daily_rewards: {
        Row: {
          claimed_at: string
          day_number: number
          id: string
          reward_coins: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          day_number: number
          id?: string
          reward_coins: number
          user_id: string
        }
        Update: {
          claimed_at?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          case_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          user_id?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_free_case_openings: {
        Row: {
          case_id: string
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_free_case_openings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_free_case_openings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          created_at: string
          id: string
          is_sold: boolean
          obtained_at: string
          skin_id: string
          sold_at: string | null
          sold_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sold?: boolean
          obtained_at?: string
          skin_id: string
          sold_at?: string | null
          sold_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sold?: boolean
          obtained_at?: string
          skin_id?: string
          sold_at?: string | null
          sold_price?: number | null
          user_id?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promo_codes: {
        Row: {
          id: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_progress: {
        Row: {
          completed: boolean
          correct_answers: number
          created_at: string
          date: string
          id: string
          questions_answered: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          correct_answers?: number
          created_at?: string
          date?: string
          id?: string
          questions_answered?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          correct_answers?: number
          created_at?: string
          date?: string
          id?: string
          questions_answered?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_steam_settings: {
        Row: {
          connected_at: string
          id: string
          steam_avatar_url: string | null
          steam_id: string | null
          steam_nickname: string | null
          user_id: string
        }
        Insert: {
          connected_at?: string
          id?: string
          steam_avatar_url?: string | null
          steam_id?: string | null
          steam_nickname?: string | null
          user_id: string
        }
        Update: {
          connected_at?: string
          id?: string
          steam_avatar_url?: string | null
          steam_id?: string | null
          steam_nickname?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_steam_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_task_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_task_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          coins: number
          created_at: string
          daily_streak: number
          email: string | null
          id: string
          language_code: string
          last_ad_life_restore: string | null
          last_daily_login: string | null
          last_free_case_notification: string | null
          last_life_restore: string | null
          last_quiz_date: string | null
          most_expensive_skin_value: number
          premium_until: string | null
          profile_private: boolean
          quiz_lives: number
          quiz_streak: number
          referral_code: string | null
          referred_by: string | null
          sound_enabled: boolean
          steam_connected: boolean
          steam_trade_url: string | null
          total_cases_opened: number
          total_spent: number
          updated_at: string
          username: string
          vibration_enabled: boolean
        }
        Insert: {
          auth_id?: string | null
          coins?: number
          created_at?: string
          daily_streak?: number
          email?: string | null
          id?: string
          language_code?: string
          last_ad_life_restore?: string | null
          last_daily_login?: string | null
          last_free_case_notification?: string | null
          last_life_restore?: string | null
          last_quiz_date?: string | null
          most_expensive_skin_value?: number
          premium_until?: string | null
          profile_private?: boolean
          quiz_lives?: number
          quiz_streak?: number
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean
          steam_connected?: boolean
          steam_trade_url?: string | null
          total_cases_opened?: number
          total_spent?: number
          updated_at?: string
          username: string
          vibration_enabled?: boolean
        }
        Update: {
          auth_id?: string | null
          coins?: number
          created_at?: string
          daily_streak?: number
          email?: string | null
          id?: string
          language_code?: string
          last_ad_life_restore?: string | null
          last_daily_login?: string | null
          last_free_case_notification?: string | null
          last_life_restore?: string | null
          last_quiz_date?: string | null
          most_expensive_skin_value?: number
          premium_until?: string | null
          profile_private?: boolean
          quiz_lives?: number
          quiz_streak?: number
          referral_code?: string | null
          referred_by?: string | null
          sound_enabled?: boolean
          steam_connected?: boolean
          steam_trade_url?: string | null
          total_cases_opened?: number
          total_spent?: number
          updated_at?: string
          username?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          user_id: string
          role_name: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      safe_open_case: {
        Args: {
          p_user_id: string
          p_case_id: string
          p_reward_type?: Database["public"]["Enums"]["reward_type"]
          p_skin_id?: string
          p_coin_reward_id?: string
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
      sell_all_user_skins: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      reward_type: "skin" | "coins"
      task_status: "available" | "completed" | "claimed"
      withdrawal_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "user"],
      reward_type: ["skin", "coins"],
      task_status: ["available", "completed", "claimed"],
      withdrawal_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
