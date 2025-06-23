
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import LazyImage from "@/components/ui/LazyImage";

interface RecentWinsProps {
  currentLanguage?: string;
}

const RecentWins = ({ currentLanguage = 'ru' }: RecentWinsProps) => {
  const { t } = useTranslation(currentLanguage);

  const { data: recentWins, isLoading, error } = useQuery({
    queryKey: ['recent-wins'],
    queryFn: async () => {
      try {
        console.log('🏆 [RECENT_WINS] Starting recent wins query...');
        const startTime = Date.now();
        
        console.log('📡 [RECENT_WINS] Fetching wins data...');
        const { data: winsData, error: winsError } = await supabase
          .from('recent_wins')
          .select(`
            *
          `)
          .order('won_at', { ascending: false })
          .limit(10);
        
        if (winsError) {
          console.error('❌ [RECENT_WINS] Error loading wins:', winsError);
          throw winsError;
        }

        console.log('📊 [RECENT_WINS] Wins data loaded:', {
          count: winsData?.length || 0,
          firstWin: winsData?.[0] || null
        });

        const userIds = winsData?.map(win => win.user_id).filter(Boolean) || [];
        console.log('👥 [RECENT_WINS] User IDs to fetch:', userIds.length);
        
        console.log('📡 [RECENT_WINS] Fetching users data...');
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ [RECENT_WINS] Error loading users:', usersError);
        } else {
          console.log('📊 [RECENT_WINS] Users data loaded:', {
            count: usersData?.length || 0,
            users: usersData?.map(u => ({ id: u.id, username: u.username })) || []
          });
        }

        // Обогащаем данные о победах информацией о пользователях
        const enrichedWins = winsData?.map((win, index) => {
          const user = usersData?.find(user => user.id === win.user_id);
          console.log(`🎯 [RECENT_WINS] Processing win ${index + 1}:`, {
            winId: win.id,
            userId: win.user_id,
            foundUser: !!user,
            username: user?.username,
            rewardType: win.reward_type,
            rewardData: win.reward_data
          });
          
          return {
            ...win,
            users: user || null
          };
        }) || [];
        
        const duration = Date.now() - startTime;
        console.log(`✅ [RECENT_WINS] Query completed in ${duration}ms:`, {
          totalWins: enrichedWins.length,
          winsWithUsers: enrichedWins.filter(w => w.users).length
        });
        
        return enrichedWins;
      } catch (error) {
        console.error('💥 [RECENT_WINS] Unexpected error:', error);
        console.error('💥 [RECENT_WINS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log(`🔄 [RECENT_WINS] Retry attempt ${failureCount}:`, error);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`⏰ [RECENT_WINS] Retry delay: ${delay}ms`);
      return delay;
    }
  });

  // Обрабатываем ошибки отдельно
  if (error) {
    console.error('🚨 [RECENT_WINS] Query error:', error);
  }

  // Обрабатываем успешные запросы отдельно
  if (recentWins) {
    console.log('🎉 [RECENT_WINS] Query success:', recentWins?.length || 0, 'wins loaded');
  }

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'text-gray-400';
    
    const color = (() => {
      switch (rarity) {
        case 'Consumer': return 'text-gray-400';
        case 'Industrial': return 'text-blue-400';
        case 'Restricted': return 'text-purple-400';
        case 'Classified': return 'text-pink-400';
        case 'Covert': return 'text-red-400';
        case 'Contraband': return 'text-yellow-400';
        default: return 'text-gray-400';
      }
    })();
    
    console.log('🎨 [RECENT_WINS] Rarity color for', rarity, ':', color);
    return color;
  };

  const getWinDisplayData = (win: any) => {
    if (win.reward_type === 'coins') {
      return {
        name: `${win.reward_data?.amount || 0} монет`,
        image: null,
        rarity: 'coin',
        weapon_type: 'Монеты'
      };
    } else if (win.reward_type === 'skin' && win.reward_data) {
      return {
        name: win.reward_data.name || 'Неизвестный скин',
        image: win.reward_data.image_url,
        rarity: win.reward_data.rarity,
        weapon_type: win.reward_data.weapon_type || 'Предмет'
      };
    } else {
      return {
        name: 'Неизвестная награда',
        image: null,
        rarity: 'unknown',
        weapon_type: 'Предмет'
      };
    }
  };

  if (isLoading) {
    console.log('⏳ [RECENT_WINS] Rendering loading state');
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
    console.error('💥 [RECENT_WINS] Rendering error state:', error);
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">{t('recentWins')}</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20">
          <p className="text-red-400 text-center py-4">{t('errorLoadingWins')}</p>
        </div>
      </div>
    );
  }

  console.log('🎨 [RECENT_WINS] Rendering wins list:', {
    hasWins: !!(recentWins && recentWins.length > 0),
    winsCount: recentWins?.length || 0
  });

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-4">{t('recentWins')}</h3>
      <div className="bg-gray-800/30 rounded-lg p-4 border border-orange-500/20 max-h-60 overflow-y-auto">
        {recentWins && recentWins.length > 0 ? (
          <div className="space-y-2">
            {recentWins.map((win, index) => {
              const displayData = getWinDisplayData(win);
              
              console.log(`🏆 [RECENT_WINS] Rendering win ${index + 1}:`, {
                id: win.id,
                username: win.users?.username,
                rewardType: win.reward_type,
                displayName: displayData.name,
                hasImage: !!displayData.image
              });
              
              return (
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
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 flex-shrink-0">
                      {displayData.image ? (
                        <LazyImage
                          src={displayData.image}
                          alt={displayData.name}
                          className="w-full h-full object-cover rounded-lg border border-gray-600"
                          timeout={3000}
                          priority={index < 3}
                          fallback={
                            <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                              <span className="text-lg">
                                {win.reward_type === 'coins' ? '🪙' : '🎯'}
                              </span>
                            </div>
                          }
                          onError={() => {
                            console.log('🖼️ [RECENT_WINS] Image load failed:', {
                              imageUrl: displayData.image,
                              rewardName: displayData.name,
                              winId: win.id
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                          <span className="text-lg">
                            {win.reward_type === 'coins' ? '🪙' : '🎯'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${win.reward_type === 'coins' ? 'text-yellow-400' : getRarityColor(displayData.rarity)}`}>
                        {displayData.name}
                      </p>
                      <p className="text-gray-400 text-xs">{displayData.weapon_type}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">{t('noWinsYet')}</p>
        )}
      </div>
    </div>
  );
};

export default RecentWins;
