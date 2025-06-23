
import { useState } from "react";
import { X, Save, Upload, Image, Loader2 } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import type { Banner } from "@/utils/supabaseTypes";

interface BannerFormProps {
  banner: Banner | null;
  onSave: (data: Partial<Banner>) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
  uploadingImage: boolean;
  isSaving?: boolean;
}

const BannerForm = ({ banner, onSave, onCancel, onImageUpload, uploadingImage, isSaving = false }: BannerFormProps) => {
  const [formData, setFormData] = useState({
    title: banner?.title || '',
    description: banner?.description || '',
    image_url: banner?.image_url || '',
    button_text: banner?.button_text || '',
    button_action: banner?.button_action || '',
    is_active: banner?.is_active ?? true,
    order_index: banner?.order_index || 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isSaving) {
      console.log('🚫 [BANNER_FORM] Form submission blocked - already submitting');
      return;
    }

    setIsSubmitting(true);
    console.log('📝 [BANNER_FORM] Form submitted with data:', formData);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('❌ [BANNER_FORM] Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !uploadingImage) {
      try {
        console.log('📁 [BANNER_FORM] File selected for upload:', { name: file.name, size: file.size, type: file.type });
        const imageUrl = await onImageUpload(file);
        console.log('✅ [BANNER_FORM] Upload successful, URL:', imageUrl);
        setFormData({ ...formData, image_url: imageUrl });
        // Очищаем input для возможности повторной загрузки того же файла
        e.target.value = '';
      } catch (error) {
        console.error('❌ [BANNER_FORM] Failed to upload image:', error);
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    console.log('🗑️ [BANNER_FORM] Removing image');
    setFormData({ ...formData, image_url: '' });
  };

  const isLoading = isSubmitting || isSaving || uploadingImage;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Заголовок *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-white text-sm font-medium mb-2">Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            rows={3}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Изображение баннера</label>
          
          {formData.image_url && (
            <div className="mb-3">
              <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden">
                <OptimizedImage
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-600">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  }
                  timeout={3000}
                  onError={() => {
                    console.error('❌ [BANNER_FORM] Preview image failed to load:', formData.image_url);
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 ${uploadingImage ? 'opacity-50' : ''}`}>
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{uploadingImage ? 'Загрузка...' : 'Загрузить изображение'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage || isLoading}
                className="hidden"
              />
            </label>
            
            {!formData.image_url && (
              <div>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Или введите URL изображения"
                  className="bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
          
          <p className="text-gray-400 text-xs mt-1">
            Рекомендуемый размер: 800x400px, форматы: JPG, PNG, WebP, максимум 5MB
          </p>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Текст кнопки *</label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Действие кнопки *</label>
          <select
            value={formData.button_action}
            onChange={(e) => setFormData({ ...formData, button_action: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            required
            disabled={isLoading}
          >
            <option value="">Выберите действие</option>
            <option value="skins">Перейти в магазин</option>
            <option value="cases">Перейти к кейсам</option>
            <option value="tasks">Перейти к заданиям</option>
            <option value="quiz">Перейти к викторине</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Порядок отображения</label>
          <input
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded disabled:opacity-50"
            disabled={isLoading}
          />
          <label className="text-white text-sm">Активен</label>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isSubmitting || isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting || isSaving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Отмена</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BannerForm;
