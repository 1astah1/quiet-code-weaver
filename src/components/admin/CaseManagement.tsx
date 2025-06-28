import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Upload, Settings, Users, Plus, Package, DollarSign, Calendar, Heart, Tag, Clock, Image } from "lucide-react";
import { format } from "date-fns";
import CaseSkinManagement from "./CaseSkinManagement";
import CaseJSONImporter from "./CaseJSONImporter";
import type { Case } from "@/utils/supabaseTypes";

interface CaseManagementProps {
  tableData: Case[];
  selectedCase: string | null;
  setSelectedCase: (caseId: string | null) => void;
  uploadingImage: boolean;
  onSkinImageUpload: (file: File, skinId: string) => Promise<void>;
}

const CaseManagement = ({
  tableData,
  selectedCase,
  setSelectedCase,
  uploadingImage,
  onSkinImageUpload
}: CaseManagementProps) => {
  const [showImporter, setShowImporter] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caseStats } = useQuery({
    queryKey: ['case_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          name,
          price,
          case_skins(count)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const handleImageUpload = async (file: File, caseId: string, fieldName: 'image_url' | 'cover_image_url') => {
    console.log('🖼️ [CASE_MANAGEMENT] Uploading case image:', { caseId, fieldName, fileName: file.name });
    
    try {
      const bucketName = 'case-images';
      const folder = fieldName === 'cover_image_url' ? 'case-covers' : 'case-images';
      
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `case_${caseId}_${fieldName}_${timestamp}_${randomId}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [CASE_MANAGEMENT] Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('✅ [CASE_MANAGEMENT] File uploaded, updating database:', publicUrl);

      const { error: updateError } = await supabase
        .from('cases')
        .update({ [fieldName]: publicUrl })
        .eq('id', caseId);

      if (updateError) {
        console.error('❌ [CASE_MANAGEMENT] Database update error:', updateError);
        throw updateError;
      }

      // Агрессивная инвалидация кэша
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['case_stats'] }),
        queryClient.refetchQueries({ queryKey: ['cases'] })
      ]);

      console.log('✅ [CASE_MANAGEMENT] Case image updated successfully');
      toast({ 
        title: "Изображение кейса обновлено",
        description: `Изображение успешно загружено. URL: ${publicUrl}`
      });
    } catch (error: any) {
      console.error('❌ [CASE_MANAGEMENT] Upload failed:', error);
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message || "Неизвестная ошибка",
        variant: "destructive" 
      });
    }
  };

  const handleFreeCaseOpen = async (caseId: string) => {
    console.log('🆓 [CASE_MANAGEMENT] Opening free case:', caseId);
    try {
      const caseToUpdate = tableData.find(c => c.id === caseId);
      if (!caseToUpdate) {
        throw new Error('Кейс не найден');
      }
      
      const { error } = await supabase
        .from('cases')
        .update({ 
          last_free_open: new Date().toISOString(),
          is_free: true
        })
        .eq('id', caseId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Бесплатное открытие активировано" });
    } catch (error: any) {
      console.error('❌ [CASE_MANAGEMENT] Free case open failed:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const handleLikeCase = async (caseId: string) => {
    try {
      const caseToUpdate = tableData.find(c => c.id === caseId);
      if (!caseToUpdate) return;
      
      const newLikesCount = (caseToUpdate.likes_count || 0) + 1;
      
      const { error } = await supabase
        .from('cases')
        .update({ likes_count: newLikesCount })
        .eq('id', caseId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Лайк добавлен!" });
    } catch (error: any) {
      console.error('❌ [CASE_MANAGEMENT] Like failed:', error);
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  if (selectedCase) {
    const selectedCaseData = tableData.find(c => c.id === selectedCase);
    return (
      <CaseSkinManagement
        caseId={selectedCase}
        caseName={selectedCaseData?.name || 'Неизвестный кейс'}
        onClose={() => setSelectedCase(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки управления */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Управление кейсами</h3>
          <p className="text-gray-400">Всего кейсов: {tableData.length}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowImporter(!showImporter)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showImporter ? 'Скрыть импорт' : 'Импорт JSON'}
          </Button>
        </div>
      </div>

      {/* JSON Импортер */}
      {showImporter && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Импорт кейсов из JSON</CardTitle>
            <CardDescription className="text-gray-400">
              Загрузите JSON файл для массового создания кейсов и скинов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CaseJSONImporter />
          </CardContent>
        </Card>
      )}

      {/* Сетка кейсов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tableData.map((caseItem) => (
          <Card key={caseItem.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg font-semibold line-clamp-2">
                    {caseItem.name}
                  </CardTitle>
                  {caseItem.description && (
                    <CardDescription className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {caseItem.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {caseItem.is_free && (
                    <Badge variant="secondary" className="bg-green-600 text-white">
                      Бесплатный
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Изображение кейса */}
              <div className="space-y-3">
                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative group">
                  {caseItem.image_url ? (
                    <img 
                      src={caseItem.image_url} 
                      alt={caseItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Загрузить
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, caseItem.id, 'image_url');
                          }
                        }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="aspect-[3/1] bg-gray-700 rounded-lg overflow-hidden relative group">
                  {caseItem.cover_image_url ? (
                    <img 
                      src={caseItem.cover_image_url} 
                      alt={`${caseItem.name} Cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Image className="w-6 h-6" />
                      <span className="ml-2 text-sm">Cover</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Cover
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, caseItem.id, 'cover_image_url');
                          }
                        }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Статистики кейса */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-green-400">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatPrice(caseItem.price)} монет
                </div>
                <div className="flex items-center text-red-400">
                  <Heart className="w-4 h-4 mr-1" />
                  {(caseItem.likes_count || 0)} лайков
                </div>
                <div className="flex items-center text-blue-400">
                  <Package className="w-4 h-4 mr-1" />
                  ID: {caseItem.id.substring(0, 8)}...
                </div>
                <div className="flex items-center text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {caseItem.created_at ? format(new Date(caseItem.created_at), 'dd.MM.yy') : '—'}
                </div>
              </div>

              {/* Последнее бесплатное открытие */}
              {caseItem.last_free_open && (
                <div className="flex items-center text-yellow-400 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  Бесплатно: {format(new Date(caseItem.last_free_open), 'dd.MM.yyyy HH:mm')}
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedCase(caseItem.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Скины
                </Button>
                
                <Button
                  onClick={() => handleFreeCaseOpen(caseItem.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Tag className="w-4 h-4 mr-1" />
                  Бесплатно
                </Button>
                
                <Button
                  onClick={() => handleLikeCase(caseItem.id)}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tableData.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Кейсы не найдены</h3>
          <p className="text-gray-500">Создайте первый кейс или импортируйте из JSON</p>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
