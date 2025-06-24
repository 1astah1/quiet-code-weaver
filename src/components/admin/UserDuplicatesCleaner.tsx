
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const UserDuplicatesCleaner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const { toast } = useToast();

  const findDuplicates = async () => {
    setIsLoading(true);
    try {
      // Find users with same email or username
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by email and username to find duplicates
      const emailGroups: { [key: string]: any[] } = {};
      const usernameGroups: { [key: string]: any[] } = {};

      users?.forEach(user => {
        if (user.email) {
          if (!emailGroups[user.email]) emailGroups[user.email] = [];
          emailGroups[user.email].push(user);
        }
        if (user.username) {
          if (!usernameGroups[user.username]) usernameGroups[user.username] = [];
          usernameGroups[user.username].push(user);
        }
      });

      const duplicateUsers: any[] = [];
      
      // Find email duplicates
      Object.values(emailGroups).forEach(group => {
        if (group.length > 1) {
          duplicateUsers.push(...group.slice(1)); // Keep first, mark others as duplicates
        }
      });

      // Find username duplicates (avoid double counting)
      Object.values(usernameGroups).forEach(group => {
        if (group.length > 1) {
          group.slice(1).forEach(user => {
            if (!duplicateUsers.find(dup => dup.id === user.id)) {
              duplicateUsers.push(user);
            }
          });
        }
      });

      setDuplicates(duplicateUsers);
      toast({
        title: "Поиск завершен",
        description: `Найдено ${duplicateUsers.length} дублирующихся пользователей`,
      });

    } catch (error) {
      console.error('Error finding duplicates:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось найти дубликаты",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (duplicates.length === 0) return;

    setIsLoading(true);
    try {
      // Delete duplicate users
      for (const duplicate of duplicates) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', duplicate.id);
        
        if (error) {
          console.error(`Error deleting user ${duplicate.id}:`, error);
        }
      }

      toast({
        title: "Очистка завершена",
        description: `Удалено ${duplicates.length} дублирующихся пользователей`,
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
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Очистка дублирующихся пользователей</h3>
      
      <div className="space-y-4">
        <Button 
          onClick={findDuplicates}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Поиск..." : "Найти дубликаты"}
        </Button>

        {duplicates.length > 0 && (
          <>
            <div className="text-white">
              <p>Найдено дублирующихся пользователей: {duplicates.length}</p>
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                {duplicates.map(user => (
                  <div key={user.id} className="text-sm text-gray-300 bg-slate-700 p-2 rounded">
                    {user.username} ({user.email}) - {user.created_at}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={cleanupDuplicates}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? "Удаление..." : "Удалить дубликаты"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDuplicatesCleaner;
