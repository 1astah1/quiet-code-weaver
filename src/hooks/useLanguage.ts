
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLanguage = (userId?: string) => {
  const [currentLanguage, setCurrentLanguage] = useState('ru');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserLanguage();
  }, [userId]);

  const loadUserLanguage = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('language_code')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data?.language_code) {
        setCurrentLanguage(data.language_code);
      }
    } catch (error) {
      console.error('Error loading user language:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (!userId) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('app_language', languageCode);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ language_code: languageCode })
        .eq('id', userId);

      if (error) throw error;

      setCurrentLanguage(languageCode);
      localStorage.setItem('app_language', languageCode);
      
      toast({
        title: "Язык изменен",
        description: "Настройки языка сохранены",
      });
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить язык",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLanguage,
    changeLanguage,
    isLoading
  };
};
