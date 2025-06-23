import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UserDuplicatesCleaner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const { toast } = useToast();

  const findDuplicates = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('username, email, COUNT(*)')
        .group('username, email')
        .having('COUNT(*) > 1');

      if (error) throw error;
      setDuplicates(data || []);
      
      toast({
        title: "Поиск завершен",
        description: `Найдено ${data?.length || 0} групп дубликатов`,
      });
    } catch (error) {
      console.error('Error finding duplicates:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось найти дубликаты пользователей",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    try {
      setIsLoading(true);
      
      // Simple cleanup logic - remove duplicates keeping the oldest one
      for (const duplicate of duplicates) {
        const { data: users, error } = await supabase
          .from('users')
          .select('id, created_at')
          .eq('username', duplicate.username)
          .eq('email', duplicate.email)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Keep the first (oldest) user, delete the rest
        const usersToDelete = users?.slice(1) || [];
        
        for (const user of usersToDelete) {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
            
          if (deleteError) throw deleteError;
        }
      }
      
      toast({
        title: "Очистка завершена",
        description: "Дубликаты пользователей удалены",
      });
      
      setDuplicates([]);
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить дубликаты",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={findDuplicates}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? "Поиск..." : "Найти дубликаты"}
        </Button>
        
        {duplicates.length > 0 && (
          <Button 
            onClick={cleanupDuplicates}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? "Очистка..." : `Удалить ${duplicates.length} дубликатов`}
          </Button>
        )}
      </div>
      
      {duplicates.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Внимание!</strong> Найдено {duplicates.length} групп дубликатов пользователей.
        </div>
      )}
    </div>
  );
};

export default UserDuplicatesCleaner;
