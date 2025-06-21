
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Edit3 } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  reward_coins: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const PromoCodeManagement = () => {
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    reward_coins: 100,
    max_uses: null as number | null,
    expires_at: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PromoCode[];
    }
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: async (promoData: typeof newPromoCode) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert([{
          code: promoData.code,
          reward_coins: promoData.reward_coins,
          max_uses: promoData.max_uses,
          expires_at: promoData.expires_at || null,
          is_active: true
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Промокод создан успешно" });
      setNewPromoCode({ code: '', reward_coins: 100, max_uses: null, expires_at: '' });
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PromoCode> }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Промокод обновлен" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
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
      toast({ title: "Промокод удален" });
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.code) {
      toast({ title: "Введите код промокода", variant: "destructive" });
      return;
    }
    createPromoCodeMutation.mutate(newPromoCode);
  };

  const toggleActive = (id: string, currentStatus: boolean) => {
    updatePromoCodeMutation.mutate({
      id,
      updates: { is_active: !currentStatus }
    });
  };

  if (isLoading) {
    return <div className="text-white">Загрузка промокодов...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Создать промокод
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Код промокода</Label>
                <Input
                  value={newPromoCode.code}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME2024"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Награда (монеты)</Label>
                <Input
                  type="number"
                  value={newPromoCode.reward_coins}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, reward_coins: parseInt(e.target.value) })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Максимум использований</Label>
                <Input
                  type="number"
                  value={newPromoCode.max_uses || ''}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Без ограничений"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Срок действия</Label>
                <Input
                  type="datetime-local"
                  value={newPromoCode.expires_at}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, expires_at: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <Button type="submit" disabled={createPromoCodeMutation.isPending}>
              {createPromoCodeMutation.isPending ? "Создание..." : "Создать промокод"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Существующие промокоды</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {promoCodes?.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-mono text-lg">{promo.code}</span>
                    <span className="text-yellow-400">{promo.reward_coins} монет</span>
                    <span className="text-gray-400">
                      {promo.current_uses}/{promo.max_uses || '∞'} использований
                    </span>
                    {promo.expires_at && (
                      <span className="text-gray-400">
                        до {new Date(promo.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      promo.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {promo.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(promo.id, promo.is_active)}
                    className="border-gray-600"
                  >
                    {promo.is_active ? 'Деактивировать' : 'Активировать'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePromoCodeMutation.mutate(promo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodeManagement;
