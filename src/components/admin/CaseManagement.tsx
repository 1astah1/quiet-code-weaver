
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";

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
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caseSkins } = useQuery({
    queryKey: ['case_skins', selectedCase],
    queryFn: async () => {
      if (!selectedCase) return [];
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          id,
          probability,
          never_drop,
          custom_probability,
          skins (*)
        `)
        .eq('case_id', selectedCase);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCase
  });

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот кейс? Это действие нельзя отменить.')) {
      return;
    }

    try {
      // Сначала удаляем все связи с скинами
      const { error: skinsError } = await supabase
        .from('case_skins')
        .delete()
        .eq('case_id', caseId);

      if (skinsError) throw skinsError;

      // Затем удаляем сам кейс
      const { error: caseError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (caseError) throw caseError;

      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс успешно удален" });
      
      if (selectedCase === caseId) {
        setSelectedCase(null);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ 
        title: "Ошибка удаления", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleEditCase = (caseItem: any) => {
    setEditingCase(caseItem.id);
    setEditData(caseItem);
  };

  const handleSaveCase = async () => {
    try {
      const { error } = await supabase
        .from('cases')
        .update(editData)
        .eq('id', editingCase);
      
      if (error) throw error;
      
      setEditingCase(null);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({ title: "Кейс обновлен" });
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: "Ошибка обновления", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Управление кейсами</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tableData?.map((caseItem) => (
          <div key={caseItem.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            {editingCase === caseItem.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Название кейса"
                />
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Описание"
                  rows={2}
                />
                <input
                  type="number"
                  value={editData.price || ''}
                  onChange={(e) => setEditData({...editData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  placeholder="Цена"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.is_free || false}
                    onChange={(e) => setEditData({...editData, is_free: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-gray-300">Бесплатный</label>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSaveCase} className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm">
                    Сохранить
                  </Button>
                  <Button 
                    onClick={() => setEditingCase(null)} 
                    variant="outline"
                    className="px-3 py-1 text-sm"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-3">
                  {caseItem.cover_image_url && (
                    <img 
                      src={caseItem.cover_image_url} 
                      alt={caseItem.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{caseItem.name}</h4>
                    <p className="text-gray-400 text-sm">{caseItem.price} монет</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditCase(caseItem)}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      onClick={() => setSelectedCase(caseItem.id)}
                      variant="outline"
                      className="px-2 py-1 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Скины
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => handleDeleteCase(caseItem.id)}
                    className="bg-red-600 hover:bg-red-700 px-2 py-1 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedCase && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-white font-medium mb-4">Скины в кейсе</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {caseSkins?.map((item: any) => (
              <div key={item.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center space-x-3">
                  {item.skins?.image_url && (
                    <img 
                      src={item.skins.image_url} 
                      alt={item.skins.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.skins?.name}</p>
                    <p className="text-gray-400 text-xs">{item.probability}%</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSkinImageUpload(file, item.skins.id);
                  }}
                  className="mt-2 text-xs text-gray-400"
                  disabled={uploadingImage}
                />
              </div>
            ))}
          </div>
          
          <Button
            onClick={() => setSelectedCase(null)}
            variant="outline"
            className="mt-4"
          >
            Закрыть
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
