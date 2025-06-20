
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { TableName } from "@/types/admin";

interface AddItemFormProps {
  activeTable: TableName;
  newItem: any;
  setNewItem: (item: any) => void;
  onAdd: () => void;
  onImageUpload: (file: File, isEdit?: boolean, itemId?: string, fieldName?: string) => void;
  uploadingImage: boolean;
  getImageRequirements: (fieldName: string) => string;
}

const AddItemForm = ({ 
  activeTable, 
  newItem, 
  setNewItem, 
  onAdd, 
  onImageUpload, 
  uploadingImage, 
  getImageRequirements 
}: AddItemFormProps) => {
  const getTableFields = (tableName: TableName) => {
    switch (tableName) {
      case "cases":
        return ['name', 'description', 'price', 'is_free', 'cover_image_url'];
      case "skins":
        return ['name', 'weapon_type', 'rarity', 'price', 'image_url'];
      case "users":
        return ['username', 'email', 'coins', 'is_admin'];
      case "tasks":
        return ['title', 'description', 'reward_coins', 'task_url', 'is_active'];
      case "quiz_questions":
        return ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'image_url'];
      default:
        return [];
    }
  };

  const fields = getTableFields(activeTable);

  const renderField = (field: string) => {
    if (field === 'cover_image_url' || field === 'image_url') {
      return (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageUpload(file, false, undefined, field);
            }}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm"
            disabled={uploadingImage}
          />
          <p className="text-xs text-gray-400">{getImageRequirements(field)}</p>
          {newItem[field] && (
            <div className="flex items-center space-x-2">
              <img 
                src={newItem[field]} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded"
              />
              <button
                onClick={() => setNewItem({...newItem, [field]: ''})}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      );
    } else if (field === 'is_free' || field === 'is_active' || field === 'is_admin') {
      return (
        <select
          value={newItem[field] || false}
          onChange={(e) => setNewItem({...newItem, [field]: e.target.value === 'true'})}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        >
          <option value="false">Нет</option>
          <option value="true">Да</option>
        </select>
      );
    } else if (field === 'correct_answer') {
      return (
        <select
          value={newItem[field] || 'A'}
          onChange={(e) => setNewItem({...newItem, [field]: e.target.value})}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      );
    } else if (field === 'price' || field === 'coins' || field === 'reward_coins') {
      return (
        <input
          type="number"
          value={newItem[field] || ''}
          onChange={(e) => setNewItem({...newItem, [field]: parseInt(e.target.value) || 0})}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={newItem[field] || ''}
          onChange={(e) => setNewItem({...newItem, [field]: e.target.value})}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
        />
      );
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-4">Добавить новый элемент</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {fields.map(field => (
          <div key={field}>
            <label className="block text-gray-300 text-sm mb-1">{field}</label>
            {renderField(field)}
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center space-x-2"
        disabled={uploadingImage}
      >
        <Plus className="w-4 h-4" />
        <span>{uploadingImage ? 'Загрузка...' : 'Добавить'}</span>
      </button>
    </div>
  );
};

export default AddItemForm;
