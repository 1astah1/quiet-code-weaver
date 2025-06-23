
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import SkinRaritySelector from "./SkinRaritySelector";

interface AddItemFormProps {
  activeTable: string;
  newItem: any;
  setNewItem: (item: any) => void;
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string = 'image_url') => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('🖼️ [ADD_FORM] Image selected:', file.name);
      setImageFile(file);
      
      try {
        const imageUrl = await onImageUpload(file, false, undefined, fieldName);
        if (imageUrl) {
          console.log('✅ [ADD_FORM] Image uploaded successfully:', imageUrl);
          setNewItem({ ...newItem, [fieldName]: imageUrl });
        }
      } catch (error) {
        console.error('❌ [ADD_FORM] Image upload failed:', error);
      }
    }
  };

  const handleAdd = async () => {
    // Валидация обязательных полей для скинов
    if (activeTable === 'skins') {
      if (!newItem.name || !newItem.weapon_type || !newItem.rarity || !newItem.price) {
        alert('Заполните все обязательные поля: название, тип оружия, редкость, цена');
        return;
      }
      
      // Проверяем что цена - число
      if (isNaN(Number(newItem.price)) || Number(newItem.price) <= 0) {
        alert('Цена должна быть положительным числом');
        return;
      }
    }
    
    await onAdd();
    setImageFile(null);
  };

  const getFormFields = () => {
    switch (activeTable) {
      case 'skins':
        return (
          <>
            <div>
              <Label>Название *</Label>
              <Input
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Название скина"
                required
              />
            </div>
            
            <div>
              <Label>Тип оружия *</Label>
              <Input
                value={newItem.weapon_type || ''}
                onChange={(e) => setNewItem({ ...newItem, weapon_type: e.target.value })}
                placeholder="AK-47, M4A4, AWP и т.д."
                required
              />
            </div>
            
            <div>
              <Label>Редкость *</Label>
              <SkinRaritySelector
                value={newItem.rarity || ''}
                onChange={(value) => setNewItem({ ...newItem, rarity: value })}
              />
            </div>
            
            <div>
              <Label>Цена (монеты) *</Label>
              <Input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                placeholder="100"
                min="1"
                required
              />
            </div>
            
            <div>
              <Label>Изображение скина</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'image_url')}
                  disabled={uploadingImage}
                />
                <p className="text-xs text-gray-400">
                  {getImageRequirements('image_url')}
                </p>
                {newItem.image_url && !uploadingImage && (
                  <div className="mt-2">
                    <img 
                      src={newItem.image_url} 
                      alt="Превью" 
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        console.log('❌ [ADD_FORM] Image preview failed to load:', newItem.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {uploadingImage && (
                  <div className="text-sm text-blue-400">Загрузка изображения...</div>
                )}
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
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Название кейса"
              />
            </div>
            
            <div>
              <Label>Описание</Label>
              <Input
                value={newItem.description || ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Описание кейса"
              />
            </div>
            
            <div>
              <Label>Цена</Label>
              <Input
                type="number"
                value={newItem.price || ''}
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
        
      default:
        return Object.keys(newItem).map((key) => (
          <div key={key}>
            <Label>{key}</Label>
            <Input
              value={newItem[key] || ''}
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
