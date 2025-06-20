
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserCog, Mail } from "lucide-react";

const AdminUsersPanel = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, is_admin, coins, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('email', email);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Администратор добавлен",
        description: "Пользователь получил права администратора",
      });
      setNewAdminEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить администратора",
        variant: "destructive",
      });
    }
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Права отозваны",
        description: "Пользователь больше не администратор",
      });
    }
  });

  if (isLoading) {
    return <div className="text-white">Загрузка пользователей...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Управление пользователями</h2>
      
      {/* Добавление нового админа */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Добавить администратора</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Email пользователя"
            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-orange-500"
          />
          <button
            onClick={() => addAdminMutation.mutate(newAdminEmail)}
            disabled={!newAdminEmail || addAdminMutation.isPending}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="space-y-3">
        {users?.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-600 rounded-full">
                {user.is_admin ? (
                  <UserCog className="w-5 h-5 text-orange-400" />
                ) : (
                  <Mail className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="text-white font-medium">{user.username}</div>
                <div className="text-gray-400 text-sm">{user.email}</div>
                <div className="text-yellow-400 text-xs">{user.coins?.toLocaleString()} монет</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {user.is_admin && (
                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">Админ</span>
              )}
              
              {user.is_admin ? (
                <button
                  onClick={() => removeAdminMutation.mutate(user.id)}
                  disabled={removeAdminMutation.isPending}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                >
                  Убрать права
                </button>
              ) : (
                <button
                  onClick={() => addAdminMutation.mutate(user.email)}
                  disabled={addAdminMutation.isPending}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                >
                  Сделать админом
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPanel;
