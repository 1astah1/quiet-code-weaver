
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Eye } from 'lucide-react';
import { enhancedValidation, SecurityMonitor } from '@/utils/securityEnhanced';

interface Case {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  cover_image_url: string | null;
  is_free: boolean;
  created_at: string;
}

const FixedCaseManagement = () => {
  const [newCase, setNewCase] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    cover_image_url: '',
    is_free: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ИСПРАВЛЕНО: Убрал order('random()') который вызывал ошибку
  const { data: cases, isLoading } = useQuery({
    queryKey: ['admin-cases'],
    queryFn: async () => {
      console.log('🔄 [ADMIN] Loading cases...');
      
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false }); // ИСПРАВЛЕНО: Использую правильную сортировку
      
      if (error) {
        console.error('❌ [ADMIN] Error loading cases:', error);
        throw error;
      }
      
      console.log('✅ [ADMIN] Cases loaded:', data?.length || 0);
      return data as Case[];
    }
  });

  const createCaseMutation = useMutation({
    mutationFn: async (caseData: typeof newCase) => {
      console.log('🔄 [ADMIN] Creating case:', caseData);
      
      // Валидация данных
      if (!caseData.name || caseData.name.length < 2 || caseData.name.length > 100) {
        throw new Error('Название кейса должно быть от 2 до 100 символов');
      }
      
      if (!enhancedValidation.coins(caseData.price)) {
        throw new Error('Некорректная цена кейса');
      }
      
      // Санитизация данных
      const sanitizedData = {
        name: enhancedValidation.sanitizeString(caseData.name),
        description: caseData.description ? enhancedValidation.sanitizeString(caseData.description) : null,
        price: Math.max(0, Math.min(1000000, Math.floor(caseData.price))),
        image_url: caseData.image_url ? enhancedValidation.sanitizeString(caseData.image_url) : null,
        cover_image_url: caseData.cover_image_url ? enhancedValidation.sanitizeString(caseData.cover_image_url) : null,
        is_free: Boolean(caseData.is_free)
      };
      
      const { data, error } = await supabase
        .from('cases')
        .insert([sanitizedData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ [ADMIN] Error creating case:', error);
        throw error;
      }
      
      console.log('✅ [ADMIN] Case created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      setNewCase({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        cover_image_url: '',
        is_free: false
      });
      toast({
        title: "Успех",
        description: "Кейс успешно создан",
      });
    },
    onError: (error: any) => {
      console.error('❌ [ADMIN] Case creation error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать кейс",
        variant: "destructive",
      });
    }
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      console.log('🔄 [ADMIN] Deleting case:', caseId);
      
      if (!enhancedValidation.uuid(caseId)) {
        throw new Error('Некорректный ID кейса');
      }
      
      // Проверяем, есть ли связанные записи
      const { data: relatedItems } = await supabase
        .from('case_skins')
        .select('id')
        .eq('case_id', caseId)
        .limit(1);
      
      if (relatedItems && relatedItems.length > 0) {
        throw new Error('Нельзя удалить кейс, который содержит скины. Сначала удалите все скины из кейса.');
      }
      
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);
      
      if (error) {
        console.error('❌ [ADMIN] Error deleting case:', error);
        throw error;
      }
      
      console.log('✅ [ADMIN] Case deleted:', caseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      toast({
        title: "Успех",
        description: "Кейс успешно удален",
      });
    },
    onError: (error: any) => {
      console.error('❌ [ADMIN] Case deletion error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить кейс",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Валидация и санитизация в реальном времени
    let sanitizedValue = value;
    
    if (typeof value === 'string' && field !== 'price') {
      sanitizedValue = enhancedValidation.sanitizeString(value);
      
      // Проверка на SQL инъекции
      if (!enhancedValidation.checkSqlInjection(value)) {
        toast({
          title: "Недопустимый ввод",
          description: "Обнаружены недопустимые символы",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (field === 'price') {
      const numValue = Number(value);
      if (!enhancedValidation.coins(numValue)) {
        sanitizedValue = Math.max(0, Math.min(1000000, Math.floor(numValue)));
      } else {
        sanitizedValue = numValue;
      }
    }
    
    setNewCase(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Дополнительная валидация перед отправкой
      if (!newCase.name.trim()) {
        throw new Error('Название кейса обязательно');
      }
      
      await createCaseMutation.mutateAsync(newCase);
    } catch (error) {
      console.error('❌ [ADMIN] Form submission error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Создать новый кейс
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Название кейса *</Label>
                <Input
                  id="name"
                  value={newCase.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Введите название кейса"
                  maxLength={100}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Цена</Label>
                <Input
                  id="price"
                  type="number"
                  value={newCase.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="1000000"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={newCase.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Введите описание кейса"
                maxLength={500}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_url">URL изображения</Label>
                <Input
                  id="image_url"
                  value={newCase.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://..."
                  maxLength={500}
                />
              </div>
              
              <div>
                <Label htmlFor="cover_image_url">URL обложки</Label>
                <Input
                  id="cover_image_url"
                  value={newCase.cover_image_url}
                  onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                  placeholder="https://..."
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_free"
                checked={newCase.is_free}
                onChange={(e) => handleInputChange('is_free', e.target.checked)}
              />
              <Label htmlFor="is_free">Бесплатный кейс</Label>
            </div>
            
            <Button 
              type="submit" 
              disabled={createCaseMutation.isPending}
              className="w-full"
            >
              {createCaseMutation.isPending ? 'Создание...' : 'Создать кейс'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Существующие кейсы ({cases?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cases?.map((caseItem) => (
              <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{caseItem.name}</h3>
                  <p className="text-sm text-gray-600">
                    Цена: {caseItem.price} монет | 
                    Тип: {caseItem.is_free ? 'Бесплатный' : 'Платный'}
                  </p>
                  {caseItem.description && (
                    <p className="text-sm text-gray-500 mt-1">{caseItem.description}</p>
                  )}
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCaseMutation.mutate(caseItem.id)}
                  disabled={deleteCaseMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {!cases?.length && (
              <div className="text-center py-8 text-gray-500">
                Кейсы не найдены
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedCaseManagement;
