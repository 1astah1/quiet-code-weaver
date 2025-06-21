import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface RecentWinsProps {
  currentLanguage?: string;
}

const RecentWins = ({ currentLanguage = 'ru' }: RecentWinsProps) => {
  const { t } = useTranslation(currentLanguage);

  const { data: recentWins, isLoading, error } = useQuery({
    queryKey: ['recent-wins'],
    queryFn: async () => {
      try {
        console.log('Loading recent wins...');
        // Получаем последние выигрыши с данными скинов
        const { data: winsData, error: winsError } = await supabase
          .from('recent_wins')
          .select(`
            *,
            skins(name, weapon_type, rarity)
          `)
          .order('won_at', { ascending: false })
          .limit(10);
        
        if (winsError) {
          console.error('Error loading recent wins:', winsError);
          throw winsError;
        }

        console.log('Wins data loaded:', winsData);

        // Отдельно получаем информацию о пользователях
        const userIds = winsData?.map(win => win.user_id).filter(Boolean) || [];
        console.log('User IDs to fetch:', userIds);
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .in('id', userIds);

        if (usersError) {
          console.error('Error loading users:', usersError);
          // Если не удалось загрузить пользователей, продолжаем без них
        } else {
          console.log('Users data loaded:', usersData);
        }

        // Объединяем данные
        const enrichedWins = winsData?.map(win => {
          const user = usersData?.find(user => user.id === win.user_id);
          console.log(`Win for user ${win.user_id}: found user:`, user);
          return {
            ...win,
            users: user || null
          };
        }) || [];
        
        console.log('Recent wins loaded:', enrichedWins);
        return enrichedWins;
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

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">{t('recentWins')}</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
          <p className="text-gray-400 text-center py-4">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Recent wins error:', error);
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">{t('recentWins')}</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
          <p className="text-red-400 text-center py-4">{t('errorLoadingWins')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-4">{t('recentWins')}</h3>
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
                      {win.users?.username || t('player')}
                    </p>
                    <p className="text-gray-400 text-xs">{t('won')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getRarityColor(win.skins?.rarity || '')}`}>
                    {win.skins?.name || t('unknownItem')}
                  </p>
                  <p className="text-gray-400 text-xs">{win.skins?.weapon_type || t('item')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">{t('noWinsYet')}</p>
        )}
      </div>
    </div>
  );
};

export default RecentWins;
