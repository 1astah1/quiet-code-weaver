
export type TableName = 
  | "cases"
  | "skins"
  | "users"
  | "banners"
  | "tasks"
  | "watermelon_fruits"
  | "promo_codes"
  | "coin_rewards"
  | "daily_rewards"
  | "faq_items"
  | "suspicious_activities";

export type RealTableName = Exclude<TableName, 'users' | 'suspicious_activities'>;

export type Screen = 
  | "main"
  | "shop"
  | "inventory"
  | "settings"
  | "tasks"
  | "admin"
  | "watermelon"
  | "quiz";

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  coins: number;
  is_admin: boolean;
  created_at: string;
}
