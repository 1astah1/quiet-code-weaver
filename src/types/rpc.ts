
// Типы для ответов от RPC функций
export interface SafeOpenCaseResponse {
  success: boolean;
  reward: {
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
}

export interface SafeSellSkinResponse {
  success: boolean;
  new_balance: number;
}

export interface SafeUpdateCoinsResponse {
  success: boolean;
  new_balance?: number;
}
