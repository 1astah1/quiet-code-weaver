import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface RewardData {
  name: string;
  rarity: string;
  price: number;
  image_url?: string;
}

interface RecentWin {
  id: string;
  won_at: string;
  reward_data: RewardData | null;
  users: {
    username: string;
  } | null;
}

const RecentWins = () => {
  // Type guard function to safely check if data is RewardData
  const isValidRewardData = (data: any): data is RewardData => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.name === 'string' &&
      typeof data.rarity === 'string' &&
      typeof data.price === 'number'
    );
  };

  const { data: recentWins = [], isLoading, error } = useQuery({
    queryKey: ['recent-wins'],
    queryFn: async () => {
      console.log('🏆 [RECENT_WINS] Loading recent wins...');
      
      try {
        const { data, error } = await supabase
          .from('recent_wins')
          .select(`
            id,
            won_at,
            reward_data,
            users!inner (
              username
            )
          `)
          .not('reward_data', 'is', null)
          .order('won_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ [RECENT_WINS] Error loading recent wins:', error);
          throw new Error(`Failed to load recent wins: ${error.message}`);
        }

        console.log('✅ [RECENT_WINS] Loaded wins:', data?.length || 0);
        
        // Фильтруем записи с корректными данными
        const validWins = (data || []).filter(win => {
          if (!win.reward_data || !win.users?.username) return false;
          
          // Используем type guard для безопасной проверки
          return isValidRewardData(win.reward_data);
        }).map(win => ({
          ...win,
          reward_data: win.reward_data as unknown as RewardData
        }));

        console.log('✅ [RECENT_WINS] Valid wins after filtering:', validWins.length);
        return validWins as RecentWin[];
      } catch (error) {
        console.error('💥 [RECENT_WINS] Unexpected error:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2
  });

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'from-gray-500 to-gray-600';
    
    const colors = {
      'Covert': 'from-orange-500 to-red-500',
      'Classified': 'from-red-500 to-pink-500', 
      'Restricted': 'from-purple-500 to-pink-500',
      'Mil-Spec': 'from-blue-500 to-purple-500',
      'Industrial Grade': 'from-blue-400 to-blue-600',
      'Consumer Grade': 'from-gray-500 to-gray-600',
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'только что';
      if (diffMins < 60) return `${diffMins} мин назад`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ч назад`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} д назад`;
    } catch {
      return 'недавно';
    }
  };

  if (error) {
    console.error('🚨 [RECENT_WINS] Component error:', error);
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Последние выигрыши
        </h2>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-400">Ошибка загрузки выигрышей</p>
          <p className="text-slate-500 text-sm mt-1">Попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Последние выигрыши
        </h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-slate-700 rounded mb-1"></div>
                <div className="w-24 h-3 bg-slate-700 rounded"></div>
              </div>
              <div className="w-16 h-4 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentWins.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Последние выигрыши
        </h2>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-slate-400">Пока нет выигрышей</p>
          <p className="text-slate-500 text-sm mt-1">Открывайте кейсы и станьте первым!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
        <span className="mr-2">🏆</span>
        Последние выигрыши
      </h2>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {recentWins.map((win) => {
          const rewardData = win.reward_data;
          
          if (!rewardData) {
            console.warn('🚨 [RECENT_WINS] Invalid reward data for win:', win.id);
            return null;
          }
          
          return (
            <div key={win.id} className="flex items-center space-x-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityColor(rewardData.rarity)} p-0.5 flex-shrink-0`}>
                <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                  <OptimizedImage
                    src={rewardData.image_url}
                    alt={rewardData.name}
                    className="w-full h-full object-cover"
                    timeout={5000}
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        🎁
                      </div>
                    }
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-slate-300 font-medium text-sm truncate">
                    {win.users?.username || 'Игрок'}
                  </span>
                  <span className="text-green-400 text-xs">выиграл</span>
                </div>
                <p className="text-white font-medium text-sm truncate">
                  {rewardData.name}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="text-yellow-400 font-bold text-sm">
                  {rewardData.price || 0}₽
                </div>
                <div className="text-slate-500 text-xs">
                  {formatTimeAgo(win.won_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentWins;
