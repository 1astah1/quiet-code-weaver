import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Save, X, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import InstantImage from "@/components/ui/InstantImage";
import { CaseSkin } from "@/utils/supabaseTypes";

interface CaseSkinManagementProps {
  caseId: string;
  caseName: string;
  onClose: () => void;
}

const CaseSkinManagement = ({ caseId, caseName, onClose }: CaseSkinManagementProps) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editData, setEditData] = useState<CaseSkin | Record<string, unknown>>({} as CaseSkin);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkinData, setNewSkinData] = useState({
    reward_type: 'skin',
    skin_id: '',
    coin_reward_id: '',
    probability: 10,
    never_drop: false,
    custom_probability: null as number | null
  });
  const [cloneFromCase, setCloneFromCase] = useState('');
  const [editingSkin, setEditingSkin] = useState<CaseSkin | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем скины в кейсе с принудительным обновлением
  const { data: caseSkins, isLoading, refetch: refetchCaseSkins } = useQuery({
    queryKey: ['case_skins', caseId],
    queryFn: async () => {
      console.log('🔄 [CASE_SKINS] Fetching case skins for:', caseId);
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          id,
          probability,
          never_drop,
          custom_probability,
          reward_type,
          skins (*),
          coin_rewards (*)
        `)
        .eq('case_id', caseId);
      
      if (error) {
        console.error('❌ [CASE_SKINS] Fetch error:', error);
        throw error;
      }
      
      console.log('✅ [CASE_SKINS] Fetched data:', data);
      return data || [];
    },
    staleTime: 0, // Всегда считать данные устаревшими
    gcTime: 0, // Не кэшировать данные (was cacheTime in older versions)
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Загружаем все доступные скины
  const { data: allSkins } = useQuery({
    queryKey: ['all_skins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Загружаем монетные награды
  const { data: coinRewards } = useQuery({
    queryKey: ['coin_rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coin_rewards')
        .select('*')
        .order('amount');
      if (error) throw error;
      return data || [];
    }
  });

  // Загружаем все кейсы для клонирования
  const { data: allCases } = useQuery({
    queryKey: ['all_cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, name')
        .neq('id', caseId)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const totalProbability = caseSkins?.reduce((sum, item) => {
    return sum + (item.custom_probability || item.probability || 0);
  }, 0) || 0;

  const isProbabilityValid = totalProbability <= 100;

  const handleEditItem = (item: CaseSkin) => {
    setEditingItemId(item.id ? String(item.id) : '');
    setEditData({
      probability: item.probability,
      custom_probability: item.custom_probability,
      never_drop: item.never_drop
    });
  };

  const handleSaveItem = async () => {
    if (!editingItemId) return;
    try {
      const { error } = await supabase
        .from('case_skins')
        .update({
          probability: editData.probability,
          custom_probability: editData.custom_probability,
          never_drop: editData.never_drop,
        })
        .eq('id', editingItemId);
      
      if (error) throw error;
      
      setEditingItemId(null);
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: "Параметры скина обновлены" });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Удалить этот предмет из кейса?')) return;

    try {
      const { error } = await supabase
        .from('case_skins')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: "Предмет удален из кейса" });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleAddSkin = async () => {
    if (newSkinData.reward_type === 'skin' && !newSkinData.skin_id) {
      toast({ title: "Ошибка", description: "Выберите скин", variant: "destructive" });
      return;
    }
    if (newSkinData.reward_type === 'coin_reward' && !newSkinData.coin_reward_id) {
      toast({ title: "Ошибка", description: "Выберите монетную награду", variant: "destructive" });
      return;
    }

    try {
      const insertData = {
        case_id: caseId,
        reward_type: newSkinData.reward_type,
        probability: newSkinData.probability,
        never_drop: newSkinData.never_drop,
        custom_probability: newSkinData.custom_probability,
        skin_id: newSkinData.reward_type === 'skin' ? newSkinData.skin_id : undefined,
        coin_reward_id: newSkinData.reward_type === 'coin_reward' ? newSkinData.coin_reward_id : undefined,
      };

      const { error } = await supabase
        .from('case_skins')
        .insert([insertData]);
      
      if (error) throw error;
      
      setNewSkinData({
        reward_type: 'skin',
        skin_id: '',
        coin_reward_id: '',
        probability: 10,
        never_drop: false,
        custom_probability: null
      });
      setShowAddForm(false);
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: "Предмет добавлен в кейс" });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleCloneCase = async () => {
    if (!cloneFromCase) {
      toast({ title: "Ошибка", description: "Выберите кейс для клонирования", variant: "destructive" });
      return;
    }

    try {
      // Получаем скины из исходного кейса
      const { data: sourceSkins, error: fetchError } = await supabase
        .from('case_skins')
        .select('*')
        .eq('case_id', cloneFromCase);

      if (fetchError) throw fetchError;

      if (!sourceSkins || sourceSkins.length === 0) {
        toast({ title: "Ошибка", description: "В выбранном кейсе нет предметов", variant: "destructive" });
        return;
      }

      // Копируем скины в текущий кейс
      const itemsToInsert = sourceSkins.map(item => {
        const { id, created_at, ...remaningItem } = item;
        return {
          ...remaningItem,
          case_id: caseId,
        }
      });
      
      const { error: insertError } = await supabase
        .from('case_skins')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      setCloneFromCase('');
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: "Клонирование завершено", description: `Скопировано ${sourceSkins.length} предметов` });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка клонирования", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleUpdateProbabilities = async () => {
    if (!caseSkins) return;
    try {
      const updates = caseSkins.map(item => {
        const newProb = item.custom_probability ?? item.probability ?? 0;
        return supabase
          .from('case_skins')
          .update({ probability: newProb })
          .eq('id', item.id);
      });
      await Promise.all(updates);
      toast({ title: "Вероятности обновлены" });
      await refetchCaseSkins();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка обновления вероятностей", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const handleEditSkin = (caseSkin: any) => {
    setEditingSkin({
      ...caseSkin,
      probability: Number(caseSkin.probability) || 0,
      custom_probability: Number(caseSkin.custom_probability) || 0,
      never_drop: Boolean(caseSkin.never_drop)
    });
    setShowEditModal(true);
  };

  if (isLoading) {
    return <div className="text-white">Загрузка...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-white">
          Управление скинами: {caseName}
        </h4>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetchCaseSkins()} size="sm" className="bg-blue-600 hover:bg-blue-700">
            🔄 Обновить
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Статистика кейса */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{caseSkins?.length || 0}</div>
            <div className="text-gray-400 text-sm">Предметов</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isProbabilityValid ? 'text-green-400' : 'text-red-400'}`}>
              {totalProbability.toFixed(2)}%
            </div>
            <div className="text-gray-400 text-sm">Общая вероятность</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {caseSkins?.filter(item => !item.never_drop).length || 0}
            </div>
            <div className="text-gray-400 text-sm">Выпадающих</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {caseSkins?.filter(item => item.never_drop).length || 0}
            </div>
            <div className="text-gray-400 text-sm">Не выпадают</div>
          </div>
        </div>
        {!isProbabilityValid && (
          <div className="mt-3 text-red-400 text-sm text-center">
            ⚠️ Общая вероятность превышает 100%
          </div>
        )}
      </div>

      {/* Управляющие кнопки */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить предмет
        </Button>
        
        <div className="flex items-center gap-2">
          <select
            value={cloneFromCase}
            onChange={(e) => setCloneFromCase(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="">Клонировать из кейса...</option>
            {allCases?.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleCloneCase}
            disabled={!cloneFromCase}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Клонировать
          </Button>
        </div>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
          <h5 className="text-white font-medium mb-4">Добавить новый предмет</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Тип награды:</label>
              <select
                value={newSkinData.reward_type}
                onChange={(e) => setNewSkinData({ 
                  ...newSkinData, 
                  reward_type: e.target.value,
                  skin_id: '',
                  coin_reward_id: ''
                })}
                className="bg-gray-600 text-white px-3 py-2 rounded w-full border border-gray-500"
              >
                <option value="skin">Скин</option>
                <option value="coin_reward">Монеты</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                {newSkinData.reward_type === 'skin' ? 'Скин:' : 'Монетная награда:'}
              </label>
              {newSkinData.reward_type === 'skin' ? (
                <select
                  value={newSkinData.skin_id}
                  onChange={(e) => setNewSkinData({ ...newSkinData, skin_id: e.target.value })}
                  className="bg-gray-600 text-white px-3 py-2 rounded w-full border border-gray-500"
                >
                  <option value="">Выберите скин</option>
                  {allSkins?.map((skin) => (
                    <option key={skin.id} value={skin.id}>
                      {skin.name} ({skin.weapon_type}) - {skin.price} монет
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={newSkinData.coin_reward_id}
                  onChange={(e) => setNewSkinData({ ...newSkinData, coin_reward_id: e.target.value })}
                  className="bg-gray-600 text-white px-3 py-2 rounded w-full border border-gray-500"
                >
                  <option value="">Выберите награду</option>
                  {coinRewards?.map((reward) => (
                    <option key={reward.id} value={reward.id}>
                      {reward.name} ({reward.amount} монет)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Вероятность (%):</label>
              <Input
                type="number"
                value={typeof newSkinData.probability === 'number' ? newSkinData.probability : ''}
                onChange={(e) => setNewSkinData({ ...newSkinData, probability: parseFloat(e.target.value) || 0 })}
                className="bg-gray-600 text-white border-gray-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Кастомная вероятность (%):</label>
              <Input
                type="number"
                value={typeof newSkinData.custom_probability === 'number' ? newSkinData.custom_probability : ''}
                onChange={(e) => setNewSkinData({ 
                  ...newSkinData, 
                  custom_probability: e.target.value ? parseFloat(e.target.value) : null 
                })}
                className="bg-gray-600 text-white border-gray-500"
                min="0"
                max="100"
                step="0.01"
                placeholder="Оставьте пустым для обычной"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={typeof newSkinData.never_drop === 'boolean' ? newSkinData.never_drop : false}
                  onChange={(e) => setNewSkinData({ ...newSkinData, never_drop: e.target.checked })}
                  className="rounded"
                />
                <span className="text-gray-300">Никогда не выпадает (только показывается в рулетке)</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button
              onClick={handleAddSkin}
              disabled={
                (newSkinData.reward_type === 'skin' && !newSkinData.skin_id) ||
                (newSkinData.reward_type === 'coin_reward' && !newSkinData.coin_reward_id)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Добавить
            </Button>
            <Button 
              onClick={() => setShowAddForm(false)} 
              variant="outline"
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Список скинов с улучшенным отображением изображений */}
      <div className="space-y-4">
        {caseSkins.map((caseSkin) => (
          <div key={caseSkin.id} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {caseSkin.reward_type === 'skin' ? (
                  <>
                    <InstantImage 
                      src={caseSkin.skins?.image_url} 
                      alt={caseSkin.skins?.name || 'Скин'}
                      className="w-12 h-12 object-cover rounded"
                      fallback={
                        <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
                          🎯
                        </div>
                      }
                    />
                    <div>
                      <h6 className="text-white font-medium">{caseSkin.skins?.name}</h6>
                      <p className="text-gray-400 text-sm">
                        {caseSkin.skins?.weapon_type} • {caseSkin.skins?.price} монет
                        {!caseSkin.skins?.image_url && (
                          <span className="text-yellow-400 ml-2">• Нет изображения</span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-yellow-500 rounded flex items-center justify-center">
                      <span className="text-white text-xl">🪙</span>
                    </div>
                    <div>
                      <h6 className="text-white font-medium">{caseSkin.coin_rewards?.name}</h6>
                      <p className="text-gray-400 text-sm">{caseSkin.coin_rewards?.amount} монет</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {editingItemId === caseSkin.id ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <Input
                        type="number"
                        value={typeof editData.probability === 'number' ? editData.probability : ''}
                        onChange={(e) => setEditData({ ...editData, probability: parseFloat(e.target.value) || 0 })}
                        placeholder="Вероятность"
                        className="w-20 bg-gray-600 text-white border-gray-500 text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        value={typeof editData.custom_probability === 'number' ? editData.custom_probability : ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          custom_probability: e.target.value ? parseFloat(e.target.value) : null 
                        })}
                        placeholder="Кастом"
                        className="w-20 bg-gray-600 text-white border-gray-500 text-sm mt-1"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={typeof editData.never_drop === 'boolean' ? editData.never_drop : false}
                        onChange={(e) => setEditData({ ...editData, never_drop: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-gray-300 text-sm ml-1">Не выпадает</span>
                    </label>
                    <Button onClick={handleSaveItem} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button onClick={() => setEditingItemId(null)} size="sm" variant="outline">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {caseSkin.custom_probability || caseSkin.probability}%
                      </div>
                      {caseSkin.never_drop && (
                        <div className="text-red-400 text-sm">Не выпадает</div>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleEditItem(caseSkin)} 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      onClick={() => handleDeleteItem(caseSkin.id ? String(caseSkin.id) : '')} 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              ID: {caseSkin.id} | Добавлен: {caseSkin.created_at ? format(new Date(caseSkin.created_at), 'dd.MM.yyyy HH:mm') : '—'}
            </div>
          </div>
        ))}
      </div>

      {(!caseSkins || caseSkins.length === 0) && (
        <div className="text-center py-8 text-gray-400">
          В этом кейсе пока нет предметов
        </div>
      )}
    </div>
  );
};

export default CaseSkinManagement;
