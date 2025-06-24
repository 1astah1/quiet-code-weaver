import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Plus, Calendar, Users, Trash2 } from "lucide-react";
import { PromoCode } from "@/utils/supabaseTypes";

const PromoCodeManagement = () => {
  const [newPromoCode, setNewPromoCode] = useState<Omit<PromoCode, 'id' | 'current_uses' | 'is_active' | 'created_at'>>({
    code: '',
    reward_coins: 100,
    max_uses: null,
    expires_at: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ['promo_codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PromoCode[];
    }
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: async (promoData: typeof newPromoCode) => {
      const { error } = await supabase
        .from('promo_codes')
        .insert([{
          ...promoData,
          code: promoData.code.toUpperCase(),
          expires_at: promoData.expires_at || null
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Промокод создан успешно" });
      setNewPromoCode({ code: '', reward_coins: 100, max_uses: null, expires_at: '' });
      queryClient.invalidateQueries({ queryKey: ['promo_codes'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
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
      queryClient.invalidateQueries({ queryKey: ['promo_codes'] });
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.code.trim()) {
      toast({ title: "Введите код промокода", variant: "destructive" });
      return;
    }
    createPromoCodeMutation.mutate(newPromoCode);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromoCode({ ...newPromoCode, code: result });
  };

  if (isLoading) {
    return <div className="text-white">Загрузка промокодов...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Управление промокодами</h2>
      </div>

      {/* Форма создания промокода */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Создать новый промокод</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Код промокода</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPromoCode.code}
                  onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })}
                  placeholder="PROMOCODE123"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                >
                  Генерировать
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Награда (монеты)</label>
              <input
                type="number"
                value={newPromoCode.reward_coins}
                onChange={(e) => setNewPromoCode({ ...newPromoCode, reward_coins: parseInt(e.target.value) || 0 })}
                min="1"
                max="100000"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Максимум использований</label>
              <input
                type="number"
                value={newPromoCode.max_uses != null ? String(newPromoCode.max_uses) : ''}
                onChange={(e) => setNewPromoCode({ ...newPromoCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Без ограничений"
                min="1"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Дата истечения</label>
              <input
                type="datetime-local"
                value={newPromoCode.expires_at}
                onChange={(e) => setNewPromoCode({ ...newPromoCode, expires_at: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createPromoCodeMutation.isPending}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {createPromoCodeMutation.isPending ? "Создание..." : "Создать промокод"}
          </button>
        </form>
      </div>

      {/* Список промокодов */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Существующие промокоды</h3>
        <div className="space-y-3">
          {promoCodes?.map((promo) => (
            <div key={promo.id} className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg text-white bg-slate-600 px-3 py-1 rounded">
                    {promo.code}
                  </span>
                  <span className="text-green-400 font-semibold">
                    +{promo.reward_coins} монет
                  </span>
                  {!promo.is_active && (
                    <span className="text-red-400 text-sm">Неактивен</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  {promo.max_uses && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{promo.current_uses}/{promo.max_uses} использований</span>
                    </div>
                  )}
                  {promo.expires_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>До {new Date(promo.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => deletePromoCodeMutation.mutate(promo.id)}
                disabled={deletePromoCodeMutation.isPending}
                className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {!promoCodes?.length && (
            <p className="text-slate-400 text-center py-8">Промокоды еще не созданы</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoCodeManagement;
