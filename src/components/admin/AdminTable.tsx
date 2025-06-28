
import { format } from 'date-fns';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminTableProps {
  activeTable: string;
  tableData: Record<string, unknown>[];
  onUpdate: () => void;
  onDelete: () => void;
  onImageUpload: (file: File, isEdit?: boolean, itemId?: string, fieldName?: string) => Promise<string | undefined>;
  uploadingImage: boolean;
  getImageRequirements: (fieldName: string) => string;
}

const AdminTable = ({
  activeTable,
  tableData,
  onUpdate,
  onDelete,
  onImageUpload,
  uploadingImage,
  getImageRequirements
}: AdminTableProps) => {
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Record<string, unknown>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleEdit = (item: Record<string, unknown>) => {
    setEditItemId(item.id as string);
    setEditItemData(item);
  };

  const handleCancelEdit = () => {
    setEditItemId(null);
    setEditItemData({});
    setImageFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditItemData({ ...editItemData, [name]: value });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        await onImageUpload(file, true, itemId, fieldName);
      } catch (error) {
        console.error('❌ [ADMIN_TABLE] Image upload failed:', error);
      }
    }
  };

  const handleUpdate = async () => {
    if (!editItemId) return;

    try {
      const { error } = await supabase
        .from(activeTable)
        .update(editItemData)
        .eq('id', editItemId);

      if (error) {
        console.error('❌ [ADMIN_TABLE] Update failed:', error);
        alert(`Ошибка при обновлении: ${error.message}`);
        return;
      }

      await onUpdate();
      setEditItemId(null);
      setEditItemData({});
      setImageFile(null);
    } catch (error: any) {
      console.error('❌ [ADMIN_TABLE] Update failed:', error);
      alert(`Ошибка при обновлении: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить элемент с ID ${id}?`)) {
      try {
        const { error } = await supabase
          .from(activeTable)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('❌ [ADMIN_TABLE] Delete failed:', error);
          alert(`Ошибка при удалении: ${error.message}`);
          return;
        }

        await onDelete();
      } catch (error: any) {
        console.error('❌ [ADMIN_TABLE] Delete failed:', error);
        alert(`Ошибка при удалении: ${error.message}`);
      }
    }
  };

  const renderCell = (item: Record<string, unknown>, key: string) => {
    const value = item[key];
    
    if (value === null || value === undefined) {
      return <span className="text-gray-500">—</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-400' : 'text-red-400'}>{value ? 'Да' : 'Нет'}</span>;
    }
    
    if (key.includes('created_at') || key.includes('updated_at') || key.includes('_at')) {
      if (typeof value === 'string' && value.trim() !== '') {
        try {
          return <span className="text-gray-300">{format(new Date(value), 'dd.MM.yyyy HH:mm')}</span>;
        } catch {
          return <span className="text-gray-500">Invalid date</span>;
        }
      }
      return <span className="text-gray-500">—</span>;
    }
    
    if (key.includes('image_url') && typeof value === 'string' && value.trim()) {
      return (
        <div className="flex items-center space-x-2">
          <img src={value} alt="Preview" className="w-8 h-8 object-cover rounded border border-gray-600" />
          <span className="text-xs text-gray-400 truncate max-w-[100px]">{value}</span>
        </div>
      );
    }
    
    return <span className="text-white">{String(value)}</span>;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Управление таблицей {activeTable}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              {tableData.length > 0 ? (
                Object.keys(tableData[0]).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))
              ) : (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Нет данных
                </th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {tableData.map((item) => (
              <tr key={item.id as string}>
                {Object.keys(item).map((key) => (
                  <td key={`${item.id}-${key}`} className="px-4 py-2 whitespace-nowrap">
                    {editItemId === item.id ? (
                      key.includes('image_url') ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, item.id as string, key)}
                            disabled={uploadingImage}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {getImageRequirements(key)}
                          </p>
                        </>
                      ) : (
                        <Input
                          type="text"
                          name={key}
                          value={(editItemData[key] !== null && editItemData[key] !== undefined) ? String(editItemData[key]) : ''}
                          onChange={handleInputChange}
                          className="text-black"
                        />
                      )
                    ) : (
                      renderCell(item, key)
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 whitespace-nowrap">
                  {editItemId === item.id ? (
                    <>
                      <Button onClick={handleUpdate} disabled={uploadingImage} className="mr-2 bg-blue-600 hover:bg-blue-700">
                        {uploadingImage ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="secondary">
                        Отмена
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleEdit(item)}
                        className="mr-2 bg-orange-500 hover:bg-orange-600"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Изменить
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id as string)}
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
