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
          coin_reward_id: string | null
          custom_probability: number | null
          id: string
          never_drop: boolean | null
          probability: number | null
          reward_type: string | null
          skin_id: string | null
        }
        Insert: {
          case_id?: string | null
          coin_reward_id?: string | null
          custom_probability?: number | null
          id?: string
          never_drop?: boolean | null
          probability?: number | null
          reward_type?: string | null
          skin_id?: string | null
        }
        Update: {
          case_id?: string | null
          coin_reward_id?: string | null
          custom_probability?: number | null
          id?: string
          never_drop?: boolean | null
          probability?: number | null
          reward_type?: string | null
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
          {
            foreignKeyName: "fk_case_skins_coin_reward"
            columns: ["coin_reward_id"]
            isOneToOne: false
            referencedRelation: "coin_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
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
        }
        Insert: {
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
        }
        Update: {
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
        }
        Relationships: []
      }
      coin_rewards: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
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
      quiz_answers: {
        Row: {
          answer_text: string
          id: string
          is_correct: boolean
          question_id: string | null
        }
        Insert: {
          answer_text: string
          id?: string
          is_correct: boolean
          question_id?: string | null
        }
        Update: {
          answer_text?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          answers: Json
          category: string | null
          correct_answer: string
          created_at: string | null
          difficulty: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          answers: Json
          category?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          answers?: Json
          category?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_rewards: {
        Row: {
          earned_at: string | null
          id: string
          questions_required: number
          reward_amount: number
          reward_type: string
          user_id: string | null
        }
        Insert: {
          earned_at?: string | null
          id?: string
          questions_required: number
          reward_amount: number
          reward_type: string
          user_id?: string | null
        }
        Update: {
          earned_at?: string | null
          id?: string
          questions_required?: number
          reward_amount?: number
          reward_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          question_text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          question_text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          question_text?: string
        }
        Relationships: []
      }
      recent_wins: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          reward_data: Json | null
          reward_type: string | null
          skin_id: string | null
          user_id: string | null
          won_at: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          reward_data?: Json | null
          reward_type?: string | null
          skin_id?: string | null
          user_id?: string | null
          won_at?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          reward_data?: Json | null
          reward_type?: string | null
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
      suspicious_activities: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          type: Database["public"]["Enums"]["security_event_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          type: Database["public"]["Enums"]["security_event_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          type?: Database["public"]["Enums"]["security_event_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      user_ad_views: {
        Row: {
          case_id: string
          case_opened_at: string | null
          created_at: string | null
          id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          case_id: string
          case_opened_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          case_id?: string
          case_opened_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          viewed_at?: string | null
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          skin_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          skin_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          skin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "skins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_free_case_openings: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          opened_at: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          opened_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          opened_at?: string | null
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_answers: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          question_id: string | null
          user_answer: string
          user_id: string | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          question_id?: string | null
          user_answer: string
          user_id?: string | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string | null
          user_answer?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_profiles: {
        Row: {
          created_at: string | null
          current_streak: number
          last_ad_watched_at: string | null
          last_life_lost_at: string | null
          last_quiz_completed_date: string | null
          lives: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          last_ad_watched_at?: string | null
          last_life_lost_at?: string | null
          last_quiz_completed_date?: string | null
          lives?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          last_ad_watched_at?: string | null
          last_life_lost_at?: string | null
          last_quiz_completed_date?: string | null
          lives?: number
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_progress: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          current_streak: number | null
          hearts: number | null
          id: string
          last_heart_restore: string | null
          questions_answered: number | null
          total_rewards_earned: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          current_streak?: number | null
          hearts?: number | null
          id?: string
          last_heart_restore?: string | null
          questions_answered?: number | null
          total_rewards_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          current_streak?: number | null
          hearts?: number | null
          id?: string
          last_heart_restore?: string | null
          questions_answered?: number | null
          total_rewards_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
          status: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id?: string
          updated_at?: string
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
          total_cases_opened?: number | null
          total_spent?: number | null
          username?: string
          vibration_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_query_table: {
        Args: { p_table_name: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      answer_quiz_question: {
        Args:
          | { p_answer_id: string }
          | { p_question_id: string; p_user_answer: string }
          | { p_user_id: string; p_question_id: string; p_user_answer: string }
        Returns: {
          success: boolean
          correct: boolean
          message: string
          new_lives: number
          new_balance: number
        }[]
      }
      check_rate_limit: {
        Args: {
          p_user_id: string
          p_action: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_case_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cs2_open_case: {
        Args: { p_user_id: string; p_case_id: string }
        Returns: Json
      }
      final_sell_item: {
        Args: { p_inventory_id: string; p_user_id: string }
        Returns: {
          success: boolean
          message: string
          new_balance: number
        }[]
      }
      get_life_for_ad: {
        Args: Record<PropertyKey, never>
        Returns: {
          success: boolean
          message: string
          new_lives: number
        }[]
      }
      get_quiz_state: {
        Args: Record<PropertyKey, never>
        Returns: {
          lives: number
          ad_cooldown_seconds: number
          streak_multiplier: number
          reward: number
          current_question: Json
          quiz_progress: Json
        }[]
      }
      get_user_inventory: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          skin_id: string
          is_sold: boolean
          obtained_at: string
          sold_at: string
          sold_price: number
          skin_name: string
          skin_weapon_type: string
          skin_rarity: string
          skin_price: number
          skin_image_url: string
        }[]
      }
      get_user_quiz_state: {
        Args: Record<PropertyKey, never> | { p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_by_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_storage_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_suspicious_activity: {
        Args: {
          p_user_id: string
          p_type: Database["public"]["Enums"]["security_event_type"]
          p_details: Json
        }
        Returns: undefined
      }
      purchase_skin: {
        Args: { p_user_id: string; p_skin_id: string }
        Returns: Json
      }
      safe_claim_daily_reward: {
        Args: { p_user_id: string }
        Returns: Json
      }
      safe_claim_task_reward: {
        Args: { p_user_id: string; p_task_id: string }
        Returns: Json
      }
      safe_complete_task: {
        Args: { p_user_id: string; p_task_id: string }
        Returns: Json
      }
      safe_purchase_skin: {
        Args: { p_user_id: string; p_skin_id: string; p_skin_price: number }
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
      sell_inventory_item: {
        Args: { p_user_id: string; p_inventory_item_id: string }
        Returns: Json
      }
      toggle_admin_role: {
        Args: { p_user_id: string; p_grant_admin: boolean }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      security_event_type:
        | "rate_limit"
        | "validation_error"
        | "suspicious_activity"
        | "auth_error"
        | "manual_flag"
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
      app_role: ["admin", "moderator", "user"],
      security_event_type: [
        "rate_limit",
        "validation_error",
        "suspicious_activity",
        "auth_error",
        "manual_flag",
      ],
    },
  },
} as const
