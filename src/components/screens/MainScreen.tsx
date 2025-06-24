import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, TrendingUp, Users, Play, Gift, ArrowRight, Coins } from "lucide-react";
import RecentWins from "@/components/RecentWins";
import ReferralModal from "@/components/ReferralModal";
import BannerCarousel from "@/components/BannerCarousel";
import LazyImage from "@/components/ui/LazyImage";
import { Screen } from "@/components/MainApp";

interface MainScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    referralCode?: string | null;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onScreenChange: (screen: Screen) => void;
}

const MainScreen = ({ currentUser, onCoinsUpdate, onScreenChange }: MainScreenProps) => {
  const [showFreebies, setShowFreebies] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data;
    }
  });

  const { data: favoriteSkins } = useQuery({
    queryKey: ['user-favorites', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          skins!inner(
            id,
            name,
            price,
            image_url,
            rarity
          )
        `)
        .eq('user_id', currentUser.id)
        .limit(3);
      if (error) throw error;
      return data?.map(item => item.skins).filter(Boolean) || [];
    }
  });

  const handleBannerAction = (action: string) => {
    console.log('🎯 [MAIN_SCREEN] Banner action triggered:', action);
    
    switch (action) {
      case 'cases':
        console.log('📦 [MAIN_SCREEN] Navigating to cases (skins screen)');
        onScreenChange('skins');
        break;
      case 'shop':
        console.log('🛍️ [MAIN_SCREEN] Navigating to shop (skins screen)');
        onScreenChange('skins');
        break;
      case 'skins':
        console.log('🎨 [MAIN_SCREEN] Navigating to skins screen');
        onScreenChange('skins');
        break;
      case 'tasks':
        console.log('📋 [MAIN_SCREEN] Navigating to tasks screen');
        onScreenChange('tasks');
        break;
      case 'quiz':
        console.log('🧠 [MAIN_SCREEN] Navigating to quiz screen');
        onScreenChange('quiz');
        break;
      case 'inventory':
        console.log('🎒 [MAIN_SCREEN] Navigating to inventory screen');
        onScreenChange('inventory');
        break;
      default:
        console.warn('⚠️ [MAIN_SCREEN] Unknown banner action:', action);
        // Default to skins screen for unknown actions
        onScreenChange('skins');
        break;
    }
  };

  const handleTaskClick = async (task: any) => {
    try {
      if (task.task_url === '#ad') {
        setShowAdModal(true);
        return;
      } else if (task.task_url && task.task_url.startsWith('http')) {
        window.open(task.task_url, '_blank');
      }
      
      const newCoins = currentUser.coins + task.reward_coins;
      await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);
      onCoinsUpdate(newCoins);
    } catch (error) {
      console.error('Task completion error:', error);
    }
  };

  const handleAdWatch = async () => {
    setTimeout(async () => {
      const newCoins = currentUser.coins + 3;
      await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);
      onCoinsUpdate(newCoins);
      setShowAdModal(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-2 mobile-small:px-3 mobile-medium:px-4 mobile-large:px-4 sm:px-4 md:px-6 pt-2 mobile-small:pt-3 mobile-medium:pt-4 mobile-large:pt-4 sm:pt-4">
      <BannerCarousel onBannerAction={handleBannerAction} />

      {/* Goals Section - адаптированный под все мобильные устройства */}
      <div className="mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-5 sm:mb-6">
        <h3 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl md:text-2xl font-bold text-white mb-2 mobile-small:mb-3 mobile-medium:mb-3 mobile-large:mb-3 sm:mb-4">Твои цели</h3>
        <div className="bg-gray-800/50 rounded-lg p-2 mobile-small:p-3 mobile-medium:p-3 mobile-large:p-4 sm:p-4 md:p-5 border border-orange-500/30">
          {favoriteSkins && favoriteSkins.length > 0 ? (
            <div className="space-y-2 mobile-small:space-y-2 mobile-medium:space-y-3 mobile-large:space-y-3 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-base sm:text-base">Избранные предметы:</h4>
                <button 
                  onClick={() => onScreenChange('skins')}
                  className="text-orange-400 text-xs mobile-small:text-xs mobile-medium:text-sm mobile-large:text-sm sm:text-sm font-medium flex items-center space-x-1"
                >
                  <span>Магазин</span>
                  <ArrowRight className="w-3 h-3 mobile-small:w-3 mobile-medium:w-4 mobile-large:w-4 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 mobile-small:gap-2 mobile-medium:gap-2 mobile-large:gap-3 sm:gap-3">
                {favoriteSkins.slice(0, 3).map((skin: any) => (
                  <div key={skin.id} className="bg-gray-700/50 rounded-lg p-1.5 mobile-small:p-2 mobile-medium:p-2 mobile-large:p-3 sm:p-3 text-center border border-gray-600/30">
                    {skin.image_url ? (
                      <LazyImage 
                        src={skin.image_url} 
                        alt={skin.name}
                        className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2 object-contain"
                        timeout={3000}
                        fallback={
                          <div className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 bg-gray-600 rounded-lg mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2 flex items-center justify-center">
                            <span className="text-sm mobile-small:text-lg mobile-medium:text-xl mobile-large:text-2xl sm:text-2xl">🎯</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 bg-gray-600 rounded-lg mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2 flex items-center justify-center">
                        <span className="text-sm mobile-small:text-lg mobile-medium:text-xl mobile-large:text-2xl sm:text-2xl">🎯</span>
                      </div>
                    )}
                    <p className="text-white text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs font-medium truncate">{skin.name}</p>
                    <div className="flex items-center justify-center space-x-0.5 mobile-small:space-x-0.5 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-1 text-orange-400 text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs font-bold">
                      <Coins className="w-2 h-2 mobile-small:w-2.5 mobile-small:h-2.5 mobile-medium:w-2.5 mobile-medium:h-2.5 mobile-large:w-3 mobile-large:h-3 sm:w-3 sm:h-3" />
                      <span>{skin.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 mobile-small:space-x-2 mobile-medium:space-x-2 mobile-large:space-x-3 sm:space-x-3">
                <Star className="w-4 h-4 mobile-small:w-5 mobile-small:h-5 mobile-medium:w-5 mobile-medium:h-5 mobile-large:w-6 mobile-large:h-6 sm:w-6 sm:h-6 text-yellow-400" />
                <div>
                  <span className="text-white font-medium text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-base sm:text-base">Выбери свою цель</span>
                  <p className="text-slate-400 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm">Добавьте скины в избранное</p>
                </div>
              </div>
              <button 
                onClick={() => onScreenChange('skins')}
                className="text-orange-400 text-xs mobile-small:text-xs mobile-medium:text-sm mobile-large:text-sm sm:text-sm font-medium flex items-center space-x-1 bg-orange-500/10 px-1.5 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-3 sm:px-3 py-1 mobile-small:py-1.5 mobile-medium:py-1.5 mobile-large:py-2 sm:py-2 rounded-lg"
              >
                <span>Магазин</span>
                <ArrowRight className="w-3 h-3 mobile-small:w-3 mobile-medium:w-4 mobile-large:w-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Easy Coins Section - адаптированная сетка для всех устройств */}
      <div className="mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-5 sm:mb-6">
        <h3 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl md:text-2xl font-bold text-white mb-2 mobile-small:mb-3 mobile-medium:mb-3 mobile-large:mb-3 sm:mb-4">Легкие монеты</h3>
        <div className="grid grid-cols-3 gap-1.5 mobile-small:gap-2 mobile-medium:gap-2 mobile-large:gap-3 sm:gap-3">
          <div 
            onClick={() => onScreenChange('quiz')}
            className="bg-gradient-to-b from-blue-600 to-blue-800 rounded-xl p-2 mobile-small:p-2.5 mobile-medium:p-3 mobile-large:p-3 sm:p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2">
              <span className="text-sm mobile-small:text-lg mobile-medium:text-xl mobile-large:text-2xl sm:text-2xl">🧠</span>
            </div>
            <h4 className="text-white font-semibold text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm mb-1">Викторина</h4>
            <div className="flex items-center justify-center space-x-0.5 mobile-small:space-x-0.5 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-1 text-blue-200 text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs">
              <span>+9</span>
              <Coins className="w-2 h-2 mobile-small:w-2.5 mobile-small:h-2.5 mobile-medium:w-2.5 mobile-medium:h-2.5 mobile-large:w-3 mobile-large:h-3 sm:w-3 sm:h-3" />
            </div>
          </div>

          <div 
            onClick={() => setShowAdModal(true)}
            className="bg-gradient-to-b from-green-600 to-green-800 rounded-xl p-2 mobile-small:p-2.5 mobile-medium:p-3 mobile-large:p-3 sm:p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2">
              <Play className="w-3 h-3 mobile-small:w-4 mobile-small:h-4 mobile-medium:w-5 mobile-medium:h-5 mobile-large:w-6 mobile-large:h-6 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm mb-1">Реклама</h4>
            <div className="flex items-center justify-center space-x-0.5 mobile-small:space-x-0.5 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-1 text-green-200 text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs">
              <span>+3</span>
              <Coins className="w-2 h-2 mobile-small:w-2.5 mobile-small:h-2.5 mobile-medium:w-2.5 mobile-medium:h-2.5 mobile-large:w-3 mobile-large:h-3 sm:w-3 sm:h-3" />
            </div>
          </div>

          <div 
            onClick={() => setShowReferral(true)}
            className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl p-2 mobile-small:p-2.5 mobile-medium:p-3 mobile-large:p-3 sm:p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-6 h-6 mobile-small:w-8 mobile-small:h-8 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1 mobile-small:mb-1 mobile-medium:mb-1.5 mobile-large:mb-2 sm:mb-2">
              <Users className="w-3 h-3 mobile-small:w-4 mobile-small:h-4 mobile-medium:w-5 mobile-medium:h-5 mobile-large:w-6 mobile-large:h-6 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm mb-1">Пригласи</h4>
            <div className="flex items-center justify-center space-x-0.5 mobile-small:space-x-0.5 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-1 text-purple-200 text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs">
              <span>+50</span>
              <Coins className="w-2 h-2 mobile-small:w-2.5 mobile-small:h-2.5 mobile-medium:w-2.5 mobile-medium:h-2.5 mobile-large:w-3 mobile-large:h-3 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section - адаптированные задания */}
      <div className="mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-2 mobile-small:mb-3 mobile-medium:mb-3 mobile-large:mb-3 sm:mb-4">
          <h3 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl md:text-2xl font-bold text-white">Задания</h3>
          <button 
            onClick={() => onScreenChange('tasks')}
            className="text-orange-400 text-xs mobile-small:text-xs mobile-medium:text-sm mobile-large:text-sm sm:text-sm font-medium flex items-center space-x-1"
          >
            <span>Все задания</span>
            <ArrowRight className="w-3 h-3 mobile-small:w-3 mobile-medium:w-4 mobile-large:w-4 sm:w-4 sm:h-4" />
          </button>
        </div>
        <div className="space-y-2 mobile-small:space-y-2 mobile-medium:space-y-2 mobile-large:space-y-3 sm:space-y-3">
          {tasks?.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="bg-gray-800/50 rounded-lg p-2 mobile-small:p-3 mobile-medium:p-3 mobile-large:p-3 sm:p-4 md:p-4 border border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {task.image_url && (
                    <div className="w-8 h-8 mobile-small:w-10 mobile-small:h-10 mobile-medium:w-10 mobile-medium:h-10 mobile-large:w-12 mobile-large:h-12 sm:w-12 sm:h-12 mr-2 mobile-small:mr-3 mobile-medium:mr-3 mobile-large:mr-3 sm:mr-4 flex-shrink-0">
                      <LazyImage
                        src={task.image_url}
                        alt={task.title}
                        className="w-full h-full object-cover rounded-lg border border-gray-600/30"
                        timeout={3000}
                        fallback={
                          <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                            <Gift className="w-4 h-4 mobile-small:w-5 mobile-small:h-5 mobile-medium:w-5 mobile-medium:h-5 mobile-large:w-6 mobile-large:h-6 sm:w-6 sm:h-6 text-gray-400" />
                          </div>
                        }
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-sm sm:text-base truncate">{task.title}</h4>
                    <p className="text-gray-400 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm truncate">{task.description}</p>
                  </div>
                </div>
                <div className="text-right ml-1 mobile-small:ml-2 mobile-medium:ml-2 mobile-large:ml-2 sm:ml-2">
                  <div className="flex items-center space-x-0.5 mobile-small:space-x-0.5 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-1 text-orange-400 font-bold">
                    <span className="text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm">+{task.reward_coins}</span>
                    <Coins className="w-2.5 h-2.5 mobile-small:w-3 mobile-small:h-3 mobile-medium:w-3 mobile-medium:h-3 mobile-large:w-4 mobile-large:h-4 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-gray-400 text-[8px] mobile-small:text-[9px] mobile-medium:text-[10px] mobile-large:text-xs sm:text-xs">монет</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecentWins />

      {/* Ad Modal - полностью адаптированный */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 mobile-small:p-3 mobile-medium:p-3 mobile-large:p-4 sm:p-4">
          <div className="bg-gray-900 rounded-xl p-3 mobile-small:p-4 mobile-medium:p-4 mobile-large:p-5 sm:p-6 w-full max-w-xs mobile-small:max-w-sm mobile-medium:max-w-sm mobile-large:max-w-sm sm:max-w-sm border border-orange-500/30">
            <h3 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl font-bold text-white mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-4 sm:mb-6 text-center">Просмотр рекламы</h3>
            <div className="text-center mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-5 sm:mb-6">
              <div className="w-10 h-10 mobile-small:w-12 mobile-small:h-12 mobile-medium:w-14 mobile-medium:h-14 mobile-large:w-16 mobile-large:h-16 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-4 sm:mb-4">
                <Play className="w-5 h-5 mobile-small:w-6 mobile-small:h-6 mobile-medium:w-7 mobile-medium:h-7 mobile-large:w-8 mobile-large:h-8 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-gray-300 mb-2 text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-sm sm:text-base">Посмотрите рекламу и получите</p>
              <div className="flex items-center justify-center space-x-1 mobile-small:space-x-2 mobile-medium:space-x-2 mobile-large:space-x-2 sm:space-x-2 text-yellow-400 font-bold text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl">
                <span>+3</span>
                <Coins className="w-4 h-4 mobile-small:w-5 mobile-small:h-5 mobile-medium:w-5 mobile-medium:h-5 mobile-large:w-6 mobile-large:h-6 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex space-x-1.5 mobile-small:space-x-2 mobile-medium:space-x-2 mobile-large:space-x-3 sm:space-x-3">
              <button
                onClick={handleAdWatch}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 mobile-small:py-2 mobile-medium:py-2.5 mobile-large:py-3 sm:py-3 rounded-lg font-semibold text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-sm sm:text-base"
              >
                Смотреть
              </button>
              <button
                onClick={() => setShowAdModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 mobile-small:py-2 mobile-medium:py-2.5 mobile-large:py-3 sm:py-3 rounded-lg font-semibold text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-sm sm:text-base"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <ReferralModal 
        isOpen={showReferral}
        onClose={() => setShowReferral(false)}
        currentUser={currentUser}
        onCoinsUpdate={onCoinsUpdate}
      />
    </div>
  );
};

export default MainScreen;
