
export type TableName = 
  | "cases"
  | "skins"
  | "users"
  | "banners"
  | "tasks"
  | "quiz_questions"
  | "promo_codes"
  | "coin_rewards"
  | "daily_rewards"
  | "faq_items"
  | "suspicious_activities"; // ДОБАВЛЕНО: Новый тип таблицы

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  coins: number;
  is_admin: boolean;
  created_at: string;
}
