
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";
import type { SafeOpenCaseResponse } from "@/types/rpc";

interface CaseOpeningParams {
  userId: string;
  caseId: string;
  skinId: string;
  isFree?: boolean;
}

interface CaseOpeningResult {
  success: boolean;
  skin: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url: string | null;
  };
  inventory_id: string;
}

export const useSecureCaseOpening = () => {
  console.log('📦 [SECURE_CASE_OPENING] Hook mounting/rendering');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, caseId, skinId, isFree = false }: CaseOpeningParams) => {
      console.log('🚀 [SECURE_CASE_OPENING] Starting case opening:', { userId, caseId, skinId, isFree });
      
      // Rate limiting проверка
      if (!SecurityRateLimiter.canPerformAction(userId, 'open_case')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'open_case');
        console.warn('⚠️ [SECURE_CASE_OPENING] Rate limit exceeded:', { userId, remaining });
        throw new Error(`Слишком много попыток открытия кейсов. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      // Валидация UUID
      if (!isValidUUID(userId) || !isValidUUID(caseId) || !isValidUUID(skinId)) {
        console.error('❌ [SECURE_CASE_OPENING] Invalid UUID parameters:', { userId, caseId, skinId });
        await auditLog(userId, 'case_open_invalid_params', { caseId, skinId }, false);
        throw new Error('Неверные параметры запроса');
      }

      try {
        console.log('📡 [SECURE_CASE_OPENING] Calling safe_open_case RPC...');
        const startTime = Date.now();
        
        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseId,
          p_skin_id: skinId,
          p_is_free: isFree
        });

        const duration = Date.now() - startTime;
        console.log(`⏱️ [SECURE_CASE_OPENING] RPC completed in ${duration}ms`);

        if (error) {
          console.error('❌ [SECURE_CASE_OPENING] RPC error:', error);
          await auditLog(userId, 'case_open_failed', { error: error.message, caseId, skinId }, false);
          throw new Error(error.message || 'Не удалось открыть кейс');
        }

        // Типизируем ответ от RPC функции
        const result = data as unknown as SafeOpenCaseResponse;
        
        console.log('✅ [SECURE_CASE_OPENING] Case opened successfully:', {
          success: result?.success,
          skinName: result?.skin?.name,
          skinRarity: result?.skin?.rarity,
          inventoryId: result?.inventory_id
        });
        
        await auditLog(userId, 'case_open_success', { caseId, skinId, isFree, wonSkin: result?.skin });
        
        return {
          success: result?.success || false,
          skin: result?.skin,
          inventory_id: result?.inventory_id
        } as CaseOpeningResult;
      } catch (error) {
        console.error('💥 [SECURE_CASE_OPENING] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SECURE_CASE_OPENING] Mutation success, invalidating queries...');
      const startTime = Date.now();
      
      // Обновляем все связанные данные
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] }),
        queryClient.invalidateQueries({ queryKey: ['recent-wins'] }),
        queryClient.refetchQueries({ queryKey: ['user-inventory', variables.userId] })
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ [SECURE_CASE_OPENING] Queries invalidated in ${duration}ms`);

      toast({
        title: "Кейс открыт!",
        description: `Получен скин: ${data.skin?.name}`,
      });
    },
    onError: (error: any) => {
      console.error('🚨 [SECURE_CASE_OPENING] Mutation error:', error);
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  });
};
