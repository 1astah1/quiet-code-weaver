import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Upload, X } from "lucide-react";

interface CaseManagementProps {
  tableData: any[];
  selectedCase: string | null;
  setSelectedCase: (caseId: string | null) => void;
  uploadingImage: boolean;
  onSkinImageUpload: (file: File, skinId: string) => void;
}

const CaseManagement = ({ 
  tableData, 
  selectedCase, 
  setSelectedCase, 
  uploadingImage, 
  onSkinImageUpload 
}: CaseManagementProps) => {
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSkinForm, setShowAddSkinForm] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    name: '',
    description: '',
    price: 0,
    is_free: false,
    cover_image_url: ''
  });
  const [newSkinData, setNewSkinData] = useState({
    reward_type: 'skin',
    skin_id: '',
    coin_reward_id: '',
    probability: 10,
    never_drop: false,
    custom_probability: null as number | null
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for all available skins to add to case
  const { data: allSkins } = useQuery({
    queryKey: ['all_skins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading skins:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Query for all coin rewards
  const { data: coinRewards } = useQuery({
    queryKey: ['coin_rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coin_rewards')
        .select('*')
        .order('amount');
      
      if (error) {
        console.error('Error loading coin rewards:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Валидация вероятности
  const validateProbability = (value: number): boolean => {
    return value >= 0 && value <= 100 && value <= 9.9999;
  };

  const { data: caseSkins } = useQuery({
    queryKey: ['case_skins', selectedCase],
    queryFn: async () => {
      if (!selectedCase) return [];
      console.log('Loading case skins for case:', selectedCase);
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
        .eq('case_id', selectedCase);
      
      if (error) {
        console.error('Error loading case skins:', error);
        throw error;
      }
      console.log('Loaded case skins:', data);
      return data || [];
    },
    enabled: !!selectedCase
  });

  const handleImageUpload = async (file: File, fieldName: string) => {
    if (!file) return;
    
    setUploadingCoverImage(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `case-covers/${fileName}`;

      console.log('Uploading case cover to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('case-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);

      setNewCaseData({ ...newCaseData, [fieldName]: publicUrl });
      toast({ title: "Изображение загружено успешно" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleAddCase = async () => {
    try {
      const { error } = await supabase
        .from('cases')
        .insert([newCaseData]);
      
      if (error) throw error;
      
      setNewCaseData({
        name: '',
        description: '',
        price: 0,
        is_free: false,
        cover_image_url: ''
      });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс успешно добавлен" });
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот кейс? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const { error: skinsError } = await supabase
        .from('case_skins')
        .delete()
        .eq('case_id', caseId);

      if (skinsError) throw skinsError;

      const { error: caseError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (caseError) throw caseError;

      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс успешно удален" });
      
      if (selectedCase === caseId) {
        setSelectedCase(null);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ 
        title: "Ошибка удаления", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleEditCase = (caseItem: any) => {
    setEditingCase(caseItem.id);
    setEditData(caseItem);
  };

  const handleSaveCase = async () => {
    try {
      const { error } = await supabase
        .from('cases')
        .update(editData)
        .eq('id', editingCase);
      
      if (error) throw error;
      
      setEditingCase(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс обновлен" });
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: "Ошибка обновления", variant: "destructive" });
    }
  };

  const handleAddSkinToCase = async () => {
    if (!selectedCase) {
      toast({ 
        title: "Ошибка", 
        description: "Выберите кейс",
        variant: "destructive" 
      });
      return;
    }

    // Проверяем что выбран либо скин либо монетная награда
    if (newSkinData.reward_type === 'skin' && !newSkinData.skin_id) {
      toast({ 
        title: "Ошибка", 
        description: "Выберите скин",
        variant: "destructive" 
      });
      return;
    }

    if (newSkinData.reward_type === 'coin_reward' && !newSkinData.coin_reward_id) {
      toast({ 
        title: "Ошибка", 
        description: "Выберите монетную награду",
        variant: "destructive" 
      });
      return;
    }

    // Валидация вероятностей
    if (!validateProbability(newSkinData.probability)) {
      toast({ 
        title: "Ошибка", 
        description: "Вероятность должна быть от 0 до 9.9999%",
        variant: "destructive" 
      });
      return;
    }

    if (newSkinData.custom_probability !== null && !validateProbability(newSkinData.custom_probability)) {
      toast({ 
        title: "Ошибка", 
        description: "Кастомная вероятность должна быть от 0 до 9.9999%",
        variant: "destructive" 
      });
      return;
    }

    try {
      // Проверяем, не добавлен ли уже этот предмет в кейс
      const { data: existingItem } = await supabase
        .from('case_skins')
        .select('id')
        .eq('case_id', selectedCase)
        .eq(newSkinData.reward_type === 'skin' ? 'skin_id' : 'coin_reward_id', 
            newSkinData.reward_type === 'skin' ? newSkinData.skin_id : newSkinData.coin_reward_id)
        .maybeSingle();

      if (existingItem) {
        toast({ 
          title: "Ошибка", 
          description: `Эта ${newSkinData.reward_type === 'skin' ? 'награда' : 'монетная награда'} уже добавлена в кейс`,
          variant: "destructive" 
        });
        return;
      }

      const insertData: any = {
        case_id: selectedCase,
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
      setShowAddSkinForm(false);
      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      toast({ title: `${newSkinData.reward_type === 'skin' ? 'Скин' : 'Монетная награда'} успешно добавлена в кейс` });
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleRemoveSkinFromCase = async (caseSkinId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот скин из кейса?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('case_skins')
        .delete()
        .eq('id', caseSkinId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      toast({ title: "Скин удален из кейса" });
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleSkinsButtonClick = (caseId: string) => {
    console.log('Скины кнопка нажата для кейса:', caseId);
    console.log('Текущий выбранный кейс:', selectedCase);
    
    // Если кейс уже выбран, скрываем его. Иначе показываем скины для этого кейса
    if (selectedCase === caseId) {
      setSelectedCase(null);
    } else {
      setSelectedCase(caseId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Управление кейсами</h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить кейс
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-white font-medium mb-4">Добавить новый кейс</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название кейса"
              value={newCaseData.name}
              onChange={(e) => setNewCaseData({ ...newCaseData, name: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Цена"
              value={newCaseData.price}
              onChange={(e) => setNewCaseData({ ...newCaseData, price: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <div className="col-span-1 md:col-span-2">
              <textarea
                placeholder="Описание кейса"
                value={newCaseData.description}
                onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                rows={3}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Обложка кейса:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'cover_image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingCoverImage}
              />
              <p className="text-gray-400 text-xs mt-1">Рекомендуемый размер: 800x600px, форматы: JPG, PNG, WebP, максимум 5MB</p>
              {newCaseData.cover_image_url && (
                <img 
                  src={newCaseData.cover_image_url} 
                  alt="Preview" 
                  className="w-20 h-15 object-cover rounded mt-2"
                />
              )}
            </div>
            <label className="flex items-center space-x-2 col-span-1 md:col-span-2">
              <input
                type="checkbox"
                checked={newCaseData.is_free}
                onChange={(e) => setNewCaseData({ ...newCaseData, is_free: e.target.checked })}
                className="text-orange-500"
              />
              <span className="text-gray-300">Бесплатный кейс</span>
            </label>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={handleAddCase}
              disabled={uploadingCoverImage || !newCaseData.name}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingCoverImage ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Загружаем...
                </>
              ) : (
                'Добавить'
              )}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tableData?.map((caseItem) => (
          <div key={caseItem.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            {editingCase === caseItem.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Название кейса"
                />
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Описание"
                  rows={2}
                />
                <input
                  type="number"
                  value={editData.price || ''}
                  onChange={(e) => setEditData({...editData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Цена"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.is_free || false}
                    onChange={(e) => setEditData({...editData, is_free: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-gray-300">Бесплатный</label>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSaveCase} className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm">
                    Сохранить
                  </Button>
                  <Button 
                    onClick={() => setEditingCase(null)} 
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-3">
                  {caseItem.cover_image_url && (
                    <img 
                      src={caseItem.cover_image_url} 
                      alt={caseItem.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{caseItem.name}</h4>
                    <p className="text-gray-400 text-sm">{caseItem.price} монет</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditCase(caseItem)}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      onClick={() => handleSkinsButtonClick(caseItem.id)}
                      variant={selectedCase === caseItem.id ? "default" : "outline"}
                      className={`px-2 py-1 text-xs ${
                        selectedCase === caseItem.id 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : ""
                      }`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {selectedCase === caseItem.id ? "Скрыть скины" : "Скины"}
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => handleDeleteCase(caseItem.id)}
                    className="bg-red-600 hover:bg-red-700 px-2 py-1 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedCase && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">
              Содержимое кейса {tableData?.find(c => c.id === selectedCase)?.name}
            </h4>
            <Button
              onClick={() => setShowAddSkinForm(!showAddSkinForm)}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Добавить награду
            </Button>
          </div>

          {showAddSkinForm && (
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h5 className="text-white font-medium mb-3">Добавить награду в кейс</h5>
              <div className="space-y-3">
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
                    className="bg-gray-600 text-white px-3 py-2 rounded w-full"
                  >
                    <option value="skin">Скин</option>
                    <option value="coin_reward">Монеты</option>
                  </select>
                </div>

                {newSkinData.reward_type === 'skin' ? (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Выберите скин:</label>
                    <select
                      value={newSkinData.skin_id}
                      onChange={(e) => setNewSkinData({ ...newSkinData, skin_id: e.target.value })}
                      className="bg-gray-600 text-white px-3 py-2 rounded w-full"
                    >
                      <option value="">Выберите скин</option>
                      {allSkins?.map((skin) => (
                        <option key={skin.id} value={skin.id}>
                          {skin.name} ({skin.weapon_type}) - {skin.price} монет
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Выберите монетную награду:</label>
                    <select
                      value={newSkinData.coin_reward_id}
                      onChange={(e) => setNewSkinData({ ...newSkinData, coin_reward_id: e.target.value })}
                      className="bg-gray-600 text-white px-3 py-2 rounded w-full"
                    >
                      <option value="">Выберите количество монет</option>
                      {coinRewards?.map((reward) => (
                        <option key={reward.id} value={reward.id}>
                          {reward.name} ({reward.amount} монет)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Вероятность (0-9.9999%):</label>
                    <input
                      type="number"
                      placeholder="Вероятность (0-9.9999%)"
                      value={newSkinData.probability}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value <= 9.9999) {
                          setNewSkinData({ ...newSkinData, probability: value });
                        }
                      }}
                      className="bg-gray-600 text-white px-3 py-2 rounded w-full"
                      min="0"
                      max="9.9999"
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Кастомная вероятность (опционально):</label>
                    <input
                      type="number"
                      placeholder="Кастомная вероятность (0-9.9999%)"
                      value={newSkinData.custom_probability || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : null;
                        if (value === null || value <= 9.9999) {
                          setNewSkinData({ ...newSkinData, custom_probability: value });
                        }
                      }}
                      className="bg-gray-600 text-white px-3 py-2 rounded w-full"
                      min="0"
                      max="9.9999"
                      step="0.0001"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSkinData.never_drop}
                    onChange={(e) => setNewSkinData({ ...newSkinData, never_drop: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-300">Никогда не выпадает</span>
                </label>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button
                  onClick={handleAddSkinToCase}
                  disabled={
                    (newSkinData.reward_type === 'skin' && !newSkinData.skin_id) ||
                    (newSkinData.reward_type === 'coin_reward' && !newSkinData.coin_reward_id)
                  }
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                >
                  Добавить
                </Button>
                <Button 
                  onClick={() => setShowAddSkinForm(false)} 
                  variant="outline"
                  className="px-3 py-1 text-sm"
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {caseSkins && caseSkins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {caseSkins.map((item: any) => (
                <div key={item.id} className="bg-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {item.reward_type === 'skin' ? (
                        <>
                          {item.skins?.image_url && (
                            <img 
                              src={item.skins.image_url} 
                              alt={item.skins.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.skins?.name}</p>
                            <p className="text-gray-400 text-xs">
                              {item.custom_probability || item.probability}%
                              {item.never_drop && " (не выпадает)"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">🪙</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.coin_rewards?.name}</p>
                            <p className="text-gray-400 text-xs">
                              {item.custom_probability || item.probability}%
                              {item.never_drop && " (не выпадает)"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveSkinFromCase(item.id)}
                      className="bg-red-600 hover:bg-red-700 p-1"
                      size="sm"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {item.reward_type === 'skin' && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onSkinImageUpload(file, item.skins.id);
                      }}
                      className="mt-2 text-xs text-gray-400"
                      disabled={uploadingImage}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              В этом кейсе пока нет наград
            </p>
          )}
          
          <Button
            onClick={() => setSelectedCase(null)}
            variant="outline"
            className="mt-4"
          >
            Закрыть
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
