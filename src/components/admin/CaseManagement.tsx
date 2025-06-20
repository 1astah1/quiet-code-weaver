import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload } from "lucide-react";
import CaseJSONImporter from "./CaseJSONImporter";

interface CaseManagementProps {
  tableData: any[];
  selectedCase: string | null;
  setSelectedCase: (caseId: string | null) => void;
  uploadingImage: boolean;
  onSkinImageUpload: (file: File, skinId: string) => void;
}

const CaseManagement = ({ 
  tableData, 
  selectedCase, 
  setSelectedCase, 
  uploadingImage, 
  onSkinImageUpload 
}: CaseManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showImporter, setShowImporter] = useState(false);

  // Fetch all skins for case management
  const { data: allSkins } = useQuery({
    queryKey: ['all_skins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch case skins for probability management
  const { data: caseSkins } = useQuery({
    queryKey: ['case_skins', selectedCase],
    queryFn: async () => {
      if (!selectedCase) return [];
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          *,
          skins!inner(id, name, weapon_type, rarity, image_url),
          cases!inner(name)
        `)
        .eq('case_id', selectedCase);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCase
  });

  const addSkinToCase = async (skinId: string) => {
    if (!selectedCase) return;
    
    try {
      const { error } = await supabase
        .from('case_skins')
        .insert({
          case_id: selectedCase,
          skin_id: skinId,
          probability: 0.01,
          never_drop: false
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      toast({ title: "Скин добавлен в кейс" });
    } catch (error) {
      console.error('Add skin error:', error);
      toast({ title: "Ошибка добавления скина", variant: "destructive" });
    }
  };

  const removeSkinFromCase = async (caseSkinId: string) => {
    try {
      const { error } = await supabase
        .from('case_skins')
        .delete()
        .eq('id', caseSkinId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
      toast({ title: "Скин удален из кейса" });
    } catch (error) {
      console.error('Remove skin error:', error);
      toast({ title: "Ошибка удаления скина", variant: "destructive" });
    }
  };

  const updateCaseSkinProbability = async (caseSkinId: string, probability: number) => {
    try {
      const { error } = await supabase
        .from('case_skins')
        .update({ custom_probability: probability })
        .eq('id', caseSkinId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
    } catch (error) {
      console.error('Update probability error:', error);
      toast({ title: "Ошибка обновления вероятности", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* JSON Importer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Импорт кейсов</h3>
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{showImporter ? 'Скрыть импорт' : 'Импорт из JSON'}</span>
          </button>
        </div>
        
        {showImporter && (
          <CaseJSONImporter 
            onImportSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['cases'] });
              setShowImporter(false);
            }}
          />
        )}
      </div>

      {/* Existing case management */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-white font-semibold mb-4">Управление содержимым кейсов</h3>
        
        {/* Case selector */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">Выберите кейс для редактирования:</label>
          <select
            value={selectedCase || ''}
            onChange={(e) => setSelectedCase(e.target.value || null)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="">Выберите кейс</option>
            {tableData?.map((caseItem: any) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCase && (
          <>
            {/* Current case skins */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Скины в кейсе:</h4>
              <div className="space-y-3">
                {caseSkins?.map((caseSkin: any) => (
                  <div key={caseSkin.id} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gray-600 rounded overflow-hidden">
                        {caseSkin.skins.image_url ? (
                          <img 
                            src={caseSkin.skins.image_url} 
                            alt={caseSkin.skins.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-medium block">
                          {caseSkin.skins.name}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {caseSkin.skins.weapon_type} - {caseSkin.skins.rarity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-center space-y-1">
                        <label className="text-gray-300 text-xs">Вероятность выпадения (0-1)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={caseSkin.custom_probability || caseSkin.probability}
                          onChange={(e) => {
                            const newProb = parseFloat(e.target.value);
                            updateCaseSkinProbability(caseSkin.id, newProb);
                          }}
                          className="w-24 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          placeholder="0.001"
                        />
                        <span className="text-gray-400 text-xs">Где 1 = 100%</span>
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        <label className="text-gray-300 text-xs">Изображение скина</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onSkinImageUpload(file, caseSkin.skins.id);
                          }}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs w-24"
                          disabled={uploadingImage}
                        />
                        <span className="text-gray-400 text-xs">512x512px, JPG/PNG</span>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={caseSkin.never_drop}
                          onChange={async (e) => {
                            const { error } = await supabase
                              .from('case_skins')
                              .update({ never_drop: e.target.checked })
                              .eq('id', caseSkin.id);
                            if (!error) {
                              queryClient.invalidateQueries({ queryKey: ['case_skins', selectedCase] });
                            }
                          }}
                          className="text-orange-500"
                        />
                        <span className="text-gray-300 text-sm">Никогда не выпадает</span>
                      </label>
                      <button
                        onClick={() => removeSkinFromCase(caseSkin.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                        title="Удалить скин из кейса"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add skins to case */}
            <div>
              <h4 className="text-white font-medium mb-3">Добавить скины в кейс:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {allSkins?.filter(skin => 
                  !caseSkins?.some(cs => cs.skins.id === skin.id)
                ).map((skin: any) => (
                  <div key={skin.id} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gray-600 rounded overflow-hidden">
                        {skin.image_url ? (
                          <img 
                            src={skin.image_url} 
                            alt={skin.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Нет
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-medium block truncate">
                          {skin.name}
                        </span>
                        <span className="text-gray-400 text-xs truncate">
                          {skin.weapon_type} - {skin.rarity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addSkinToCase(skin.id)}
                      className="bg-green-600 hover:bg-green-700 text-white p-1 rounded ml-2"
                      title="Добавить скин в кейс"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaseManagement;
