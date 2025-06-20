
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Banner = Database['public']['Tables']['banners']['Row'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];
type BannerUpdate = Database['public']['Tables']['banners']['Update'];

const BannerManagement = () => {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
        />
      )}

      <div className="grid gap-4">
        {banners?.map((banner) => (
          <div key={banner.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold">{banner.title}</h3>
                <p className="text-gray-400 text-sm">{banner.description}</p>
                <p className="text-gray-500 text-xs">Кнопка: {banner.button_text}</p>
                <p className="text-gray-500 text-xs">Действие: {banner.button_action}</p>
                <p className="text-gray-500 text-xs">Порядок: {banner.order_index}</p>
                <p className={`text-xs ${banner.is_active ? 'text-green-400' : 'text-red-400'}`}>
                  {banner.is_active ? 'Активен' : 'Неактивен'}
                </p>
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
}

const BannerForm = ({ banner, onSave, onCancel }: BannerFormProps) => {
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

        <div>
          <label className="block text-white text-sm font-medium mb-2">URL изображения</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
          />
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
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
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
