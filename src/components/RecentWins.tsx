
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import OptimizedImage from "@/components/ui/OptimizedImage";

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
            *,
            skins!inner(
              id,
              name, 
              weapon_type, 
              rarity, 
              image_url,
              price
            )
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

        const enrichedWins = winsData?.map((win, index) => {
          const user = usersData?.find(user => user.id === win.user_id);
          console.log(`🎯 [RECENT_WINS] Processing win ${index + 1}:`, {
            winId: win.id,
            userId: win.user_id,
            foundUser: !!user,
            username: user?.username,
            skinName: win.skins?.name,
            skinImage: win.skins?.image_url
          });
          
          return {
            ...win,
            users: user || null
          };
        }) || [];
        
        const duration = Date.now() - startTime;
        console.log(`✅ [RECENT_WINS] Query completed in ${duration}ms:`, {
          totalWins: enrichedWins.length,
          winsWithUsers: enrichedWins.filter(w => w.users).length,
          winsWithSkins: enrichedWins.filter(w => w.skins).length
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
    },
    onError: (error) => {
      console.error('🚨 [RECENT_WINS] Query error callback:', error);
    },
    onSuccess: (data) => {
      console.log('🎉 [RECENT_WINS] Query success callback:', data?.length || 0, 'wins loaded');
    }
  });

  const getRarityColor = (rarity: string) => {
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
              console.log(`🏆 [RECENT_WINS] Rendering win ${index + 1}:`, {
                id: win.id,
                username: win.users?.username,
                skinName: win.skins?.name,
                hasImage: !!win.skins?.image_url,
                imageUrl: win.skins?.image_url
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
                      {win.skins?.image_url ? (
                        <OptimizedImage
                          src={win.skins.image_url}
                          alt={win.skins.name || t('unknownItem')}
                          className="w-full h-full object-cover rounded-lg border border-gray-600"
                          fallback={
                            <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                              <span className="text-lg">🎯</span>
                            </div>
                          }
                          onError={() => {
                            console.log('🖼️ [RECENT_WINS] Image load failed:', {
                              imageUrl: win.skins?.image_url,
                              skinName: win.skins?.name,
                              winId: win.id
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                          <span className="text-lg">🎯</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getRarityColor(win.skins?.rarity || '')}`}>
                        {win.skins?.name || t('unknownItem')}
                      </p>
                      <p className="text-gray-400 text-xs">{win.skins?.weapon_type || t('item')}</p>
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
