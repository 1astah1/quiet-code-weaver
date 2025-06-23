
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      
      // Если bucket не найден, пытаемся создать
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log(`🆕 [BUCKET_CREATE] Creating bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          if (createError.message.includes('already exists')) {
            console.log(`✅ [BUCKET_CREATE] Bucket ${bucketName} already exists`);
            return true;
          } else {
            console.error(`❌ [BUCKET_CREATE] Attempt ${attempt} failed:`, createError);
            if (attempt === retries) throw createError;
            continue;
          }
        }
        
        console.log(`✅ [BUCKET_CREATE] Bucket ${bucketName} created successfully`);
        return true;
      } else {
        console.error(`❌ [BUCKET_ERROR] Unexpected error on attempt ${attempt}:`, error);
        if (attempt === retries) throw error;
      }
      
      // Ждем перед повторной попыткой с экспоненциальной задержкой
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      
    } catch (error: any) {
      console.error(`❌ [BUCKET_ERROR] Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Не удалось создать/проверить bucket ${bucketName}: ${error.message}`);
      }
    }
  }
  
  return false;
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('Файл не выбран');
  
  const uploadTimeout = 45000; // Увеличен timeout до 45 секунд
  
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

    // Проверяем/создаем bucket с улучшенной retry логикой
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
        upsert: false,
        duplex: 'half' // Помогает с загрузкой больших файлов
      });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Время загрузки истекло. Попробуйте уменьшить размер файла')), uploadTimeout);
    });

    // Загружаем файл с timeout
    const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    if (uploadError) {
      console.error('❌ [BANNER_UPLOAD] Upload error:', uploadError);
      
      let errorMessage = uploadError.message;
      if (uploadError.message.includes('duplicate')) {
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

    // Проверяем доступность загруженного файла
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ [BANNER_UPLOAD] File may not be immediately accessible:', testResponse.status);
      }
    } catch (testError) {
      console.warn('⚠️ [BANNER_UPLOAD] Could not verify file accessibility:', testError);
      // Не прерываем выполнение, так как файл может стать доступным позже
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
    } else if (error.message.includes('bucket')) {
      errorMessage = "Ошибка хранилища. Попробуйте позже";
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
