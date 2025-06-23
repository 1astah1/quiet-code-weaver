
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Banner } from "@/utils/supabaseTypes";

type BannerInsert = {
  title: string;
  description: string;
  button_text: string;
  button_action: string;
  image_url?: string;
  is_active?: boolean;
  order_index?: number;
};

export const useBannerManagement = () => {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      console.log('🔍 [BANNER_QUERY] Fetching banners...');
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index');
      if (error) {
        console.error('❌ [BANNER_QUERY] Error fetching banners:', error);
        throw error;
      }
      console.log('✅ [BANNER_QUERY] Banners fetched successfully:', data?.length);
      return data;
    }
  });

  const createBannerMutation = useMutation({
    mutationFn: async (banner: BannerInsert) => {
      console.log('📝 [BANNER_CREATE] Starting banner creation:', banner);
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single();
      if (error) {
        console.error('❌ [BANNER_CREATE] Error creating banner:', error);
        throw error;
      }
      console.log('✅ [BANNER_CREATE] Banner created successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🎉 [BANNER_CREATE] Success callback triggered');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setIsCreating(false);
      toast({ title: "Баннер создан!" });
    },
    onError: (error: any) => {
      console.error('❌ [BANNER_CREATE] Error callback triggered:', error);
      setIsCreating(false);
      toast({ 
        title: "Ошибка создания баннера", 
        description: error?.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...banner }: Banner) => {
      console.log('📝 [BANNER_UPDATE] Starting banner update:', { id, ...banner });
      const { error } = await supabase
        .from('banners')
        .update(banner)
        .eq('id', id);
      if (error) {
        console.error('❌ [BANNER_UPDATE] Error updating banner:', error);
        throw error;
      }
      console.log('✅ [BANNER_UPDATE] Banner updated successfully');
    },
    onSuccess: () => {
      console.log('🎉 [BANNER_UPDATE] Success callback triggered');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setEditingBanner(null);
      toast({ title: "Баннер обновлен!" });
    },
    onError: (error: any) => {
      console.error('❌ [BANNER_UPDATE] Error callback triggered:', error);
      setEditingBanner(null);
      toast({ 
        title: "Ошибка обновления баннера", 
        description: error?.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ [BANNER_DELETE] Starting banner deletion:', id);
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('❌ [BANNER_DELETE] Error deleting banner:', error);
        throw error;
      }
      console.log('✅ [BANNER_DELETE] Banner deleted successfully');
    },
    onSuccess: () => {
      console.log('🎉 [BANNER_DELETE] Success callback triggered');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({ title: "Баннер удален!" });
    },
    onError: (error: any) => {
      console.error('❌ [BANNER_DELETE] Error callback triggered:', error);
      toast({ 
        title: "Ошибка удаления баннера", 
        description: error?.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    }
  });

  const handleSave = async (bannerData: Partial<Banner>) => {
    console.log('💾 [BANNER_SAVE] Saving banner data:', bannerData);
    
    try {
      if (isCreating) {
        if (!bannerData.title || !bannerData.description || !bannerData.button_text || !bannerData.button_action) {
          toast({ 
            title: "Ошибка валидации", 
            description: "Заполните все обязательные поля",
            variant: "destructive" 
          });
          return;
        }
        
        const insertData: BannerInsert = {
          title: bannerData.title,
          description: bannerData.description,
          button_text: bannerData.button_text,
          button_action: bannerData.button_action,
          image_url: bannerData.image_url,
          is_active: bannerData.is_active,
          order_index: bannerData.order_index
        };
        
        await createBannerMutation.mutateAsync(insertData);
      } else if (editingBanner) {
        await updateBannerMutation.mutateAsync({ ...editingBanner, ...bannerData });
      }
    } catch (error) {
      console.error('❌ [BANNER_SAVE] Save operation failed:', error);
    }
  };

  const handleEdit = (banner: Banner) => {
    console.log('✏️ [BANNER_EDIT] Starting edit for banner:', banner.id);
    setEditingBanner(banner);
  };

  const handleDelete = (id: string) => {
    console.log('🗑️ [BANNER_DELETE] Starting delete for banner:', id);
    deleteBannerMutation.mutate(id);
  };

  const handleCancel = () => {
    console.log('❌ [BANNER_CANCEL] Cancelling banner operation');
    setIsCreating(false);
    setEditingBanner(null);
  };

  const startCreating = () => {
    console.log('➕ [BANNER_CREATE] Starting banner creation');
    setIsCreating(true);
  };

  return {
    banners,
    isLoading,
    editingBanner,
    isCreating,
    handleSave,
    handleEdit,
    handleDelete,
    handleCancel,
    startCreating,
    isSaving: createBannerMutation.isPending || updateBannerMutation.isPending
  };
};
