// Временные типы для обхода проблем с Supabase types
export interface Banner {
  id: string;
  title: string;
  description: string;
  button_text: string;
  button_action: string;
  image_url?: string | null;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
}

export interface CaseSkin {
  id: string;
  case_id?: string;
  skin_id?: string;
  probability?: number;
  custom_probability?: number;
  coin_reward_id?: string;
  never_drop?: boolean;
  reward_type?: string;
  skins?: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url?: string;
    probability?: number;
  };
  coin_rewards?: {
    id: string;
    name: string;
    amount: number;
    image_url?: string;
  };
}

export interface UserInventoryItem {
  id: string;
  user_id?: string;
  skin_id?: string;
  is_sold?: boolean;
  obtained_at?: string;
  sold_at?: string;
  sold_price?: number;
}

export interface RecentWin {
  id: string;
  user_id?: string;
  case_id?: string;
  skin_id?: string;
  won_at?: string;
  reward_type?: string;
  reward_data?: any;
  users?: {
    id: string;
    username: string;
  } | null;
}

export interface ExtendedUser {
  id: string;
  username: string;
  email?: string;
  coins?: number;
  auth_id?: string;
  created_at?: string;
  daily_streak?: number;
  is_admin?: boolean;
  last_ad_life_restore?: string;
  last_daily_login?: string;
  last_free_case_notification?: string;
  last_life_restore?: string;
  last_quiz_date?: string;
  most_expensive_skin_value?: number;
  premium_until?: string;
  profile_private?: boolean;
  quiz_lives?: number;
  quiz_streak?: number;
  referral_code?: string;
  referred_by?: string;
  steam_connected?: boolean;
  total_cases_opened?: number;
  total_spent?: number;
  language_code?: string;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  user_roles?: { role: string }[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  task_url?: string;
  is_active?: boolean;
  created_at?: string;
  image_url?: string;
}

export interface Case {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_free?: boolean;
  cover_image_url?: string;
  image_url?: string;
  created_at?: string;
}

export interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url?: string;
  created_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  reward_coins: number;
  max_uses?: number | null;
  current_uses?: number;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}
