
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, TrendingUp, Users, Play, Gift, ArrowRight, Coins } from "lucide-react";
import RecentWins from "@/components/RecentWins";
import ReferralModal from "@/components/ReferralModal";
import BannerCarousel from "@/components/BannerCarousel";
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
  
  // Fetch tasks
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

  // Fetch user's favorite skins (updated query)
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
    switch (action) {
      case 'shop':
        onScreenChange('skins');
        break;
      case 'cases':
        onScreenChange('skins');
        break;
      case 'tasks':
        onScreenChange('tasks');
        break;
      case 'quiz':
        onScreenChange('quiz');
        break;
      default:
        onScreenChange('skins');
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
      
      // Award coins for task completion
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
    // Simulate ad watching
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
    <div className="min-h-screen pb-20 px-4 pt-4">
      {/* Banner Carousel - now with swipe only */}
      <BannerCarousel onBannerAction={handleBannerAction} />

      {/* Goals Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-3">Твои цели</h3>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/30">
          {favoriteSkins && favoriteSkins.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">Избранные предметы:</h4>
                <button 
                  onClick={() => onScreenChange('skins')}
                  className="text-orange-400 text-sm font-medium flex items-center space-x-1"
                >
                  <span>Магазин</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {favoriteSkins.slice(0, 3).map((skin: any) => (
                  <div key={skin.id} className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600/30">
                    {skin.image_url ? (
                      <img 
                        src={skin.image_url} 
                        alt={skin.name}
                        className="w-12 h-12 mx-auto mb-2 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                    )}
                    <p className="text-white text-xs font-medium truncate">{skin.name}</p>
                    <div className="flex items-center justify-center space-x-1 text-orange-400 text-xs font-bold">
                      <Coins className="w-3 h-3" />
                      <span>{skin.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Star className="w-6 h-6 text-yellow-400" />
                <div>
                  <span className="text-white font-medium">Выбери свою цель</span>
                  <p className="text-slate-400 text-sm">Добавьте скины в избранное</p>
                </div>
              </div>
              <button 
                onClick={() => onScreenChange('skins')}
                className="text-orange-400 text-sm font-medium flex items-center space-x-1 bg-orange-500/10 px-3 py-2 rounded-lg"
              >
                <span>Магазин</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Easy Coins Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Легкие монеты</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Quiz */}
          <div 
            onClick={() => onScreenChange('quiz')}
            className="bg-gradient-to-b from-blue-600 to-blue-800 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              🧠
            </div>
            <h4 className="text-white font-semibold text-sm mb-1">Викторина</h4>
            <div className="flex items-center justify-center space-x-1 text-blue-200 text-xs">
              <span>+9</span>
              <Coins className="w-3 h-3" />
            </div>
          </div>

          {/* Watch Ad */}
          <div 
            onClick={() => setShowAdModal(true)}
            className="bg-gradient-to-b from-green-600 to-green-800 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold text-sm mb-1">Реклама</h4>
            <div className="flex items-center justify-center space-x-1 text-green-200 text-xs">
              <span>+3</span>
              <Coins className="w-3 h-3" />
            </div>
          </div>

          {/* Invite Friends */}
          <div 
            onClick={() => setShowReferral(true)}
            className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold text-sm mb-1">Пригласи</h4>
            <div className="flex items-center justify-center space-x-1 text-purple-200 text-xs">
              <span>+50</span>
              <Coins className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Задания</h3>
          <button 
            onClick={() => onScreenChange('tasks')}
            className="text-orange-400 text-sm font-medium flex items-center space-x-1"
          >
            <span>Все задания</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {tasks?.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{task.title}</h4>
                  <p className="text-gray-400 text-sm">{task.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-orange-400 font-bold">
                    <span>+{task.reward_coins}</span>
                    <Coins className="w-4 h-4" />
                  </div>
                  <p className="text-gray-400 text-xs">монет</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Wins */}
      <RecentWins />

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-orange-500/30">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Просмотр рекламы</h3>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-300 mb-2">Посмотрите рекламу и получите</p>
              <div className="flex items-center justify-center space-x-2 text-yellow-400 font-bold text-xl">
                <span>+3</span>
                <Coins className="w-6 h-6" />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAdWatch}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
              >
                Смотреть
              </button>
              <button
                onClick={() => setShowAdModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
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
