import { useState } from "react";
import { TableName } from "@/types/admin";
import { Upload } from "lucide-react";
import SkinRaritySelector, { CS2_RARITIES } from "./SkinRaritySelector";

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
  const renderFormFields = () => {
    switch (activeTable) {
      case "skins":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название скина"
              value={newItem.name || ''}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Тип оружия"
              value={newItem.weapon_type || ''}
              onChange={(e) => setNewItem({ ...newItem, weapon_type: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Цена"
              value={newItem.price || ''}
              onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <div className="col-span-1 md:col-span-2">
              <SkinRaritySelector
                value={newItem.rarity || ''}
                onChange={(rarity) => {
                  const rarityInfo = CS2_RARITIES[rarity];
                  setNewItem({ 
                    ...newItem, 
                    rarity,
                    probability: rarityInfo?.probability || 0.01
                  });
                }}
                showProbability={true}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Изображение скина:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file, false, undefined, 'image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingImage}
              />
              <p className="text-gray-400 text-xs mt-1">{getImageRequirements('image_url')}</p>
            </div>
          </div>
        );
      
      case "cases":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название кейса"
              value={newItem.name || ''}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Цена"
              value={newItem.price || ''}
              onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <div className="col-span-1 md:col-span-2">
              <textarea
                placeholder="Описание кейса"
                value={newItem.description || ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                rows={3}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Обложка кейса:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file, false, undefined, 'cover_image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingImage}
              />
              <p className="text-gray-400 text-xs mt-1">{getImageRequirements('cover_image_url')}</p>
            </div>
            <label className="flex items-center space-x-2 col-span-1 md:col-span-2">
              <input
                type="checkbox"
                checked={newItem.is_free || false}
                onChange={(e) => setNewItem({ ...newItem, is_free: e.target.checked })}
                className="text-orange-500"
              />
              <span className="text-gray-300">Бесплатный кейс</span>
            </label>
          </div>
        );

      case "users":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Имя пользователя"
              value={newItem.username || ''}
              onChange={(e) => setNewItem({ ...newItem, username: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={newItem.email || ''}
              onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Монеты"
              value={newItem.coins || ''}
              onChange={(e) => setNewItem({ ...newItem, coins: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
          </div>
        );

      case "tasks":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название задания"
              value={newItem.title || ''}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Награда (монеты)"
              value={newItem.reward_coins || ''}
              onChange={(e) => setNewItem({ ...newItem, reward_coins: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
            <div className="col-span-1 md:col-span-2">
              <textarea
                placeholder="Описание задания"
                value={newItem.description || ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                rows={3}
              />
            </div>
            <input
              type="url"
              placeholder="Ссылка на задание (опционально)"
              value={newItem.task_url || ''}
              onChange={(e) => setNewItem({ ...newItem, task_url: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded col-span-1 md:col-span-2"
            />
          </div>
        );

      case "quiz_questions":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Вопрос"
              value={newItem.question || ''}
              onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Вариант A"
                value={newItem.option_a || ''}
                onChange={(e) => setNewItem({ ...newItem, option_a: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Вариант B"
                value={newItem.option_b || ''}
                onChange={(e) => setNewItem({ ...newItem, option_b: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Вариант C"
                value={newItem.option_c || ''}
                onChange={(e) => setNewItem({ ...newItem, option_c: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Вариант D"
                value={newItem.option_d || ''}
                onChange={(e) => setNewItem({ ...newItem, option_d: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>
            <select
              value={newItem.correct_answer || ''}
              onChange={(e) => setNewItem({ ...newItem, correct_answer: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            >
              <option value="">Выберите правильный ответ</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Изображение для вопроса:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file, false, undefined, 'image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingImage}
              />
              <p className="text-gray-400 text-xs mt-1">{getImageRequirements('image_url')}</p>
            </div>
          </div>
        );

      case "banners":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Заголовок баннера"
              value={newItem.title || ''}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            />
            <textarea
              placeholder="Описание баннера"
              value={newItem.description || ''}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Текст кнопки"
                value={newItem.button_text || ''}
                onChange={(e) => setNewItem({ ...newItem, button_text: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Действие кнопки"
                value={newItem.button_action || ''}
                onChange={(e) => setNewItem({ ...newItem, button_action: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Изображение баннера:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file, false, undefined, 'image_url');
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                disabled={uploadingImage}
              />
              <p className="text-gray-400 text-xs mt-1">{getImageRequirements('image_url')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-4">
        Добавить новый элемент ({activeTable})
      </h3>
      
      <div className="space-y-4">
        {renderFormFields()}
        
        <button
          onClick={onAdd}
          disabled={uploadingImage}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
          {uploadingImage ? (
            <>
              <Upload className="w-4 h-4 animate-spin" />
              <span>Загружаем...</span>
            </>
          ) : (
            <span>Добавить</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddItemForm;
