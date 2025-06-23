import { useState } from "react";
import { X, Save, Upload, Image, Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateImageUrl = (url: string): boolean => {
    if (!url) return true; // Пустой URL валиден
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isSaving) {
      console.log('🚫 [BANNER_FORM] Form submission blocked - already submitting');
      return;
    }

    // Валидация URL изображения
    if (formData.image_url && !validateImageUrl(formData.image_url)) {
      setImageError('Некорректный URL изображения');
      return;
    }

    setIsSubmitting(true);
    setImageError(null);
    console.log('📝 [BANNER_FORM] Form submitted with data:', formData);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('❌ [BANNER_FORM] Form submission error:', error);
      setImageError('Ошибка сохранения баннера');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !uploadingImage) {
      setImageError(null);
      setUploadProgress(0);
      
      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        console.log('📁 [BANNER_FORM] File selected for upload:', { 
          name: file.name, 
          size: file.size, 
          type: file.type 
        });
        
        const imageUrl = await onImageUpload(file);
        console.log('✅ [BANNER_FORM] Upload successful, URL:', imageUrl);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setFormData({ ...formData, image_url: imageUrl });
        setImageError(null);
        
        // Очищаем прогресс через секунду
        setTimeout(() => setUploadProgress(0), 1000);
        
        // Очищаем input для возможности повторной загрузки того же файла
        e.target.value = '';
      } catch (error: any) {
        console.error('❌ [BANNER_FORM] Failed to upload image:', error);
        clearInterval(progressInterval);
        setUploadProgress(0);
        setImageError(error.message || 'Ошибка загрузки изображения');
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    console.log('🗑️ [BANNER_FORM] Removing image');
    setFormData({ ...formData, image_url: '' });
    setImageError(null);
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImageError(null);
    
    if (url && !validateImageUrl(url)) {
      setImageError('Некорректный формат URL');
    }
  };

  const retryImageLoad = () => {
    setImageLoading(true);
    setImageError(null);
    // Форсируем перезагрузку изображения
    const currentUrl = formData.image_url;
    setFormData({ ...formData, image_url: '' });
    setTimeout(() => {
      setFormData({ ...formData, image_url: currentUrl });
      setImageLoading(false);
    }, 100);
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-600 text-gray-400 p-2">
                      <Image className="w-8 h-8 mb-2" />
                      <span className="text-xs text-center">Ошибка загрузки</span>
                      <button
                        type="button"
                        onClick={retryImageLoad}
                        className="mt-1 text-xs text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Повторить
                      </button>
                    </div>
                  }
                  timeout={10000}
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(null);
                  }}
                  onError={() => {
                    console.error('❌ [BANNER_FORM] Preview image failed to load:', formData.image_url);
                    setImageLoading(false);
                    setImageError('Изображение не загружается');
                  }}
                />
                
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                )}
                
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

          <div className="space-y-3">
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
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="Или введите URL изображения"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
          </div>

          {imageError && (
            <div className="mt-2 flex items-center text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {imageError}
            </div>
          )}
          
          <p className="text-gray-400 text-xs mt-2">
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
            disabled={isLoading || !!imageError}
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
