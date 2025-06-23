
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ensureBucketExists = async (bucketName: string) => {
  try {
    console.log(`🪣 [BUCKET_CHECK] Checking bucket: ${bucketName}`);
    
    // Простая попытка загрузки тестового файла для проверки bucket
    const testFileName = `test_${Date.now()}.txt`;
    const { error: testError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, new Blob(['test']), { upsert: false });
    
    if (testError) {
      if (testError.message.includes('Bucket not found')) {
        console.log(`🆕 [BUCKET_CREATE] Creating bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError && !createError.message.includes('already exists')) {
          console.error('❌ [BUCKET_CREATE] Error creating bucket:', createError);
          throw createError;
        }
        
        console.log(`✅ [BUCKET_CREATE] Bucket ${bucketName} created successfully`);
      } else {
        // Удаляем тестовый файл если bucket существует
        await supabase.storage.from(bucketName).remove([testFileName]);
        console.log(`✅ [BUCKET_CHECK] Bucket ${bucketName} exists and accessible`);
      }
    } else {
      // Удаляем тестовый файл
      await supabase.storage.from(bucketName).remove([testFileName]);
      console.log(`✅ [BUCKET_CHECK] Bucket ${bucketName} exists and accessible`);
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ [BUCKET_ERROR] Error with bucket ${bucketName}:`, error);
    throw new Error(`Ошибка с bucket ${bucketName}: ${error.message}`);
  }
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('Файл не выбран');
  
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

    // Проверяем/создаем bucket
    await ensureBucketExists('banner-images');

    // Генерируем имя файла
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `banner_${timestamp}_${randomId}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    console.log('📁 [BANNER_UPLOAD] Upload details:', { fileName, filePath });

    // Загружаем файл
    const { error: uploadError } = await supabase.storage
      .from('banner-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [BANNER_UPLOAD] Upload error:', uploadError);
      throw new Error(`Ошибка загрузки: ${uploadError.message}`);
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('banner-images')
      .getPublicUrl(filePath);

    console.log('✅ [BANNER_UPLOAD] Upload successful:', publicUrl);

    toast({ title: "Изображение баннера загружено успешно" });
    return publicUrl;
  } catch (error: any) {
    console.error('❌ [BANNER_UPLOAD] Upload failed:', error);
    toast({ 
      title: "Ошибка загрузки", 
      description: error.message || "Неизвестная ошибка",
      variant: "destructive" 
    });
    throw error;
  }
};
