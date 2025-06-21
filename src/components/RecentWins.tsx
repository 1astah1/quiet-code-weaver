
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RecentWins = () => {
  const { data: recentWins, isLoading, error } = useQuery({
    queryKey: ['recent-wins'],
    queryFn: async () => {
      try {
        console.log('Loading recent wins...');
        const { data, error } = await supabase
          .from('recent_wins')
          .select(`
            *,
            users!inner(id, username, auth_id),
            skins(name, weapon_type, rarity)
          `)
          .order('won_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error loading recent wins:', error);
          throw error;
        }
        
        console.log('Recent wins loaded:', data);
        return data || [];
      } catch (error) {
        console.error('Recent wins query error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Consumer': return 'text-gray-400';
      case 'Industrial': return 'text-blue-400';
      case 'Restricted': return 'text-purple-400';
      case 'Classified': return 'text-pink-400';
      case 'Covert': return 'text-red-400';
      case 'Contraband': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getPlayerAvatar = async (authId: string) => {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(authId);
      return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    } catch (error) {
      console.error('Error getting user avatar:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Последние выигрыши</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
          <p className="text-gray-400 text-center py-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Recent wins error:', error);
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Последние выигрыши</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
          <p className="text-red-400 text-center py-4">Ошибка загрузки выигрышей</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-4">Последние выигрыши</h3>
      <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20 max-h-60 overflow-y-auto">
        {recentWins && recentWins.length > 0 ? (
          <div className="space-y-2">
            {recentWins.map((win) => (
              <div key={win.id} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {win.users?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {win.users?.username || 'Игрок'}
                    </p>
                    <p className="text-gray-400 text-xs">выиграл</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getRarityColor(win.skins?.rarity || '')}`}>
                    {win.skins?.name || 'Неизвестный предмет'}
                  </p>
                  <p className="text-gray-400 text-xs">{win.skins?.weapon_type || 'Предмет'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">Пока никто ничего не выиграл</p>
        )}
      </div>
    </div>
  );
};

export default RecentWins;
