
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ensureBucketExists = async (bucketName: string, retries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🪣 [BUCKET_CHECK] Attempt ${attempt}/${retries} - Checking bucket: ${bucketName}`);
      
      // Проверяем bucket через получение публичного URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl('test');
      
      if (publicUrl) {
        console.log(`✅ [BUCKET_CHECK] Bucket ${bucketName} exists and accessible`);
        return true;
      }
      
      // Если publicUrl недоступен, пытаемся создать bucket
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
      
    } catch (error: any) {
      console.error(`❌ [BUCKET_ERROR] Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Не удалось создать/проверить bucket ${bucketName}: ${error.message}`);
      }
      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('Файл не выбран');
  
  const uploadTimeout = 30000; // 30 секунд timeout
  
  try {
    console.log('🖼️ [BANNER_UPLOAD] Starting banner image upload:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Валидация файла
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Файл слишком большой. Максимальный размер: 5MB');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Файл должен быть изображением');
    }

    // Проверяем/создаем bucket с retry логикой
    console.log('🔍 [BANNER_UPLOAD] Ensuring bucket exists...');
    await ensureBucketExists('banner-images');

    // Генерируем имя файла
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `banner_${timestamp}_${randomId}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    console.log('📁 [BANNER_UPLOAD] Upload details:', { fileName, filePath });

    // Создаем Promise с timeout
    const uploadPromise = supabase.storage
      .from('banner-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Время загрузки истекло')), uploadTimeout);
    });

    // Загружаем файл с timeout
    const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    if (uploadError) {
      console.error('❌ [BANNER_UPLOAD] Upload error:', uploadError);
      throw new Error(`Ошибка загрузки: ${uploadError.message}`);
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('banner-images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Не удалось получить публичный URL');
    }

    console.log('✅ [BANNER_UPLOAD] Upload successful:', publicUrl);

    toast({ title: "Изображение баннера загружено успешно" });
    return publicUrl;
  } catch (error: any) {
    console.error('❌ [BANNER_UPLOAD] Upload failed:', error);
    
    let errorMessage = "Неизвестная ошибка";
    if (error.message.includes('timeout') || error.message.includes('Время загрузки истекло')) {
      errorMessage = "Время загрузки истекло. Попробуйте еще раз";
    } else if (error.message.includes('слишком большой')) {
      errorMessage = "Файл слишком большой. Максимальный размер: 5MB";
    } else if (error.message.includes('должен быть изображением')) {
      errorMessage = "Поддерживаются только изображения";
    } else {
      errorMessage = error.message || "Ошибка загрузки";
    }
    
    toast({ 
      title: "Ошибка загрузки", 
      description: errorMessage,
      variant: "destructive" 
    });
    throw error;
  }
};
