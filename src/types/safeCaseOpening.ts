
export interface SafeCaseOpeningResponse {
  success: boolean;
  reward?: {
    id: string;
    name: string;
    weapon_type?: string;
    rarity?: string;
    price: number;
    image_url?: string | null;
    type: 'skin' | 'coin_reward';
    amount?: number;
  };
  inventory_id?: string;
  new_balance?: number;
  roulette_items?: Array<{
    id: string;
    name: string;
    weapon_type?: string;
    rarity?: string;
    price: number;
    image_url?: string | null;
    type: 'skin' | 'coin_reward';
    amount?: number;
  }>;
  winner_position?: number;
  error?: string;
  session_id?: string;
}

export interface CaseOpeningSession {
  id: string;
  user_id: string;
  case_id: string;
  session_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  coins_debited: boolean;
  created_at: string;
  completed_at?: string;
}
