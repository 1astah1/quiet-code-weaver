
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";

export const uploadBannerImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banner-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading banner image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('banner-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error uploading banner image:', error);
    return null;
  }
};
