import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Skin } from "@/utils/supabaseTypes";

const DatabaseImageCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{ cleaned: number; skinsAffected: string[] } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем все скины с их изображениями
  const { data: skins, isLoading } = useQuery<Skin[]>({
    queryKey: ['skins_cleanup_check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skins')
        .select('id, name, image_url');
      if (error) throw error;
      return (data || []) as Skin[];
    }
  });

  // Анализируем проблемные изображения
  const problematicSkins = skins?.filter(skin => 
    skin.image_url && (
      skin.image_url.includes('/lovable-uploads/') ||
      skin.image_url.includes('./lovable-uploads/') ||
      skin.image_url.startsWith('lovable-uploads/')
    )
  ) || [];

  const validSkins = skins?.filter(skin => 
    skin.image_url && 
    !skin.image_url.includes('lovable-uploads/') &&
    (skin.image_url.startsWith('http') || skin.image_url.startsWith('https'))
  ) || [];

  const nullImageSkins = skins?.filter(skin => !skin.image_url) || [];

  const handleCleanupInvalidUrls = async () => {
    if (!Array.isArray(problematicSkins) || problematicSkins.length === 0) {
      toast({ title: "Нет проблемных изображений для очистки" });
      return;
    }

    setIsCleaningUp(true);
    
    try {
      console.log('🧹 [CLEANUP] Starting cleanup of invalid image URLs:', Array.isArray(problematicSkins) ? problematicSkins.length : 0);
      
      // Обнуляем все проблемные image_url
      const { error } = await supabase
        .from('skins')
        .update({ image_url: null })
        .in('id', problematicSkins.map(skin => skin.id));

      if (error) throw error;

      // Инвалидируем все связанные кэши
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['skins'] }),
        queryClient.invalidateQueries({ queryKey: ['all_skins'] }),
        queryClient.invalidateQueries({ queryKey: ['skins_cleanup_check'] }),
        queryClient.invalidateQueries({ queryKey: ['case_skins'] })
      ]);

      setCleanupResults({
        cleaned: Array.isArray(problematicSkins) ? problematicSkins.length : 0,
        skinsAffected: problematicSkins.map(s => s.name)
      });

      toast({ 
        title: "Очистка завершена", 
        description: `Очищено ${Array.isArray(problematicSkins) ? problematicSkins.length : 0} проблемных изображений`
      });

      console.log('✅ [CLEANUP] Cleanup completed successfully');
    } catch (error: any) {
      console.error('❌ [CLEANUP] Cleanup failed:', error);
      toast({ 
        title: "Ошибка очистки", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (isLoading) {
    return <div className="text-white">Загрузка анализа изображений...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Анализ изображений в БД
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Проблемные</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{Array.isArray(problematicSkins) ? problematicSkins.length : 0}</div>
              <div className="text-sm text-gray-400">Неверные пути к файлам</div>
            </div>

            <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Корректные</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{Array.isArray(validSkins) ? validSkins.length : 0}</div>
              <div className="text-sm text-gray-400">Правильные URL</div>
            </div>

            <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Без изображений</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{Array.isArray(nullImageSkins) ? nullImageSkins.length : 0}</div>
              <div className="text-sm text-gray-400">Пустые image_url</div>
            </div>
          </div>

          {Array.isArray(problematicSkins) && problematicSkins.length > 0 && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Проблемные скины:</h4>
              <div className="text-sm text-gray-300 space-y-1 max-h-32 overflow-y-auto">
                {problematicSkins.map(skin => (
                  <div key={skin.id} className="flex justify-between">
                    <span>{skin.name}</span>
                    <span className="text-red-400 text-xs">{skin.image_url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCleanupInvalidUrls}
              disabled={isCleaningUp || !Array.isArray(problematicSkins) || problematicSkins.length === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCleaningUp ? "Очистка..." : `Очистить ${Array.isArray(problematicSkins) ? problematicSkins.length : 0} проблемных изображений`}
            </Button>
          </div>

          {cleanupResults && (
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/20">
              <h4 className="text-green-400 font-medium mb-2">Результаты очистки:</h4>
              <div className="text-sm text-gray-300">
                <div>Очищено изображений: {cleanupResults.cleaned}</div>
                <div className="mt-2 text-xs">
                  Затронутые скины: {cleanupResults.skinsAffected.join(', ')}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseImageCleanup;
