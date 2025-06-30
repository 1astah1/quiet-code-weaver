import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PromoCode } from "@/utils/supabaseTypes";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Download, Upload } from "lucide-react";

// Type for creating new promo codes (required fields)
type PromoCodeCreate = {
  code: string;
  reward_coins: number;
  max_uses?: number;
  expires_at?: string;
  is_active?: boolean;
};

interface BulkPromoCodeData {
  code: string;
  reward_coins: number;
  max_uses?: number;
  expires_at?: string;
  is_active: boolean;
}

const PromoCodeManagement = () => {
  const [newPromoCode, setNewPromoCode] = useState<PromoCodeCreate>({
    code: '',
    reward_coins: 0,
    max_uses: undefined,
    expires_at: undefined,
    is_active: true
  });
  const [bulkCodes, setBulkCodes] = useState('');
  const [bulkReward, setBulkReward] = useState(0);
  const [bulkMaxUses, setBulkMaxUses] = useState<number | undefined>(undefined);
  const [bulkExpiresAt, setBulkExpiresAt] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promoCodes, isLoading, isError } = useQuery({
    queryKey: ['promoCodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: async (promoCode: PromoCodeCreate) => {
      const { error } = await supabase
        .from('promo_codes')
        .insert([promoCode]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      setNewPromoCode({
        code: '',
        reward_coins: 0,
        max_uses: undefined,
        expires_at: undefined,
        is_active: true
      });
      toast({
        title: "Промокод создан!",
        description: "Промокод успешно добавлен.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания промокода",
        description: error.message,
        variant: "destructive"
      })
    }
  });

  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromoCode> & { id: string }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      toast({
        title: "Промокод обновлен!",
        description: "Промокод успешно изменен.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка обновления промокода",
        description: error.message,
        variant: "destructive"
      })
    }
  });

  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      toast({
        title: "Промокод удален!",
        description: "Промокод успешно удален.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка удаления промокода",
        description: error.message,
        variant: "destructive"
      })
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'reward_coins') {
      setNewPromoCode({ ...newPromoCode, [name]: parseInt(value) });
    } else if (name === 'max_uses') {
      setNewPromoCode({ ...newPromoCode, [name]: value ? parseInt(value) : undefined });
    } else {
      setNewPromoCode({ ...newPromoCode, [name]: value });
    }
  };

  const handleCreatePromoCode = async () => {
    if (!newPromoCode.code || !newPromoCode.reward_coins) {
      alert('Пожалуйста, заполните код и награду.');
      return;
    }
    createPromoCodeMutation.mutate(newPromoCode);
  };

  const handleUpdatePromoCode = async (id: string, updates: Partial<PromoCode>) => {
    updatePromoCodeMutation.mutate({ id, ...updates });
  };

  const handleDeletePromoCode = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      deletePromoCodeMutation.mutate(id);
    }
  };

  const handleBulkCreate = async () => {
    const codes = bulkCodes.split('\n').filter(code => code.trim());
    
    if (codes.length === 0) {
      toast({
        title: "Ошибка",
        description: "Введите коды для создания",
        variant: "destructive"
      });
      return;
    }

    if (!bulkReward) {
      toast({
        title: "Ошибка", 
        description: "Укажите награду",
        variant: "destructive"
      });
      return;
    }

    const promoData: BulkPromoCodeData[] = codes.map(code => ({
      code: code.trim(),
      reward_coins: bulkReward,
      max_uses: bulkMaxUses ?? undefined,
      expires_at: bulkExpiresAt ?? undefined,
      is_active: true
    }));

    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert(promoData);

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      setBulkCodes('');
      setBulkReward(0);
      setBulkMaxUses(undefined);
      setBulkExpiresAt(undefined);

      toast({
        title: "Промокоды созданы!",
        description: `${Array.isArray(codes) ? codes.length : 0} промокодов успешно добавлены.`,
      })
    } catch (error: any) {
      toast({
        title: "Ошибка массового создания промокодов",
        description: error.message,
        variant: "destructive"
      })
    }
  };

  return (
    <div className="space-y-6">
      {/* Single promo code creation form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Создать промокод</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Код</Label>
            <Input
              type="text"
              name="code"
              value={newPromoCode.code || ''}
              onChange={handleInputChange}
              placeholder="Введите код"
            />
          </div>
          <div>
            <Label>Награда (монеты)</Label>
            <Input
              type="number"
              name="reward_coins"
              value={newPromoCode.reward_coins || ''}
              onChange={handleInputChange}
              placeholder="Введите награду"
            />
          </div>
          <div>
            <Label>Максимальное количество использований (опционально)</Label>
            <Input
              type="number"
              name="max_uses"
              value={newPromoCode.max_uses || ''}
              onChange={handleInputChange}
              placeholder="Без ограничений"
            />
          </div>
          <div>
            <Label>Дата истечения (опционально)</Label>
            <Input
              type="datetime-local"
              name="expires_at"
              value={newPromoCode.expires_at || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <Button onClick={handleCreatePromoCode} className="mt-4 bg-green-600 hover:bg-green-700">
          Создать промокод
        </Button>
      </div>

      {/* Bulk creation form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Массовое создание промокодов</h3>
        <div className="space-y-4">
          <div>
            <Label>Список кодов (каждый с новой строки)</Label>
            <Textarea
              value={bulkCodes}
              onChange={(e) => setBulkCodes(e.target.value)}
              placeholder="Код1&#10;Код2&#10;Код3"
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Награда (монеты)</Label>
            <Input
              type="number"
              value={bulkReward}
              onChange={(e) => setBulkReward(parseInt(e.target.value))}
              placeholder="Введите награду"
            />
          </div>
          <div>
            <Label>Максимальное количество использований (опционально)</Label>
            <Input
              type="number"
              value={bulkMaxUses || ''}
              onChange={(e) => setBulkMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Без ограничений"
            />
          </div>
          <div>
            <Label>Дата истечения (опционально)</Label>
            <Input
              type="datetime-local"
              value={bulkExpiresAt || ''}
              onChange={(e) => setBulkExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleBulkCreate} className="mt-4 bg-blue-600 hover:bg-blue-700">
          Создать промокоды массово
        </Button>
      </div>

      {/* Promo codes table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Список промокодов</h3>
        {isLoading ? (
          <p className="text-gray-400">Загрузка...</p>
        ) : isError ? (
          <p className="text-red-500">Ошибка загрузки промокодов.</p>
        ) : Array.isArray(promoCodes) && promoCodes.length > 0 ? (
          <Table>
            <TableCaption>Список всех активных промокодов.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Код</TableHead>
                <TableHead>Награда</TableHead>
                <TableHead>Макс. использований</TableHead>
                <TableHead>Использовано</TableHead>
                <TableHead>Истекает</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promoCode) => (
                <TableRow key={promoCode.id}>
                  <TableCell className="font-medium">{promoCode.code}</TableCell>
                  <TableCell>{promoCode.reward_coins}</TableCell>
                  <TableCell>{promoCode.max_uses === null || promoCode.max_uses === undefined ? 'Без ограничений' : promoCode.max_uses}</TableCell>
                  <TableCell>{promoCode.current_uses || 0}</TableCell>
                  <TableCell>
                    {promoCode.expires_at ? new Date(promoCode.expires_at).toLocaleString() : 'Никогда'}
                  </TableCell>
                  <TableCell>{promoCode.is_active ? 'Да' : 'Нет'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdatePromoCode(promoCode.id, { is_active: !promoCode.is_active })}
                    >
                      {promoCode.is_active ? 'Деактивировать' : 'Активировать'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePromoCode(promoCode.id)}
                      className="ml-2"
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-400">Промокоды не найдены.</p>
        )}
      </div>
    </div>
  );
};

export default PromoCodeManagement;
