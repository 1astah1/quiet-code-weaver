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
      // Для пользователей используем отдельный запрос в UserManagement
      if (activeTable === 'users') {
        return [];
      }
      
      const { data, error } = await supabase
        .from(activeTable)
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleImageUpload = async (file: File, isEdit = false, itemId?: string, fieldName = 'image_url') => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB');
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Выбираем папку в зависимости от типа таблицы
      let folder = 'case-covers';
      if (activeTable === 'skins') folder = 'skin-images';
      if (activeTable === 'quiz_questions') folder = 'quiz-images';
      if (activeTable === 'tasks') folder = 'task-images';
      if (fieldName === 'cover_image_url') folder = 'case-covers';
      if (fieldName === 'image_url' && activeTable === 'skins') folder = 'skin-images';
      if (fieldName === 'image_url' && activeTable === 'tasks') folder = 'task-images';
      
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading file:', filePath);

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

      console.log('Public URL:', publicUrl);

      if (isEdit && itemId) {
        const { error } = await supabase
          .from(activeTable)
          .update({ [fieldName]: publicUrl })
          .eq('id', itemId);
        if (error) {
          console.error('Database update error:', error);
          throw new Error(`Ошибка обновления БД: ${error.message}`);
        }
        queryClient.invalidateQueries({ queryKey: [activeTable] });
        if (activeTable === 'skins') {
          queryClient.invalidateQueries({ queryKey: ['all_skins'] });
          queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
        }
      } else {
        setNewItem({ ...newItem, [fieldName]: publicUrl });
      }

      toast({ title: "Изображение загружено успешно" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSkinImageUpload = async (file: File, skinId: string) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `skin_${skinId}_${Date.now()}.${fileExt}`;
      const filePath = `skin-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('skins')
        .update({ image_url: publicUrl })
        .eq('id', skinId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      queryClient.invalidateQueries({ queryKey: ['all_skins'] });
      queryClient.invalidateQueries({ queryKey: ['skins'] });
      toast({ title: "Изображение скина обновлено" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    try {
      console.log('Adding new item:', newItem);
      const { error } = await supabase
        .from(activeTable)
        .insert([newItem]);
      
      if (error) {
        console.error('Add error:', error);
        throw new Error(`Ошибка добавления: ${error.message}`);
      }
      
      setNewItem({});
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно добавлено" });
    } catch (error: any) {
      console.error('Add error:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось добавить элемент",
        variant: "destructive" 
      });
    }
  };

  const handleUpdate = async (id: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .update(updatedData)
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно обновлено" });
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно удалено" });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const getImageRequirements = (fieldName: string) => {
    if (fieldName === 'cover_image_url') {
      return "Рекомендуемый размер: 800x600px, форматы: JPG, PNG, WebP, максимум 5MB";
    }
    if (fieldName === 'image_url' && activeTable === 'skins') {
      return "Рекомендуемый размер: 512x512px, форматы: JPG, PNG, WebP, максимум 5MB";
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

        {activeTable !== 'cases' && activeTable !== 'banners' && activeTable !== 'users' && activeTable !== 'promo_codes' && (
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
