
// Базовые типы для всех таблиц
export interface Case {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  cover_image_url?: string;
  is_free?: boolean;
  likes_count?: number;
  created_at?: string;
  last_free_open?: string;
}

export interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url?: string;
  probability?: number;
  created_at?: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  button_text: string;
  button_action: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
}

export interface CaseSkin {
  id: string;
  case_id?: string;
  skin_id?: string;
  coin_reward_id?: string;
  probability?: number;
  custom_probability?: number;
  reward_type?: string;
  never_drop?: boolean;
  created_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  reward_coins: number;
  max_uses?: number;
  current_uses?: number;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  task_url?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ExtendedUser {
  id: string;
  username: string;
  email?: string;
  coins: number;
  is_admin?: boolean;
  created_at?: string;
  auth_id?: string;
  language_code?: string;
  steam_connected?: boolean;
  total_cases_opened?: number;
  total_spent?: number;
  most_expensive_skin_value?: number;
  daily_streak?: number;
  last_daily_login?: string;
  premium_until?: string;
  profile_private?: boolean;
  quiz_lives?: number;
  quiz_streak?: number;
  referral_code?: string;
  referred_by?: string;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  last_free_case_notification?: string;
  last_life_restore?: string;
  last_ad_life_restore?: string;
  last_quiz_date?: string;
  user_roles?: Array<{ role: string }>;
}

// Типы для реляционных запросов
export interface CaseWithSkins extends Case {
  case_skins: (CaseSkin & {
    skins: Skin;
  })[];
}

export interface InventoryItem {
  id: string;
  user_id?: string;
  skin_id?: string;
  is_sold?: boolean;
  obtained_at?: string;
  sold_at?: string;
  sold_price?: number;
  skins?: Skin;
}

export interface UserInventoryItem extends InventoryItem {
  skins: Skin;
}

// Типы для админки
export interface AdminTableItem {
  id: string;
  [key: string]: any;
}

// Типы для безопасности
export interface SecurityEvent {
  id: string;
  user_id?: string;
  type: string;
  details?: any;
  created_at: string;
}

export interface DailyReward {
  id: string;
  day_number: number;
  reward_type: string;
  reward_coins: number;
  reward_item_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface UserDailyReward {
  id: string;
  user_id: string;
  day_number: number;
  reward_coins: number;
  claimed_at?: string;
  created_at?: string;
}

// Типы для викторины
export interface QuizQuestion {
  id: string;
  question_text: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface QuizAnswer {
  id: string;
  question_id?: string;
  answer_text: string;
  is_correct: boolean;
}

// Типы для монет и наград
export interface CoinReward {
  id: string;
  name: string;
  amount: number;
  image_url?: string;
  created_at?: string;
}

// Типы для FAQ
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
}

// Константы для редкости скинов
export const RARITY_COLORS = {
  common: '#b0b0b0',
  uncommon: '#60a5fa', 
  rare: '#8b5cf6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythical: '#ef4444',
  immortal: '#10b981',
  ancient: '#f97316'
} as const;

export const RARITY_LABELS = {
  common: 'Обычный',
  uncommon: 'Необычный', 
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythical: 'Мифический',
  immortal: 'Бессмертный',
  ancient: 'Древний'
} as const;

export type RarityType = keyof typeof RARITY_COLORS;
