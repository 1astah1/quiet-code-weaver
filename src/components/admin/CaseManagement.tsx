import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Upload, X, Shuffle, Image } from "lucide-react";
import CaseSkinManagement from "./CaseSkinManagement";
import { Case } from "@/utils/supabaseTypes";

interface CaseManagementProps {
  tableData: Case[];
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
  const [editData, setEditData] = useState<Case | Record<string, unknown>>({} as Case);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSkinForm, setShowAddSkinForm] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    name: '',
    description: '',
    price: 0,
    is_free: false,
    cover_image_url: '',
    image_url: ''
  });
  const [newSkinData, setNewSkinData] = useState({
    reward_type: 'skin',
    skin_id: '',
    coin_reward_id: '',
    probability: 1.0,
    never_drop: false,
    custom_probability: null as number | null
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState<{ [key: string]: boolean }>({});
  const [isAutoSelectingSkns, setIsAutoSelectingSkins] = useState(false);
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

  // ИСПРАВЛЕНО: Валидация вероятности с учетом ограничений БД
  const validateProbability = (value: number): boolean => {
    return value >= 0 && value <= 9.9999 && !isNaN(value);
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

  // ИСПРАВЛЕНО: Функция автоподбора скинов с правильным синтаксисом Supabase
  const handleAutoSelectSkins = async () => {
    if (!selectedCase) {
      toast({ 
        title: "Ошибка", 
        description: "Выберите кейс для автоподбора скинов",
        variant: "destructive" 
      });
      return;
    }

    setIsAutoSelectingSkins(true);
    try {
      // Получаем уже добавленные скины
      const { data: existingSkins } = await supabase
        .from('case_skins')
        .select('skin_id')
        .eq('case_id', selectedCase)
        .not('skin_id', 'is', null);

      const existingSkinIds = existingSkins?.map(item => item.skin_id) || [];

      // ИСПРАВЛЕНО: Получаем случайные скины с правильным синтаксисом
      let availableSkinsQuery = supabase
        .from('skins')
        .select('id, name, rarity, price')
        .order('id', { ascending: false })
        .limit(50);

      // Исключаем уже добавленные скины
      if (existingSkinIds.length > 0) {
        availableSkinsQuery = availableSkinsQuery.not('id', 'in', `(${existingSkinIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data: availableSkins, error: skinsError } = await availableSkinsQuery;

      if (skinsError) {
        throw skinsError;
      }

      if (!availableSkins || availableSkins.length === 0) {
        toast({ 
          title: "Нет доступных скинов", 
          description: "Все скины уже добавлены в кейс или нет скинов в базе",
          variant: "destructive" 
        });
        return;
      }

      // Перемешиваем и берем первые 10
      const shuffledSkins = availableSkins.sort(() => Math.random() - 0.5).slice(0, 10);

      // ИСПРАВЛЕНО: Добавляем каждый скин с вероятностью в пределах БД (максимум 9.9999)
      const rarityProbabilities: { [key: string]: number } = {
        'Consumer Grade': 8.5,
        'Industrial Grade': 6.0,
        'Mil-Spec': 4.5,
        'Restricted': 2.5,
        'Classified': 1.5,
        'Covert': 0.8,
        'Contraband': 0.3
      };

      const insertPromises = shuffledSkins.map(async (skin) => {
        const probability = Math.min(rarityProbabilities[skin.rarity] || 5.0, 9.9999);
        
        return supabase
          .from('case_skins')
          .insert({
            case_id: selectedCase,
            skin_id: skin.id,
            reward_type: 'skin',
            probability: probability,
            never_drop: false,
            custom_probability: null
          });
      });

      const results = await Promise.all(insertPromises);
      
      // Проверяем на ошибки
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors during auto-select:', errors);
        throw new Error(`Не удалось добавить ${errors.length} скинов`);
      }

      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      
      toast({ 
        title: "Автоподбор завершен!", 
        description: `Добавлено ${shuffledSkins.length} скинов в кейс` 
      });

    } catch (error) {
      console.error('Auto-select error:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка автоподбора", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsAutoSelectingSkins(false);
    }
  };

  // НОВОЕ: Функция загрузки изображений для новых кейсов
  const handleImageUpload = async (file: File, fieldName: string) => {
    if (!file) return;
    
    const setLoading = fieldName === 'cover_image_url' ? setUploadingCoverImage : setUploadingMainImage;
    setLoading(true);
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folder = fieldName === 'cover_image_url' ? 'case-covers' : 'case-images';
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading case image to:', filePath);

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
      toast({ title: "Изображение загружено" });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка загрузки", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // НОВОЕ: Функция загрузки изображений для редактирования кейсов
  const handleEditImageUpload = async (file: File, caseId: string, fieldName: string) => {
    if (!file) return;
    
    setUploadingEditImage({ ...uploadingEditImage, [`${caseId}_${fieldName}`]: true });
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folder = fieldName === 'cover_image_url' ? 'case-covers' : 'case-images';
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading case image to:', filePath);

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

      // Обновляем данные в режиме редактирования
      if (editingCase === caseId) {
        setEditData({ ...editData, [fieldName]: publicUrl });
      }

      // Также обновляем в базе данных
      const { error: updateError } = await supabase
        .from('cases')
        .update({ [fieldName]: publicUrl })
        .eq('id', caseId);

      if (updateError) {
        throw new Error(`Ошибка обновления: ${updateError.message}`);
      }

      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Изображение обновлено" });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка загрузки", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setUploadingEditImage(prev => ({ ...prev, [`${caseId}_${fieldName}`]: false }));
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
        cover_image_url: '',
        image_url: ''
      });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс успешно добавлен" });
    } catch (error) {
      console.error('Error adding case:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: `Не удалось добавить кейс: ${errorMessage}`, 
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
    } catch (error) {
      console.error('Error deleting case:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: `Не удалось удалить кейс: ${errorMessage}`, 
        variant: "destructive" 
      });
    }
  };

  const handleEditCase = (caseItem: Case) => {
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
      console.error('Error saving case:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: `Не удалось сохранить кейс: ${errorMessage}`, 
        variant: "destructive" 
      });
    }
  };

  const handleAddSkinToCase = async () => {
    const currentCaseId = selectedCase;
    if (!currentCaseId) {
      toast({
        title: "Ошибка",
        description: "Сначала выберите кейс, в который хотите добавить предмет.",
        variant: "destructive"
      });
      return;
    }

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

    // ИСПРАВЛЕНО: Валидация вероятностей с учетом ограничений БД
    if (!validateProbability(newSkinData.probability)) {
      toast({ 
        title: "Ошибка вероятности", 
        description: "Вероятность должна быть от 0 до 9.9999% (ограничение БД)",
        variant: "destructive" 
      });
      return;
    }

    if (newSkinData.custom_probability !== null && !validateProbability(newSkinData.custom_probability)) {
      toast({ 
        title: "Ошибка кастомной вероятности", 
        description: "Кастомная вероятность должна быть от 0 до 9.9999% (ограничение БД)",
        variant: "destructive" 
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('case_skins')
        .insert({
          case_id: currentCaseId,
          skin_id: newSkinData.reward_type === 'skin' ? newSkinData.skin_id : null,
          coin_reward_id: newSkinData.reward_type === 'coin' ? newSkinData.coin_reward_id : null,
          reward_type: newSkinData.reward_type,
          probability: newSkinData.custom_probability ?? newSkinData.probability,
          never_drop: newSkinData.never_drop,
        })
        .select();

      if (error) throw error;
      
      toast({ title: "Предмет добавлен в кейс" });
      setShowAddSkinForm(false);
      queryClient.invalidateQueries({ queryKey: ['case_skins', currentCaseId] });
      
    } catch (error) {
      console.error('Error adding skin to case:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: `Не удалось добавить предмет: ${errorMessage}`, 
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
    } catch (error) {
      console.error('Error removing skin from case:', error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({ 
        title: "Ошибка", 
        description: `Не удалось удалить предмет: ${errorMessage}`, 
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
      setSelectedCase(caseId ? String(caseId) : null);
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
              value={typeof newCaseData.name === 'string' ? newCaseData.name : ''}
              onChange={(e) => setNewCaseData({ ...newCaseData, name: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Цена"
              value={typeof newCaseData.price === 'number' ? newCaseData.price : Number(newCaseData.price) || ''}
              onChange={(e) => setNewCaseData({ ...newCaseData, price: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <div className="col-span-1 md:col-span-2">
              <textarea
                placeholder="Описание кейса"
                value={typeof newCaseData.description === 'string' ? newCaseData.description : ''}
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
                <div className="mt-2 relative">
                  <img 
                    src={newCaseData.cover_image_url} 
                    alt="Cover Preview" 
                    className="w-20 h-15 object-cover rounded"
                  />
                  <button
                    onClick={() => setNewCaseData({ ...newCaseData, cover_image_url: '' })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Основное изображение кейса:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingMainImage}
              />
              <p className="text-gray-400 text-xs mt-1">Рекомендуемый размер: 512x512px, форматы: JPG, PNG, WebP, максимум 5MB</p>
              {newCaseData.image_url && (
                <div className="mt-2 relative">
                  <img 
                    src={newCaseData.image_url} 
                    alt="Main Preview" 
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    onClick={() => setNewCaseData({ ...newCaseData, image_url: '' })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-center space-x-2 col-span-1 md:col-span-2">
              <input
                type="checkbox"
                checked={typeof newCaseData.is_free === 'boolean' ? newCaseData.is_free : false}
                onChange={(e) => setNewCaseData({ ...newCaseData, is_free: e.target.checked })}
                className="text-orange-500"
              />
              <span className="text-gray-300">Бесплатный кейс</span>
            </label>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={handleAddCase}
              disabled={uploadingCoverImage || uploadingMainImage || !newCaseData.name}
              className="bg-green-600 hover:bg-green-700"
            >
              {(uploadingCoverImage || uploadingMainImage) ? (
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
                  value={typeof editData.name === 'string' ? editData.name : ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Название кейса"
                />
                <textarea
                  value={typeof editData.description === 'string' ? editData.description : ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Описание"
                  rows={2}
                />
                <input
                  type="number"
                  value={typeof editData.price === 'number' ? editData.price : Number(editData.price) || ''}
                  onChange={(e) => setEditData({...editData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Цена"
                />

                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm">Обложка кейса:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEditImageUpload(file, caseItem.id, 'cover_image_url');
                      }}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm flex-1"
                      disabled={uploadingEditImage[`${caseItem.id}_cover_image_url`]}
                    />
                    {uploadingEditImage[`${caseItem.id}_cover_image_url`] && (
                      <Upload className="w-4 h-4 animate-spin text-orange-500" />
                    )}
                  </div>
                  {(typeof editData.cover_image_url === 'string' && editData.cover_image_url) && (
                    <img 
                      src={editData.cover_image_url} 
                      alt="Cover" 
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm">Основное изображение:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEditImageUpload(file, caseItem.id, 'image_url');
                      }}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm flex-1"
                      disabled={uploadingEditImage[`${caseItem.id}_image_url`]}
                    />
                    {uploadingEditImage[`${caseItem.id}_image_url`] && (
                      <Upload className="w-4 h-4 animate-spin text-orange-500" />
                    )}
                  </div>
                  {(typeof editData.image_url === 'string' && editData.image_url) && (
                    <img 
                      src={editData.image_url} 
                      alt="Main" 
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={typeof editData.is_free === 'boolean' ? editData.is_free : false}
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
                  {(typeof caseItem.cover_image_url === 'string' && caseItem.cover_image_url) && (
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
                      {selectedCase === caseItem.id ? "Скрыть скины" : "Управление скинами"}
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
              Автоподбор скинов для: {tableData?.find(c => c.id === selectedCase)?.name}
            </h4>
            <Button
              onClick={handleAutoSelectSkins}
              disabled={isAutoSelectingSkns}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-2 text-sm"
            >
              {isAutoSelectingSkns ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Подбираем...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Автоподбор скинов (до 10)
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">
              Автоматически добавит до 10 случайных скинов в кейс с вероятностями по редкости.
            </p>
            <p className="text-yellow-400 text-xs bg-yellow-900/20 p-2 rounded">
              ⚠️ Максимальная вероятность: 9.9999% (ограничение базы данных)
            </p>
          </div>
        </div>
      )}

      {selectedCase && (
        <CaseSkinManagement
          caseId={selectedCase}
          caseName={tableData?.find(c => c.id === selectedCase)?.name || 'Неизвестный кейс'}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
};

export default CaseManagement;
