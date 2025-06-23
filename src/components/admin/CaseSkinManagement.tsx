import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Save, X, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import InstantImage from "@/components/ui/InstantImage";

interface CaseSkinManagementProps {
  caseId: string;
  caseName: string;
  onClose: () => void;
}

const CaseSkinManagement = ({ caseId, caseName, onClose }: CaseSkinManagementProps) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
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

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditData({
      probability: item.probability,
      custom_probability: item.custom_probability,
      never_drop: item.never_drop
    });
  };

  const handleSaveItem = async () => {
    try {
      const { error } = await supabase
        .from('case_skins')
        .update(editData)
        .eq('id', editingItemId);
      
      if (error) throw error;
      
      setEditingItemId(null);
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: "Параметры скина обновлены" });
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
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
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
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
      const insertData: any = {
        case_id: caseId,
        reward_type: newSkinData.reward_type,
        probability: newSkinData.probability,
        never_drop: newSkinData.never_drop,
        custom_probability: newSkinData.custom_probability
      };

      if (newSkinData.reward_type === 'skin') {
        insertData.skin_id = newSkinData.skin_id;
      } else {
        insertData.coin_reward_id = newSkinData.coin_reward_id;
      }

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
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
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
      const { data: sourceSkns, error: fetchError } = await supabase
        .from('case_skins')
        .select('*')
        .eq('case_id', cloneFromCase);

      if (fetchError) throw fetchError;

      if (!sourceSkns || sourceSkns.length === 0) {
        toast({ title: "Ошибка", description: "В выбранном кейсе нет предметов", variant: "destructive" });
        return;
      }

      // Копируем скины в текущий кейс
      const itemsToInsert = sourceSkns.map(item => ({
        case_id: caseId,
        skin_id: item.skin_id,
        coin_reward_id: item.coin_reward_id,
        reward_type: item.reward_type,
        probability: item.probability,
        custom_probability: item.custom_probability,
        never_drop: item.never_drop
      }));

      const { error: insertError } = await supabase
        .from('case_skins')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      setCloneFromCase('');
      
      // Принудительное обновление данных
      await refetchCaseSkins();
      await queryClient.invalidateQueries({ queryKey: ['case_skins', caseId] });
      
      toast({ title: `Скопировано ${itemsToInsert.length} предметов` });
    } catch (error: any) {
      toast({ 
        title: "Ошибка клонирования", 
        description: error.message,
        variant: "destructive" 
      });
    }
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
                value={newSkinData.probability}
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
                value={newSkinData.custom_probability || ''}
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
                  checked={newSkinData.never_drop}
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
      <div className="space-y-3">
        {caseSkins?.map((item: any) => (
          <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {item.reward_type === 'skin' ? (
                  <>
                    <InstantImage 
                      src={item.skins?.image_url} 
                      alt={item.skins?.name || 'Скин'}
                      className="w-12 h-12 object-cover rounded"
                      fallback={
                        <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
                          🎯
                        </div>
                      }
                    />
                    <div>
                      <h6 className="text-white font-medium">{item.skins?.name}</h6>
                      <p className="text-gray-400 text-sm">
                        {item.skins?.weapon_type} • {item.skins?.price} монет
                        {!item.skins?.image_url && (
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
                      <h6 className="text-white font-medium">{item.coin_rewards?.name}</h6>
                      <p className="text-gray-400 text-sm">{item.coin_rewards?.amount} монет</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {editingItemId === item.id ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <Input
                        type="number"
                        value={editData.probability || ''}
                        onChange={(e) => setEditData({ ...editData, probability: parseFloat(e.target.value) || 0 })}
                        placeholder="Вероятность"
                        className="w-20 bg-gray-600 text-white border-gray-500 text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        value={editData.custom_probability || ''}
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
                        checked={editData.never_drop || false}
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
                        {item.custom_probability || item.probability}%
                      </div>
                      {item.never_drop && (
                        <div className="text-red-400 text-sm">Не выпадает</div>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleEditItem(item)} 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      onClick={() => handleDeleteItem(item.id)} 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!caseSkins || caseSkins.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            В этом кейсе пока нет предметов
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseSkinManagement;
