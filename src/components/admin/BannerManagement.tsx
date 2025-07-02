import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { safeArrayLength, safeArrayMap } from '@/utils/arrayUtils';

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  button_text: string;
  button_action: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
}

interface BannerForm {
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_action: string;
  is_active: boolean;
  order_index: number;
}

const defaultForm: BannerForm = {
  title: '',
  description: '',
  image_url: '',
  button_text: '',
  button_action: '',
  is_active: true,
  order_index: 0,
};

const BannerManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query banners
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ['admin_banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Banner[];
    }
  });

  // Create/Update banner mutation
  const saveBannerMutation = useMutation({
    mutationFn: async (bannerData: BannerForm) => {
      if (editingId) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_banners'] });
      setIsEditing(false);
      setEditingId(null);
      setForm(defaultForm);
      toast({
        title: editingId ? 'Баннер обновлен' : 'Баннер создан',
        description: 'Изменения сохранены успешно'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_banners'] });
      toast({
        title: 'Баннер удален',
        description: 'Баннер успешно удален'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка удаления',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleEdit = (banner: Banner) => {
    setForm({
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url || '',
      button_text: banner.button_text,
      button_action: banner.button_action,
      is_active: banner.is_active ?? true,
      order_index: banner.order_index ?? 0,
    });
    setEditingId(banner.id);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.button_text || !form.button_action) {
      toast({
        title: 'Ошибка валидации',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }
    
    saveBannerMutation.mutate(form);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот баннер?')) {
      deleteBannerMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Управление баннерами
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить баннер
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingId ? 'Редактировать баннер' : 'Создать баннер'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Заголовок баннера"
                  />
                </div>
                <div>
                  <Label htmlFor="button_text">Текст кнопки *</Label>
                  <Input
                    id="button_text"
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    placeholder="Нажмите здесь"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Описание баннера"
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">URL изображения</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="button_action">Действие кнопки *</Label>
                  <Input
                    id="button_action"
                    value={form.button_action}
                    onChange={(e) => setForm({ ...form, button_action: e.target.value })}
                    placeholder="/cases или https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="order_index">Порядок отображения</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Активный</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSubmit} disabled={saveBannerMutation.isPending}>
                  {saveBannerMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Загрузка баннеров...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Ошибка загрузки баннеров
            </div>
          ) : safeArrayLength(banners) > 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Заголовок</TableHead>
                    <TableHead className="text-gray-300">Описание</TableHead>
                    <TableHead className="text-gray-300">Кнопка</TableHead>
                    <TableHead className="text-gray-300">Статус</TableHead>
                    <TableHead className="text-gray-300">Порядок</TableHead>
                    <TableHead className="text-gray-300">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeArrayMap(banners, (banner: Banner) => (
                    <TableRow key={banner.id}>
                      <TableCell className="text-gray-300 font-medium">
                        {banner.title}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {banner.description}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {banner.button_text}
                      </TableCell>
                      <TableCell>
                        <Badge variant={banner.is_active ? "default" : "secondary"}>
                          {banner.is_active ? 'Активный' : 'Неактивный'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {banner.order_index ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEdit(banner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(banner.id)}
                            disabled={deleteBannerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Баннеры не найдены</h3>
              <p className="text-gray-500">Создайте первый баннер для отображения на главной странице</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerManagement;
