import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminTableSelector from "./admin/AdminTableSelector";
import CaseManagement from "./admin/CaseManagement";
import BannerManagement from "./admin/BannerManagement";
import AddItemForm from "./admin/AddItemForm";
import AdminTable from "./admin/AdminTable";
import UserDuplicatesCleaner from "./admin/UserDuplicatesCleaner";
import UserManagement from "./admin/UserManagement";
import PromoCodeManagement from "./admin/PromoCodeManagement";
import SuspiciousActivityManagement from "./admin/SuspiciousActivityManagement";
import { TableName } from "@/types/admin";

const AdminPanel = () => {
  const [activeTable, setActiveTable] = useState<TableName>("cases");
  const [newItem, setNewItem] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tableData, isLoading } = useQuery({
    queryKey: [activeTable],
    queryFn: async () => {
      if (activeTable === 'users'|| activeTable === 'suspicious_activities') {
        return [];
      }
      
      const { data, error } = await supabase
        .from(activeTable as any)
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: activeTable !== 'users' && activeTable !== 'suspicious_activities'
  });

  const getBucketAndFolder = (table: string, fieldName: string) => {
    console.log('🗂️ [GET_BUCKET] Determining bucket for:', { table, fieldName });
    
    if (table === 'banners') {
      return { bucketName: 'banner-images', folder: 'banners' };
    }
    
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
      
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error(`Bucket ${bucketName} не существует. Обратитесь к администратору.`);
      }
      
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        throw new Error(`Нет прав доступа к bucket ${bucketName}. Убедитесь, что у вас есть админские права.`);
      }
      
      throw error;
      
    } catch (error: any) {
      console.error(`❌ [BUCKET_ERROR] Error with bucket ${bucketName}:`, error);
      throw new Error(`Ошибка с bucket ${bucketName}: ${error.message}`);
    }
  };

  const invalidateRelatedQueries = async (table: string, itemId?: string) => {
    console.log('🔄 [CACHE_INVALIDATION] Starting for:', { table, itemId });
    
    const invalidationPromises = [];
    
    // Основная таблица
    invalidationPromises.push(queryClient.invalidateQueries({ queryKey: [table] }));
    
    // Специфичные инвалидации
    if (table === 'skins') {
      invalidationPromises.push(
        queryClient.invalidateQueries({ queryKey: ['all_skins'] }),
        queryClient.invalidateQueries({ queryKey: ['case_skins'] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] })
      );
      
      if (selectedCase) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] })
        );
      }
    }
    
    if (table === 'banners') {
      invalidationPromises.push(
        queryClient.invalidateQueries({ queryKey: ['banners'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      );
    }
    
    if (table === 'cases') {
      invalidationPromises.push(
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['case_skins'] })
      );
    }
    
    try {
      await Promise.all(invalidationPromises);
      console.log('✅ [CACHE_INVALIDATION] All queries invalidated successfully');
    } catch (error) {
      console.error('❌ [CACHE_INVALIDATION] Error during invalidation:', error);
    }
  };

  const handleImageUpload = async (file: File, isEdit = false, itemId?: string, fieldName = 'image_url') => {
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

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      const { bucketName, folder } = getBucketAndFolder(activeTable, fieldName);
      await ensureBucketExists(bucketName);

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${activeTable}_${timestamp}_${randomId}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('📁 [IMAGE_UPLOAD] Upload details:', { bucketName, filePath, folder });

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [IMAGE_UPLOAD] Upload error:', uploadError);
        
        let errorMessage = uploadError.message;
        
        if (uploadError.message.includes('RLS') || uploadError.message.includes('policy')) {
          errorMessage = 'Нет прав для загрузки файлов. Убедитесь, что у вас есть админские права.';
        }
        
        throw new Error(`Ошибка загрузки: ${errorMessage}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('✅ [IMAGE_UPLOAD] Upload successful:', publicUrl);

      if (isEdit && itemId) {
        console.log('🔄 [IMAGE_UPLOAD] Updating database:', { itemId, fieldName, publicUrl });
        
        const { error: updateError } = await supabase
          .from(activeTable as any)
          .update({ [fieldName]: publicUrl })
          .eq('id', itemId);
          
        if (updateError) {
          console.error('❌ [IMAGE_UPLOAD] Database update error:', updateError);
          throw new Error(`Ошибка обновления БД: ${updateError.message}`);
        }
        
        console.log('✅ [IMAGE_UPLOAD] Database updated successfully');
        
        // Принудительное обновление кэша
        await invalidateRelatedQueries(activeTable, itemId);
        
        // Принудительное обновление данных с небольшой задержкой
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [activeTable] }),
            queryClient.refetchQueries({ queryKey: ['all_skins'] }),
            queryClient.refetchQueries({ queryKey: ['case_skins'] })
          ]);
        }, 1000);
        
      } else {
        setNewItem({ ...newItem, [fieldName]: publicUrl });
      }

      toast({ 
        title: "Изображение загружено успешно",
        description: `Файл загружен в ${bucketName}/${folder}`
      });
      
      return publicUrl;
    } catch (error: any) {
      console.error('❌ [IMAGE_UPLOAD] Upload failed:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
      throw error;
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
      const fileName = `skin_${skinId}_${Date.now()}.${fileExt}`;
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

      console.log('🔄 [SKIN_UPLOAD] Updating skin in database:', { skinId, publicUrl });

      const { error: updateError } = await supabase
        .from('skins')
        .update({ image_url: publicUrl })
        .eq('id', skinId);

      if (updateError) {
        console.error('❌ [SKIN_UPLOAD] Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ [SKIN_UPLOAD] Database updated successfully');

      await invalidateRelatedQueries('skins', skinId);
      
      setTimeout(async () => {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['skins'] }),
          queryClient.refetchQueries({ queryKey: ['all_skins'] }),
          queryClient.refetchQueries({ queryKey: ['case_skins'] })
        ]);
        
        if (selectedCase) {
          await queryClient.refetchQueries({ queryKey: ['case_skins', selectedCase] });
        }
      }, 1000);
      
      console.log('✅ [SKIN_UPLOAD] Skin image updated successfully');
      toast({ title: "Изображение скина обновлено" });
    } catch (error: any) {
      console.error('❌ [SKIN_UPLOAD] Failed:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message || "Не удалось загрузить изображение скина",
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    try {
      console.log('➕ [ADD_ITEM] Adding new item:', newItem);
      const { error } = await supabase
        .from(activeTable as any)
        .insert([newItem]);
      
      if (error) {
        console.error('❌ [ADD_ITEM] Add error:', error);
        throw new Error(`Ошибка добавления: ${error.message}`);
      }
      
      setNewItem({});
      await invalidateRelatedQueries(activeTable);
      
      toast({ title: "Успешно добавлено" });
    } catch (error: any) {
      console.error('❌ [ADD_ITEM] Add error:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось добавить элемент",
        variant: "destructive" 
      });
    }
  };

  const handleUpdate = async (id: string, updatedData: any) => {
    try {
      console.log('✏️ [UPDATE_ITEM] Updating item:', { id, updatedData });
      const { error } = await supabase
        .from(activeTable as any)
        .update(updatedData)
        .eq('id', id);
      
      if (error) {
        console.error('❌ [UPDATE_ITEM] Update error:', error);
        throw error;
      }
      
      await invalidateRelatedQueries(activeTable, id);
      
      toast({ title: "Успешно обновлено" });
    } catch (error: any) {
      console.error('❌ [UPDATE_ITEM] Update error:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось обновить элемент",
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('🗑️ [DELETE_ITEM] Deleting item:', { id, table: activeTable });
      const { error } = await supabase
        .from(activeTable as any)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ [DELETE_ITEM] Delete error:', error);
        throw error;
      }
      
      await invalidateRelatedQueries(activeTable, id);
      
      toast({ title: "Успешно удалено" });
    } catch (error: any) {
      console.error('❌ [DELETE_ITEM] Delete error:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось удалить элемент",
        variant: "destructive" 
      });
    }
  };

  const getImageRequirements = (fieldName: string) => {
    if (fieldName === 'cover_image_url') {
      return "Рекомендуемый размер: 800x600px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    if (fieldName === 'image_url' && activeTable === 'skins') {
      return "Рекомендуемый размер: 512x512px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    if (fieldName === 'image_url' && activeTable === 'banners') {
      return "Рекомендуемый размер: 800x400px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    if (fieldName === 'image_url' && activeTable === 'quiz_questions') {
      return "Рекомендуемый размер: 600x400px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    if (fieldName === 'image_url' && activeTable === 'tasks') {
      return "Рекомендуемый размер: 400x300px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    return "Форматы: JPG, PNG, WebP, максимум 5MB";
  };

  if (isLoading) {
    return <div className="text-white">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white mb-6">Админ панель</h1>
      
      <AdminTableSelector 
        activeTable={activeTable} 
        onTableChange={setActiveTable} 
      />

      <div className="space-y-4">
        {activeTable === 'users' && (
          <>
            <UserManagement />
            <UserDuplicatesCleaner />
          </>
        )}

        {activeTable === 'banners' && (
          <BannerManagement />
        )}

        {activeTable === 'cases' && (
          <CaseManagement
            tableData={tableData || []}
            selectedCase={selectedCase}
            setSelectedCase={setSelectedCase}
            uploadingImage={uploadingImage}
            onSkinImageUpload={handleSkinImageUpload}
          />
        )}

        {activeTable === 'promo_codes' && (
          <PromoCodeManagement />
        )}

        {activeTable === 'suspicious_activities' && (
          <SuspiciousActivityManagement />
        )}

        {activeTable !== 'cases' && activeTable !== 'banners' && activeTable !== 'users' && activeTable !== 'promo_codes' && activeTable !== 'suspicious_activities' && (
          <>
            <AddItemForm
              activeTable={activeTable}
              newItem={newItem}
              setNewItem={setNewItem}
              onAdd={handleAdd}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              getImageRequirements={getImageRequirements}
            />

            <AdminTable
              activeTable={activeTable}
              tableData={tableData || []}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              getImageRequirements={getImageRequirements}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
