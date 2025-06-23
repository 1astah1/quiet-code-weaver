
import { useMemo } from 'react';
import { SecurityValidator, secureAuditLog } from '@/utils/securityValidation';

// Хук для безопасной валидации данных
export const useSecureValidation = (userId?: string) => {
  const validators = useMemo(() => ({
    // Валидация данных пользователя
    validateUserData: async (data: {
      coins?: number;
      userId?: string;
      skinPrice?: number;
    }): Promise<{ isValid: boolean; errors: string[] }> => {
      const errors: string[] = [];

      if (data.userId && !SecurityValidator.validateUUID(data.userId)) {
        errors.push('Некорректный ID пользователя');
        if (userId) {
          await secureAuditLog(userId, 'validation_failed', { field: 'userId', value: data.userId }, false, 'high');
        }
      }

      if (data.coins !== undefined && !SecurityValidator.validateCoins(data.coins)) {
        errors.push('Некорректное количество монет');
        if (userId) {
          await secureAuditLog(userId, 'validation_failed', { field: 'coins', value: data.coins }, false, 'medium');
        }
      }

      if (data.skinPrice !== undefined && !SecurityValidator.validateSkinPrice(data.skinPrice)) {
        errors.push('Некорректная цена скина');
        if (userId) {
          await secureAuditLog(userId, 'validation_failed', { field: 'skinPrice', value: data.skinPrice }, false, 'medium');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    // Валидация операций
    validateOperation: async (operation: {
      type: 'case_open' | 'skin_sell' | 'coin_update';
      amount?: number;
      itemId?: string;
    }): Promise<boolean> => {
      if (operation.itemId && !SecurityValidator.validateUUID(operation.itemId)) {
        if (userId) {
          await secureAuditLog(userId, 'invalid_operation', operation, false, 'high');
        }
        return false;
      }

      if (operation.amount !== undefined) {
        const isValidAmount = operation.type === 'coin_update' 
          ? SecurityValidator.validateCoins(Math.abs(operation.amount))
          : SecurityValidator.validateSkinPrice(operation.amount);
        
        if (!isValidAmount) {
          if (userId) {
            await secureAuditLog(userId, 'invalid_operation_amount', operation, false, 'medium');
          }
          return false;
        }
      }

      return true;
    },

    // Санитизация входных данных
    sanitizeInput: (input: string): string => {
      return SecurityValidator.sanitizeString(input);
    }
  }), [userId]);

  return validators;
};
