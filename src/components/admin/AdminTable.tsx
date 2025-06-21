
import { useState } from "react";
import { Edit, Trash2, Save, X } from "lucide-react";
import { TableName } from "@/types/admin";

interface AdminTableProps {
  activeTable: TableName;
  tableData: any[];
  onUpdate: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, isEdit: boolean, itemId: string, fieldName: string) => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const getTableFields = (tableName: TableName) => {
    switch (tableName) {
      case "cases":
        return ['name', 'description', 'price', 'is_free', 'cover_image_url'];
      case "skins":
        return ['name', 'weapon_type', 'rarity', 'price', 'image_url'];
      case "users":
        return ['username', 'email', 'coins', 'is_admin'];
      case "tasks":
        return ['title', 'description', 'reward_coins', 'task_url', 'image_url', 'is_active'];
      case "quiz_questions":
        return ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'image_url'];
      default:
        return [];
    }
  };

  const fields = getTableFields(activeTable);

  return (
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
                onSave={(updatedData) => {
                  onUpdate(item.id, updatedData);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onDelete={() => onDelete(item.id)}
                onImageUpload={(file, fieldName) => onImageUpload(file, true, item.id, fieldName)}
                uploadingImage={uploadingImage}
                getImageRequirements={getImageRequirements}
              />
            ))}
          </tbody>
        </table>
      </div>
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
  uploadingImage,
  getImageRequirements
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
            {(field === 'cover_image_url' || field === 'image_url') ? (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(file, field);
                  }}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  disabled={uploadingImage}
                />
                <p className="text-xs text-gray-400">{getImageRequirements(field)}</p>
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
            ) : field === 'correct_answer' ? (
              <select
                value={editData[field] || 'A'}
                onChange={(e) => setEditData({...editData, [field]: e.target.value})}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            ) : field === 'price' || field === 'coins' || field === 'reward_coins' ? (
              <input
                type="number"
                value={editData[field] || ''}
                onChange={(e) => setEditData({...editData, [field]: parseInt(e.target.value) || 0})}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-20"
                min="0"
                step="1"
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
          {(field === 'cover_image_url' || field === 'image_url') && item[field] ? (
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

export default AdminTable;
