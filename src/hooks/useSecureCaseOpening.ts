
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog, validateInput } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";

interface CaseOpeningParams {
  userId: string;
  caseId: string;
  skinId: string;
  isFree?: boolean;
}

export const useSecureCaseOpening = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, caseId, skinId, isFree = false }: CaseOpeningParams) => {
      // Rate limiting проверка
      if (!SecurityRateLimiter.canPerformAction(userId, 'open_case')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'open_case');
        throw new Error(`Слишком много попыток открытия кейсов. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      // Валидация UUID
      if (!isValidUUID(userId) || !isValidUUID(caseId) || !isValidUUID(skinId)) {
        await auditLog(userId, 'case_open_invalid_params', { caseId, skinId }, false);
        throw new Error('Неверные параметры запроса');
      }

      try {
        console.log('Opening case securely:', { userId, caseId, skinId, isFree });
        
        // Используем безопасную функцию открытия кейса
        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseId,
          p_skin_id: skinId,
          p_is_free: isFree
        });

        if (error) {
          console.error('Error opening case:', error);
          await auditLog(userId, 'case_open_failed', { error: error.message, caseId, skinId }, false);
          throw new Error(error.message || 'Не удалось открыть кейс');
        }

        await auditLog(userId, 'case_open_success', { caseId, skinId, isFree, wonSkin: data.skin });
        console.log('Case opened successfully:', data);
        
        return data;
      } catch (error) {
        console.error('Case opening error:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      // Обновляем все связанные данные
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] }),
        queryClient.invalidateQueries({ queryKey: ['recent-wins'] }),
        queryClient.invalidateQueries({ queryKey: ['user-coins', variables.userId] })
      ]);

      toast({
        title: "Кейс открыт!",
        description: `Получен скин: ${data.skin?.name}`,
      });
    },
    onError: (error: any) => {
      console.error('Case opening mutation error:', error);
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  });
};
