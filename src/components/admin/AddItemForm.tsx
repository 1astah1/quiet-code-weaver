import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import SkinRaritySelector from "./SkinRaritySelector";
import { Case, Skin } from "@/utils/supabaseTypes";

interface AddItemFormProps {
  activeTable: string;
  newItem: Case | Skin | Record<string, unknown>;
  setNewItem: (item: Case | Skin | Record<string, unknown>) => void;
  onAdd: () => void;
  onImageUpload: (file: File, isEdit?: boolean, itemId?: string, fieldName?: string) => Promise<string | undefined>;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, fieldName: string = 'image_url') => {
    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0] || null;
    } else {
      file = e.target.files?.[0] || null;
    }
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const imageUrl = await onImageUpload(file, false, undefined, fieldName);
        if (imageUrl) {
          setNewItem({ ...newItem, [fieldName]: imageUrl });
        }
      } catch (error) {
        console.error('❌ [ADD_FORM] Image upload failed:', error);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setNewItem({ ...newItem, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAdd = async () => {
    // Валидация обязательных полей для задач
    if (activeTable === 'tasks') {
      if (!newItem.title || !newItem.description || !newItem.reward_coins || !newItem.image_url) {
        alert('Заполните все обязательные поля: название, описание, награда, картинка');
        return;
      }
      if (isNaN(Number(newItem.reward_coins)) || Number(newItem.reward_coins) <= 0) {
        alert('Награда должна быть положительным числом');
        return;
      }
    }
    await onAdd();
    setImageFile(null);
    setPreviewUrl(null);
  };

  const getFormFields = () => {
    switch (activeTable) {
      case 'skins':
        return (
          <>
            <div>
              <Label>Название *</Label>
              <Input
                value={typeof newItem.name === 'string' ? newItem.name : ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Название скина"
                required
              />
            </div>
            
            <div>
              <Label>Тип оружия *</Label>
              <Input
                value={('weapon_type' in newItem && typeof newItem.weapon_type === 'string') ? newItem.weapon_type : ''}
                onChange={(e) => setNewItem({ ...newItem, weapon_type: e.target.value })}
                placeholder="AK-47, M4A4, AWP и т.д."
                required
              />
            </div>
            
            <div>
              <Label>Редкость *</Label>
              <SkinRaritySelector
                value={('rarity' in newItem && typeof newItem.rarity === 'string') ? newItem.rarity : ''}
                onChange={(value) => setNewItem({ ...newItem, rarity: value })}
              />
            </div>
            
            <div>
              <Label>Цена (монеты) *</Label>
              <Input
                type="number"
                value={typeof newItem.price === 'number' ? newItem.price.toString() : ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                placeholder="100"
                min="1"
                required
              />
            </div>
            
            <div>
              <Label>Изображение скина</Label>
              <div className="space-y-2">
                <div
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer ${uploadingImage ? 'opacity-60' : 'hover:border-orange-500'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); handleImageChange(e, 'image_url'); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {previewUrl || newItem.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={previewUrl || newItem.image_url}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded mb-2 mx-auto border border-gray-600"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs hover:bg-red-600"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      >Удалить</button>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center justify-center h-32">
                      <span>Перетащите или выберите картинку</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, 'image_url')}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <div className="text-orange-500 mt-2">Загрузка...</div>}
                  <p className="text-xs text-gray-400 mt-1">{getImageRequirements('image_url')}</p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'cases':
        return (
          <>
            <div>
              <Label>Название</Label>
              <Input
                value={typeof newItem.name === 'string' ? newItem.name : ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Название кейса"
              />
            </div>
            
            <div>
              <Label>Описание</Label>
              <Input
                value={('description' in newItem && typeof newItem.description === 'string') ? newItem.description : ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Описание кейса"
              />
            </div>
            
            <div>
              <Label>Цена</Label>
              <Input
                type="number"
                value={typeof newItem.price === 'number' ? newItem.price.toString() : ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>
            
            <div>
              <Label>Изображение кейса</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'image_url')}
                disabled={uploadingImage}
              />
              <p className="text-xs text-gray-400 mt-1">
                {getImageRequirements('image_url')}
              </p>
            </div>
            
            <div>
              <Label>Обложка кейса</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'cover_image_url')}
                disabled={uploadingImage}
              />
              <p className="text-xs text-gray-400 mt-1">
                {getImageRequirements('cover_image_url')}
              </p>
            </div>
          </>
        );
        
      case 'tasks':
        return (
          <>
            <div>
              <Label>Название</Label>
              <Input
                value={typeof newItem.title === 'string' ? newItem.title : ''}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Название задания"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Input
                value={typeof newItem.description === 'string' ? newItem.description : ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Описание задания"
              />
            </div>
            <div>
              <Label>Награда (монеты)</Label>
              <Input
                type="number"
                value={typeof newItem.reward_coins === 'number' ? newItem.reward_coins : ''}
                onChange={(e) => setNewItem({ ...newItem, reward_coins: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>
            <div>
              <Label>Картинка задания <span className="text-red-500">*</span></Label>
              <div
                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer ${uploadingImage ? 'opacity-60' : 'hover:border-orange-500'}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); handleImageChange(e, 'image_url'); }}
                onDragOver={(e) => e.preventDefault()}
              >
                {previewUrl || newItem.image_url ? (
                  <div className="relative inline-block">
                    <img
                      src={previewUrl || newItem.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded mb-2 mx-auto border border-gray-600"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    >Удалить</button>
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center justify-center h-32">
                    <span>Перетащите или выберите картинку</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'image_url')}
                  disabled={uploadingImage}
                />
                {uploadingImage && <div className="text-orange-500 mt-2">Загрузка...</div>}
                <p className="text-xs text-gray-400 mt-1">{getImageRequirements('image_url')}</p>
              </div>
            </div>
          </>
        );
        
      default:
        return Object.keys(newItem).map((key) => (
          <div key={key}>
            <Label>{key}</Label>
            <Input
              value={typeof (newItem as Record<string, unknown>)[key] === 'string' ? (newItem as Record<string, unknown>)[key] : ''}
              onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
              placeholder={`Введите ${key}`}
            />
          </div>
        ));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">
        Добавить новый элемент в {activeTable}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {getFormFields()}
      </div>
      
      <Button 
        onClick={handleAdd} 
        disabled={uploadingImage}
        className="bg-green-600 hover:bg-green-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploadingImage ? 'Загрузка...' : 'Добавить'}
      </Button>
    </div>
  );
};

export default AddItemForm;
