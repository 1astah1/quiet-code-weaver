
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BannerCarousel from "@/components/BannerCarousel";
import RecentWins from "@/components/RecentWins";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import StatCard from "@/components/cards/StatCard";
import { Coins, Trophy, Target, Gift } from "lucide-react";

interface MainScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    isAdmin?: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onScreenChange: (screen: string) => void;
}

const MainScreen = ({ currentUser, onCoinsUpdate, onScreenChange }: MainScreenProps) => {
  // Загружаем статистику пользователя с кешированием
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', currentUser.id],
    queryFn: async () => {
      const [inventory, achievements, goals] = await Promise.all([
        supabase.from('user_inventory').select('*').eq('user_id', currentUser.id).eq('is_sold', false),
        supabase.from('user_achievements').select('*').eq('user_id', currentUser.id),
        supabase.from('user_goals').select('*').eq('user_id', currentUser.id).eq('is_achieved', false)
      ]);

      return {
        skinsCount: inventory.data?.length || 0,
        achievementsCount: achievements.data?.length || 0,
        activeGoalsCount: goals.data?.length || 0
      };
    },
    staleTime: 2 * 60 * 1000, // 2 минуты кеша
  });

  const handleBannerAction = (action: string) => {
    switch (action) {
      case 'cases':
      case 'skins':
        onScreenChange('skins');
        break;
      case 'quiz':
        onScreenChange('quiz');
        break;
      case 'tasks':
        onScreenChange('tasks');
        break;
      default:
        console.log('Banner action:', action);
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header с приветствием */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Привет, {currentUser.username}! 👋
            </h1>
            <p className="text-gray-400">Добро пожаловать в SkinApe</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-yellow-400 text-xl font-bold">
              <Coins className="w-6 h-6" />
              <span>{currentUser.coins.toLocaleString()}</span>
            </div>
            <p className="text-gray-400 text-sm">Монет</p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={<Gift className="w-5 h-5" />}
            label="Скинов"
            value={userStats?.skinsCount || 0}
            color="blue"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Достижений"
            value={userStats?.achievementsCount || 0}
            color="yellow"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Целей"
            value={userStats?.activeGoalsCount || 0}
            color="green"
          />
        </div>
      </div>

      {/* Баннеры */}
      <div className="mb-6">
        <BannerCarousel onBannerAction={handleBannerAction} />
      </div>

      {/* Быстрые действия */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onScreenChange("skins")}
            className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div>Открыть кейс</div>
          </button>
          <button
            onClick={() => onScreenChange("quiz")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-2">🧠</div>
            <div>Викторина</div>
          </button>
        </div>
      </div>

      {/* Секция отзывов/заданий */}
      <ReviewsSection currentUser={currentUser} onCoinsUpdate={onCoinsUpdate} />

      {/* Последние выигрыши */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Последние выигрыши</h2>
        <RecentWins />
      </div>
    </div>
  );
};

export default MainScreen;
