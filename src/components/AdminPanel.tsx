
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, Upload, Coins } from "lucide-react";

type TableName = "cases" | "skins" | "users" | "tasks" | "quiz_questions";

const AdminPanel = () => {
  const [activeTable, setActiveTable] = useState<TableName>("cases");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tableData, isLoading } = useQuery({
    queryKey: [activeTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(activeTable)
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Fetch case skins for probability management
  const { data: caseSkins } = useQuery({
    queryKey: ['case_skins', activeTable],
    queryFn: async () => {
      if (activeTable !== 'cases') return [];
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          *,
          skins!inner(name, weapon_type, rarity),
          cases!inner(name)
        `);
      if (error) throw error;
      return data;
    },
    enabled: activeTable === 'cases'
  });

  const handleImageUpload = async (file: File, isEdit = false, itemId?: string) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `case-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(filePath);

      if (isEdit && itemId) {
        const { error } = await supabase
          .from(activeTable)
          .update({ cover_image_url: publicUrl })
          .eq('id', itemId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: [activeTable] });
      } else {
        setNewItem({ ...newItem, cover_image_url: publicUrl });
      }

      toast({ title: "Изображение загружено успешно" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .insert([newItem]);
      
      if (error) throw error;
      
      setNewItem({});
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно добавлено" });
    } catch (error) {
      console.error('Add error:', error);
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .update(updatedData)
        .eq('id', id);
      
      if (error) throw error;
      
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно обновлено" });
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: [activeTable] });
      toast({ title: "Успешно удалено" });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const getTableFields = (tableName: TableName) => {
    switch (tableName) {
      case "cases":
        return ['name', 'description', 'price', 'is_free', 'cover_image_url'];
      case "skins":
        return ['name', 'weapon_type', 'rarity', 'price'];
      case "users":
        return ['username', 'email', 'coins', 'is_admin'];
      case "tasks":
        return ['title', 'description', 'reward_coins', 'task_url', 'is_active'];
      case "quiz_questions":
        return ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
      default:
        return [];
    }
  };

  const renderCaseProbabilityManager = () => {
    if (activeTable !== 'cases') return null;

    return (
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h3 className="text-white font-semibold mb-4">Управление вероятностями кейсов</h3>
        <div className="space-y-3">
          {caseSkins?.map((caseSkin: any) => (
            <div key={caseSkin.id} className="bg-gray-700 p-3 rounded flex items-center justify-between">
              <div className="flex-1">
                <span className="text-white font-medium">
                  {caseSkin.cases.name} - {caseSkin.skins.name}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  ({caseSkin.skins.weapon_type} - {caseSkin.skins.rarity})
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={caseSkin.custom_probability || caseSkin.probability}
                  onChange={async (e) => {
                    const newProb = parseFloat(e.target.value);
                    const { error } = await supabase
                      .from('case_skins')
                      .update({ custom_probability: newProb })
                      .eq('id', caseSkin.id);
                    if (!error) {
                      queryClient.invalidateQueries({ queryKey: ['case_skins'] });
                    }
                  }}
                  className="w-20 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  placeholder="0.01"
                />
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
                        queryClient.invalidateQueries({ queryKey: ['case_skins'] });
                      }
                    }}
                    className="text-orange-500"
                  />
                  <span className="text-gray-300 text-sm">Никогда не выпадает</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    if (isLoading) {
      return <div className="text-white">Загрузка...</div>;
    }

    const fields = getTableFields(activeTable);

    return (
      <div className="space-y-4">
        {/* Case Probability Manager */}
        {renderCaseProbabilityManager()}

        {/* Add new item form */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Добавить новый элемент</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {fields.map(field => (
              <div key={field}>
                <label className="block text-gray-300 text-sm mb-1">{field}</label>
                {field === 'cover_image_url' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      disabled={uploadingImage}
                    />
                    {newItem[field] && (
                      <img 
                        src={newItem[field]} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                  </div>
                ) : field === 'is_free' || field === 'is_active' || field === 'is_admin' ? (
                  <select
                    value={newItem[field] || false}
                    onChange={(e) => setNewItem({...newItem, [field]: e.target.value === 'true'})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    <option value="false">Нет</option>
                    <option value="true">Да</option>
                  </select>
                ) : field === 'price' || field === 'coins' || field === 'reward_coins' ? (
                  <input
                    type="number"
                    value={newItem[field] || ''}
                    onChange={(e) => setNewItem({...newItem, [field]: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                ) : (
                  <input
                    type="text"
                    value={newItem[field] || ''}
                    onChange={(e) => setNewItem({...newItem, [field]: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center space-x-2"
            disabled={uploadingImage}
          >
            <Plus className="w-4 h-4" />
            <span>{uploadingImage ? 'Загрузка...' : 'Добавить'}</span>
          </button>
        </div>

        {/* Table data */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  {fields.map(field => (
                    <th key={field} className="text-left p-3 text-gray-300">{field}</th>
                  ))}
                  <th className="text-left p-3 text-gray-300">Действия</th>
                </tr>
              </thead>
              <tbody>
                {tableData?.map((item: any) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    fields={fields}
                    isEditing={editingId === item.id}
                    onEdit={() => setEditingId(item.id)}
                    onSave={(updatedData) => handleUpdate(item.id, updatedData)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(item.id)}
                    onImageUpload={(file) => handleImageUpload(file, true, item.id)}
                    uploadingImage={uploadingImage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <h1 className="text-2xl font-bold text-white mb-6">Админ панель</h1>
      
      {/* Table selector */}
      <div className="mb-6">
        <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg">
          {(['cases', 'skins', 'users', 'tasks', 'quiz_questions'] as TableName[]).map(table => (
            <button
              key={table}
              onClick={() => setActiveTable(table)}
              className={`px-4 py-2 rounded ${
                activeTable === table
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {table}
            </button>
          ))}
        </div>
      </div>

      {renderTableContent()}
    </div>
  );
};

// Separate component for table rows to handle editing
const TableRow = ({ 
  item, 
  fields, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onImageUpload, 
  uploadingImage 
}: any) => {
  const [editData, setEditData] = useState(item);

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <tr className="border-t border-gray-700">
        {fields.map((field: string) => (
          <td key={field} className="p-3">
            {field === 'cover_image_url' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(file);
                  }}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  disabled={uploadingImage}
                />
                {editData[field] && (
                  <img 
                    src={editData[field]} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
              </div>
            ) : field === 'is_free' || field === 'is_active' || field === 'is_admin' ? (
              <select
                value={editData[field] ? 'true' : 'false'}
                onChange={(e) => setEditData({...editData, [field]: e.target.value === 'true'})}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              >
                <option value="false">Нет</option>
                <option value="true">Да</option>
              </select>
            ) : field === 'price' || field === 'coins' || field === 'reward_coins' ? (
              <input
                type="number"
                value={editData[field] || ''}
                onChange={(e) => setEditData({...editData, [field]: parseInt(e.target.value) || 0})}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-20"
              />
            ) : (
              <input
                type="text"
                value={editData[field] || ''}
                onChange={(e) => setEditData({...editData, [field]: e.target.value})}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              />
            )}
          </td>
        ))}
        <td className="p-3">
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-700 hover:bg-gray-750">
      {fields.map((field: string) => (
        <td key={field} className="p-3 text-gray-300">
          {field === 'cover_image_url' && item[field] ? (
            <img 
              src={item[field]} 
              alt="Cover" 
              className="w-12 h-12 object-cover rounded"
            />
          ) : typeof item[field] === 'boolean' ? (
            item[field] ? 'Да' : 'Нет'
          ) : (
            item[field]?.toString() || '-'
          )}
        </td>
      ))}
      <td className="p-3">
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdminPanel;
