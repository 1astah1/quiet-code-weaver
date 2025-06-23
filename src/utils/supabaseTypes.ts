
// Временные типы для обхода проблем с Supabase types
export interface Banner {
  id: string;
  title: string;
  description: string;
  button_text: string;
  button_action: string;
  image_url?: string;
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
}
