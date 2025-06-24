
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const ensureBucketExists = async (bucketName: string, retries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🪣 [BUCKET_CHECK] Attempt ${attempt}/${retries} - Checking bucket: ${bucketName}`);
      
      // Проверяем bucket через попытку листинга файлов (более надежно)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (!error) {
        console.log(`✅ [BUCKET_CHECK] Bucket ${bucketName} exists and accessible`);
        return true;
      }
      
      console.warn(`⚠️ [BUCKET_CHECK] Bucket ${bucketName} check failed:`, error);
      
      // Если bucket не найден, значит он не существует (но политики RLS теперь должны работать)
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log(`❌ [BUCKET_CHECK] Bucket ${bucketName} does not exist`);
        throw new Error(`Bucket ${bucketName} не существует. Обратитесь к администратору.`);
      }
      
      // Если это RLS ошибка, bucket существует, но нет прав
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log(`🔒 [BUCKET_CHECK] RLS policy issue for bucket ${bucketName}`);
        throw new Error(`Нет прав доступа к bucket ${bucketName}. Убедитесь, что у вас есть админские права.`);
      }
      
      // Для других ошибок продолжаем попытки
      if (attempt === retries) {
        throw error;
      }
      
      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
    } catch (error: any) {
      console.error(`❌ [BUCKET_ERROR] Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Не удалось проверить bucket ${bucketName}: ${error.message}`);
      }
    }
  }
  
  return false;
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('Файл не выбран');
  
  const uploadTimeout = 45000;
  
  try {
    console.log('🖼️ [BANNER_UPLOAD] Starting banner image upload:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Расширенная валидация файла
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Файл слишком большой. Максимальный размер: 5MB');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Файл должен быть изображением');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Поддерживаемые форматы: JPG, PNG, WebP, GIF');
    }

    // Проверяем bucket с улучшенной обработкой ошибок
    console.log('🔍 [BANNER_UPLOAD] Ensuring bucket exists...');
    await ensureBucketExists('banner-images');

    // Генерируем уникальное имя файла
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `banner_${timestamp}_${randomId}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    console.log('📁 [BANNER_UPLOAD] Upload details:', { fileName, filePath, fileSize: file.size });

    // Создаем Promise с timeout
    const uploadPromise = supabase.storage
      .from('banner-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Время загрузки истекло. Попробуйте уменьшить размер файла')), uploadTimeout);
    });

    // Загружаем файл с timeout
    const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    if (uploadError) {
      console.error('❌ [BANNER_UPLOAD] Upload error:', uploadError);
      
      let errorMessage = uploadError.message;
      
      // Обработка специфичных ошибок RLS
      if (uploadError.message.includes('RLS') || uploadError.message.includes('policy')) {
        errorMessage = 'Нет прав для загрузки файлов. Убедитесь, что у вас есть админские права.';
      } else if (uploadError.message.includes('duplicate')) {
        errorMessage = 'Файл с таким именем уже существует';
      } else if (uploadError.message.includes('size')) {
        errorMessage = 'Файл слишком большой';
      } else if (uploadError.message.includes('mime')) {
        errorMessage = 'Неподдерживаемый формат файла';
      }
      
      throw new Error(`Ошибка загрузки: ${errorMessage}`);
    }

    if (!data?.path) {
      throw new Error('Не удалось получить путь к загруженному файлу');
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('banner-images')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Не удалось получить публичный URL');
    }

    console.log('✅ [BANNER_UPLOAD] Upload successful:', {
      path: data.path,
      publicUrl,
      fileSize: file.size
    });

    toast({ 
      title: "Изображение загружено успешно",
      description: `Файл ${file.name} загружен в облако`
    });
    
    return publicUrl;
    
  } catch (error: any) {
    console.error('❌ [BANNER_UPLOAD] Upload failed:', error);
    
    let errorMessage = "Неизвестная ошибка";
    
    if (error.message.includes('timeout') || error.message.includes('Время загрузки истекло')) {
      errorMessage = "Время загрузки истекло. Проверьте подключение к интернету или попробуйте уменьшить размер файла";
    } else if (error.message.includes('слишком большой')) {
      errorMessage = "Файл слишком большой. Максимальный размер: 5MB";
    } else if (error.message.includes('должен быть изображением') || error.message.includes('Поддерживаемые форматы')) {
      errorMessage = error.message;
    } else if (error.message.includes('bucket') || error.message.includes('RLS') || error.message.includes('policy')) {
      errorMessage = error.message;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = "Ошибка сети. Проверьте подключение к интернету";
    } else {
      errorMessage = error.message || "Неизвестная ошибка загрузки";
    }
    
    toast({ 
      title: "Ошибка загрузки", 
      description: errorMessage,
      variant: "destructive" 
    });
    
    throw new Error(errorMessage);
  }
};
