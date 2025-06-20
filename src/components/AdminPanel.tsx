
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

type TableName = "cases" | "skins" | "users" | "tasks" | "quiz_questions";

const AdminPanel = () => {
  const [activeTable, setActiveTable] = useState<TableName>("cases");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<any>({});
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
        return ['name', 'description', 'price', 'is_free'];
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

  const renderTableContent = () => {
    if (isLoading) {
      return <div className="text-white">Загрузка...</div>;
    }

    const fields = getTableFields(activeTable);

    return (
      <div className="space-y-4">
        {/* Add new item form */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Добавить новый элемент</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {fields.map(field => (
              <div key={field}>
                <label className="block text-gray-300 text-sm mb-1">{field}</label>
                {field === 'is_free' || field === 'is_active' || field === 'is_admin' ? (
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
          >
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
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
const TableRow = ({ item, fields, isEditing, onEdit, onSave, onCancel, onDelete }: any) => {
  const [editData, setEditData] = useState(item);

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <tr className="border-t border-gray-700">
        {fields.map((field: string) => (
          <td key={field} className="p-3">
            {field === 'is_free' || field === 'is_active' || field === 'is_admin' ? (
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
          {typeof item[field] === 'boolean' 
            ? (item[field] ? 'Да' : 'Нет')
            : (item[field]?.toString() || '-')
          }
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
