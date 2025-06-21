
export type TableName = 
  | "cases" 
  | "skins" 
  | "users" 
  | "quiz_questions" 
  | "tasks" 
  | "banners" 
  | "recent_wins" 
  | "user_inventory" 
  | "promo_codes"
  | "user_promo_codes"
  | "faq_items"
  | "daily_rewards"
  | "user_daily_rewards";

export interface AdminTableItem {
  id: string;
  [key: string]: any;
}
