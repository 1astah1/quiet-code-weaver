
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, Upload, Image } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import type { Database } from "@/integrations/supabase/types";

type Banner = Database['public']['Tables']['banners']['Row'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];
type BannerUpdate = Database['public']['Tables']['banners']['Update'];

const BannerManagement = () => {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const createBannerMutation = useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setIsCreating(false);
      toast({ title: "Баннер создан!" });
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...banner }: Banner) => {
      const { error } = await supabase
        .from('banners')
        .update(banner)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setEditingBanner(null);
      toast({ title: "Баннер обновлен!" });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({ title: "Баннер удален!" });
    }
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!file) throw new Error('Файл не выбран');
    
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
      const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(filePath);

      toast({ title: "Изображение загружено успешно" });
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
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

  const handleSave = (bannerData: BannerInsert) => {
    if (isCreating) {
      createBannerMutation.mutate(bannerData);
    } else if (editingBanner) {
      updateBannerMutation.mutate({ ...editingBanner, ...bannerData });
    }
  };

  if (isLoading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Управление баннерами</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить баннер</span>
        </button>
      </div>

      {(isCreating || editingBanner) && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setEditingBanner(null);
          }}
          onImageUpload={handleImageUpload}
          uploadingImage={uploadingImage}
        />
      )}

      <div className="grid gap-4">
        {banners?.map((banner) => (
          <div key={banner.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  {/* Banner Image Preview */}
                  <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {banner.image_url ? (
                      <OptimizedImage
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center bg-gray-600">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-600">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Banner Details */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{banner.title}</h3>
                    <p className="text-gray-400 text-sm">{banner.description}</p>
                    <p className="text-gray-500 text-xs">Кнопка: {banner.button_text}</p>
                    <p className="text-gray-500 text-xs">Действие: {banner.button_action}</p>
                    <p className="text-gray-500 text-xs">Порядок: {banner.order_index}</p>
                    <p className={`text-xs ${banner.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {banner.is_active ? 'Активен' : 'Неактивен'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingBanner(banner)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteBannerMutation.mutate(banner.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BannerFormProps {
  banner: Banner | null;
  onSave: (data: BannerInsert) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
  uploadingImage: boolean;
}

const BannerForm = ({ banner, onSave, onCancel, onImageUpload, uploadingImage }: BannerFormProps) => {
  const [formData, setFormData] = useState({
    title: banner?.title || '',
    description: banner?.description || '',
    image_url: banner?.image_url || '',
    button_text: banner?.button_text || '',
    button_action: banner?.button_action || '',
    is_active: banner?.is_active ?? true,
    order_index: banner?.order_index || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await onImageUpload(file);
        setFormData({ ...formData, image_url: imageUrl });
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Заголовок</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-white text-sm font-medium mb-2">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
            rows={3}
          />
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Изображение баннера</label>
          
          {/* Current Image Preview */}
          {formData.image_url && (
            <div className="mb-3">
              <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden">
                <OptimizedImage
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-600">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  }
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center space-x-3">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>{uploadingImage ? 'Загрузка...' : 'Загрузить изображение'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
            
            {!formData.image_url && (
              <div>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Или введите URL изображения"
                  className="bg-gray-700 text-white rounded-lg px-3 py-2"
                />
              </div>
            )}
          </div>
          
          <p className="text-gray-400 text-xs mt-1">
            Рекомендуемый размер: 800x400px, форматы: JPG, PNG, WebP, максимум 5MB
          </p>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Текст кнопки</label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Действие кнопки</label>
          <select
            value={formData.button_action}
            onChange={(e) => setFormData({ ...formData, button_action: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
          >
            <option value="">Выберите действие</option>
            <option value="shop">Перейти в магазин</option>
            <option value="cases">Перейти к кейсам</option>
            <option value="tasks">Перейти к заданиям</option>
            <option value="quiz">Перейти к викторине</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Порядок отображения</label>
          <input
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded"
          />
          <label className="text-white text-sm">Активен</label>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={uploadingImage}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Отмена</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BannerManagement;
