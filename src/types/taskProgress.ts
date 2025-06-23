
// Типы для ответов от RPC функций задач
export interface SafeCompleteTaskResponse {
  success: boolean;
  reward_coins?: number;
  error?: string;
}

export interface SafeClaimTaskRewardResponse {
  success: boolean;
  reward_coins?: number;
  new_balance?: number;
  error?: string;
}
