
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

  const handleSave = (bannerData: Partial<Banner>) => {
    console.log('💾 [BANNER_SAVE] Saving banner data:', bannerData);
    
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
      
      createBannerMutation.mutate(insertData);
    } else if (editingBanner) {
      updateBannerMutation.mutate({ ...editingBanner, ...bannerData });
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
  };

  const handleDelete = (id: string) => {
    deleteBannerMutation.mutate(id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingBanner(null);
  };

  const startCreating = () => {
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
    startCreating
  };
};
