import React from 'react';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import AdminTableSelector from "./admin/AdminTableSelector";
import CaseManagement from "./admin/CaseManagement";
import BannerManagement from "./admin/BannerManagement";
import AddItemForm from "./admin/AddItemForm";
import AdminTable from "./admin/AdminTable";
import UserDuplicatesCleaner from "./admin/UserDuplicatesCleaner";
import UserManagement from "./admin/UserManagement";
import PromoCodeManagement from "./admin/PromoCodeManagement";
import SuspiciousActivityManagement from "./admin/SuspiciousActivityManagement";
import DatabaseImageCleanup from "./admin/DatabaseImageCleanup";
import type { TableName, RealTableName } from "@/types/admin";
import { Case, Skin, Task, DailyReward } from "@/utils/supabaseTypes";
import DailyRewardsAdminForm from "./admin/DailyRewardsAdminForm";
import { Button } from "@/components/ui/button";
import 'react/jsx-runtime';

const isRealTable = (table: TableName): table is RealTableName => {
  return table !== 'users' && table !== 'suspicious_activities';
}

const AdminPanel = () => {
  const [activeTable, setActiveTable] = useState<TableName>("cases");
  const [newItem, setNewItem] = useState<Case | Skin | Task | Record<string, unknown>>({} as Case);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tableData, isLoading } = useQuery<Case[] | Skin[] | Record<string, unknown>[]>({
    queryKey: [activeTable],
    queryFn: async () => {
      if (!isRealTable(activeTable)) {
        return [];
      }
      const { data, error } = await supabase
        .from(activeTable)
        .select('*');
      if (error) throw error;
      if (!Array.isArray(data)) return [];
      if (activeTable === 'cases') {
        const filtered = (data as unknown[]).filter(
          (item): item is Case =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'name' in item &&
            'price' in item
        );
        return filtered;
      }
      if (activeTable === 'skins') {
        const filtered = (data as unknown[]).filter(
          (item): item is Skin =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'name' in item &&
            'weapon_type' in item &&
            'rarity' in item &&
            'price' in item
        );
        return filtered;
      }
      // Остальные таблицы: фильтруем только объекты с id
      const filtered = (data as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && 'id' in item
      );
      return filtered;
    },
    enabled: activeTable !== 'users' && activeTable !== 'suspicious_activities'
  });

  // Для кастомной формы ежедневных наград
  const [editingReward, setEditingReward] = useState<DailyReward | null>(null);
  const [showRewardForm, setShowRewardForm] = useState(false);

  // Получить все day_number для валидации уникальности
  const dailyRewardDays = (tableData && activeTable === 'daily_rewards' && Array.isArray(tableData) && tableData.every(item => typeof item === 'object' && item !== null && 'day_number' in item && 'reward_type' in item && 'reward_coins' in item))
    ? (tableData as DailyReward[]).map(r => r.day_number)
    : [];

  // CRUD для daily_rewards
  const handleSaveReward = () => {
    setShowRewardForm(false);
    setEditingReward(null);
    queryClient.invalidateQueries({ queryKey: ['daily_rewards'] });
  };
  const handleCancelReward = () => {
    setShowRewardForm(false);
    setEditingReward(null);
  };

  // Универсальная функция для определения bucket и папки
  const getBucketAndFolder = (table: string, fieldName: string) => {
    console.log('🗂️ [GET_BUCKET] Determining bucket for:', { table, fieldName });
    
    if (table === 'banners') {
      return { bucketName: 'banner-images', folder: 'banners' };
    }
    
    // Все остальные используют case-images bucket
    let folder = 'misc';
    
    if (table === 'cases') {
      folder = fieldName === 'cover_image_url' ? 'case-covers' : 'case-images';
    } else if (table === 'skins') {
      folder = 'skin-images';
    } else if (table === 'quiz_questions') {
      folder = 'quiz-images';
    } else if (table === 'tasks') {
      folder = 'task-images';
    }
    
    const result = { bucketName: 'case-images', folder };
    console.log('🗂️ [GET_BUCKET] Result:', result);
    return result;
  };

  const ensureBucketExists = async (bucketName: string) => {
    try {
      console.log(`🪣 [BUCKET_CHECK] Checking bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (!error) {
        console.log(`✅ [BUCKET_CHECK] Bucket ${bucketName} exists and accessible`);
        return true;
      }
      
      console.warn(`⚠️ [BUCKET_CHECK] Bucket access issue:`, error);
      throw new Error(`Ошибка доступа к bucket ${bucketName}: ${error.message}`);
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ [BUCKET_ERROR] Error with bucket ${bucketName}:`, error);
        throw new Error(`Ошибка с bucket ${bucketName}: ${error.message}`);
      }
      throw new Error(`An unknown error occurred with bucket ${bucketName}`);
    }
  };

  const handleImageUpload = async (file: File | null, isEdit = false, itemId?: string, fieldName = 'image_url') => {
    if (!file) {
      console.warn('⚠️ [IMAGE_UPLOAD] No file provided');
      return;
    }
    
    setUploadingImage(true);
    
    try {
      console.log('📤 [IMAGE_UPLOAD] Starting upload:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        table: activeTable,
        fieldName,
        isEdit,
        itemId
      });

      // Валидация файла
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      // Определяем bucket и папку
      const { bucketName, folder } = getBucketAndFolder(activeTable, fieldName);
      
      // Проверяем bucket
      await ensureBucketExists(bucketName);

      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${activeTable}_${timestamp}_${randomId}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('📁 [IMAGE_UPLOAD] Upload details:', { bucketName, filePath, folder });

      // Загружаем файл
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [IMAGE_UPLOAD] Upload error:', uploadError);
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('✅ [IMAGE_UPLOAD] Upload successful:', publicUrl);

      // Обновляем данные
      if (isEdit && itemId) {
        console.log('💾 [IMAGE_UPLOAD] Updating database record:', { itemId, fieldName, publicUrl });
        
        if (!isRealTable(activeTable)) {
           throw new Error("Invalid table for database operation.");
        }

        const { error: updateError } = await supabase
          .from(activeTable)
          .update({ [fieldName]: publicUrl })
          .eq('id', itemId);
          
        if (updateError) {
          console.error('❌ [IMAGE_UPLOAD] Database update error:', updateError);
          throw new Error(`Ошибка обновления БД: ${updateError.message}`);
        }
        
        // МАКСИМАЛЬНО АГРЕССИВНАЯ инвалидация кэша
        console.log('🔄 [IMAGE_UPLOAD] Invalidating all caches...');
        await Promise.all([
          // Основные кэши
          queryClient.invalidateQueries({ queryKey: [activeTable] }),
          queryClient.invalidateQueries({ queryKey: ['shop-skins'] }),
          queryClient.invalidateQueries({ queryKey: ['all_skins'] }),
          queryClient.invalidateQueries({ queryKey: ['case_skins'] }),
          queryClient.invalidateQueries({ queryKey: ['skins'] }),
          
          // Специфичные кэши для скинов
          queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] }),
          queryClient.invalidateQueries({ queryKey: ['skins_cleanup_check'] }),
          
          // Кэши для баннеров
          queryClient.invalidateQueries({ queryKey: ['banners'] }),
          queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
          
          // Удаляем все кэши связанные с скинами
          queryClient.removeQueries({ queryKey: [activeTable] }),
          queryClient.removeQueries({ queryKey: ['shop-skins'] }),
          queryClient.removeQueries({ queryKey: ['all_skins'] })
        ]);
        
        // Принудительный рефетч через короткий таймаут
        setTimeout(async () => {
          console.log('🔄 [IMAGE_UPLOAD] Force refetching queries...');
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [activeTable] }),
            queryClient.refetchQueries({ queryKey: ['shop-skins'] }),
            queryClient.refetchQueries({ queryKey: ['all_skins'] }),
            queryClient.refetchQueries({ queryKey: ['case_skins', selectedCase] }),
            queryClient.refetchQueries({ queryKey: ['skins'] })
          ]);
        }, 100);
        
        // Дополнительный рефетч через более длительный таймаут
        setTimeout(async () => {
          console.log('🔄 [IMAGE_UPLOAD] Additional refetch...');
          await queryClient.refetchQueries({ queryKey: [activeTable] });
        }, 500);
        
      } else {
        console.log('📝 [IMAGE_UPLOAD] Setting new item field:', { fieldName, publicUrl });
        setNewItem({ ...newItem, [fieldName]: publicUrl });
      }

      toast({ 
        title: "Изображение загружено успешно",
        description: `Файл загружен в ${bucketName}/${folder}. URL: ${publicUrl}`
      });
      
      return publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ [IMAGE_UPLOAD] Upload failed:', error);
        toast({
          title: "Ошибка загрузки",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.error('❌ [IMAGE_UPLOAD] Upload failed with unknown error:', error);
        toast({
          title: "Произошла неизвестная ошибка",
          variant: "destructive"
        });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSkinImageUpload = async (file: File, skinId: string) => {
    if (!file) return;
    
    setUploadingImage(true);
    
    try {
      console.log('🎯 [SKIN_UPLOAD] Uploading skin image:', { skinId, fileName: file.name });
      
      await ensureBucketExists('case-images');
      
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `skin_${skinId}_${timestamp}_${randomId}.${fileExt}`;
      const filePath = `skin-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [SKIN_UPLOAD] Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(filePath);

      console.log('✅ [SKIN_UPLOAD] File uploaded, updating database:', publicUrl);

      const { error: updateError } = await supabase
        .from('skins')
        .update({ image_url: publicUrl })
        .eq('id', skinId);

      if (updateError) {
        console.error('❌ [SKIN_UPLOAD] Database update error:', updateError);
        throw updateError;
      }

      // МАКСИМАЛЬНО агрессивная инвалидация и обновление кэша
      console.log('🔄 [SKIN_UPLOAD] Aggressive cache invalidation...');
      await Promise.all([
        queryClient.removeQueries({ queryKey: ['case_skins', selectedCase] }),
        queryClient.removeQueries({ queryKey: ['all_skins'] }),
        queryClient.removeQueries({ queryKey: ['skins'] }),
        queryClient.removeQueries({ queryKey: ['shop-skins'] }),
        queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] }),
        queryClient.invalidateQueries({ queryKey: ['all_skins'] }),
        queryClient.invalidateQueries({ queryKey: ['skins'] }),
        queryClient.invalidateQueries({ queryKey: ['shop-skins'] })
      ]);
      
      // Принудительный рефетч с несколькими попытками
      setTimeout(async () => {
        console.log('🔄 [SKIN_UPLOAD] Force refetch attempt 1...');
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['case_skins', selectedCase] }),
          queryClient.refetchQueries({ queryKey: ['all_skins'] }),
          queryClient.refetchQueries({ queryKey: ['skins'] }),
          queryClient.refetchQueries({ queryKey: ['shop-skins'] })
        ]);
      }, 100);
      
      setTimeout(async () => {
        console.log('🔄 [SKIN_UPLOAD] Force refetch attempt 2...');
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['case_skins', selectedCase] }),
          queryClient.refetchQueries({ queryKey: ['all_skins'] }),
          queryClient.refetchQueries({ queryKey: ['skins'] }),
          queryClient.refetchQueries({ queryKey: ['shop-skins'] })
        ]);
      }, 500);
      
      console.log('✅ [SKIN_UPLOAD] Skin image updated successfully');
      toast({ 
        title: "Изображение скина обновлено",
        description: `Изображение успешно загружено и обновлено. URL: ${publicUrl}`
      });
    } catch (error: any) {
      console.error('❌ [SKIN_UPLOAD] Upload failed:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Админ-панель</h2>
      <AdminTableSelector activeTable={activeTable} onTableChange={setActiveTable} />

      {/* Спец.разделы */}
      {activeTable === 'cases' && (
        <CaseManagement
          tableData={activeTable === 'cases' ? (tableData as Case[]) : []}
          selectedCase={selectedCase}
          setSelectedCase={setSelectedCase}
          uploadingImage={uploadingImage}
          onSkinImageUpload={handleSkinImageUpload}
        />
      )}
      {activeTable === 'banners' && <BannerManagement />}
      {activeTable === 'users' && <UserManagement />}
      {activeTable === 'promo_codes' && <PromoCodeManagement />}
      {activeTable === 'suspicious_activities' && <SuspiciousActivityManagement />}
      {activeTable === 'faq_items' && <DatabaseImageCleanup />}
      
      {/* Универсальная таблица и форма добавления */}
      {['cases','skins','tasks','quiz_questions','coin_rewards','daily_rewards','faq_items'].includes(activeTable) && (
        <>
          <AddItemForm
            activeTable={activeTable}
            newItem={newItem}
            setNewItem={(item: Case | Skin | Task | Record<string, unknown>) => setNewItem(item)}
            onAdd={() => queryClient.invalidateQueries({ queryKey: [activeTable] })}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
            getImageRequirements={() => ''}
          />
          {activeTable === 'daily_rewards' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Ежедневные награды</h3>
                <Button onClick={() => { setShowRewardForm(true); setEditingReward(null); }}>Добавить награду</Button>
              </div>
              {showRewardForm && (
                <DailyRewardsAdminForm
                  initial={editingReward || {}}
                  onSave={handleSaveReward}
                  onCancel={handleCancelReward}
                  existingDays={dailyRewardDays}
                />
              )}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">День</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Тип</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Монеты</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Активна</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(Array.isArray(tableData) && activeTable === 'daily_rewards' && tableData.every(item => typeof item === 'object' && item !== null && 'day_number' in item && 'reward_type' in item && 'reward_coins' in item)
                      ? (tableData as DailyReward[])
                      : []).map((reward) => (
                      <tr key={reward.id}>
                        <td className="px-4 py-2">{reward.day_number}</td>
                        <td className="px-4 py-2">{reward.reward_type}</td>
                        <td className="px-4 py-2">{reward.reward_coins}</td>
                        <td className="px-4 py-2">{reward.is_active ? 'Да' : 'Нет'}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button size="sm" onClick={() => { setEditingReward(reward); setShowRewardForm(true); }}>Редактировать</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (window.confirm('Удалить награду?')) {
                              await supabase.from('daily_rewards').delete().eq('id', reward.id);
                              queryClient.invalidateQueries({ queryKey: ['daily_rewards'] });
                            }
                          }}>Удалить</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <AdminTable
              activeTable={activeTable}
              tableData={(tableData as Record<string, unknown>[]) || []}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: [activeTable] })}
              onDelete={() => queryClient.invalidateQueries({ queryKey: [activeTable] })}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              getImageRequirements={() => ''}
            />
          )}
        </>
      )}
      
      {/* Утилиты */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <UserDuplicatesCleaner />
        <DatabaseImageCleanup />
      </div>
    </div>
  );
};

export default AdminPanel;
