
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Coins, Package, TrendingUp } from "lucide-react";
import { useState } from "react";

interface RankingsTabProps {
  currentUser?: {
    id: string;
    username: string;
  };
}

const RankingsTab = ({ currentUser }: RankingsTabProps) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'expensive' | 'inventory'>('cases');

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['user-rankings', activeTab],
    queryFn: async () => {
      let orderBy = 'total_cases_opened';
      
      if (activeTab === 'expensive') {
        orderBy = 'most_expensive_skin_value';
      } else if (activeTab === 'inventory') {
        orderBy = 'total_inventory_value';
      }

      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading rankings:', error);
        return [];
      }
      
      return data || [];
    }
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border-amber-600/30';
    return 'bg-slate-800/50 border-slate-700/50';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getValue = (user: any) => {
    switch (activeTab) {
      case 'cases':
        return user.total_cases_opened || 0;
      case 'expensive':
        return user.most_expensive_skin_value || 0;
      case 'inventory':
        return user.total_inventory_value || 0;
      default:
        return 0;
    }
  };

  const getValueLabel = (user: any) => {
    switch (activeTab) {
      case 'cases':
        return `${user.total_cases_opened || 0} кейсов`;
      case 'expensive':
        return `${formatNumber(user.most_expensive_skin_value || 0)} 💰`;
      case 'inventory':
        return `${formatNumber(user.total_inventory_value || 0)} 💰`;
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">Загрузка рейтингов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Рейтинги игроков</h1>
        <p className="text-gray-400">Топ игроков по различным категориям</p>
      </div>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'cases'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-gray-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Кейсы
        </button>
        <button
          onClick={() => setActiveTab('expensive')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'expensive'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Дорогие скины
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-gray-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          Инвентарь
        </button>
      </div>

      {/* Список рейтингов */}
      <div className="space-y-3">
        {rankings.length > 0 ? (
          rankings.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUser?.id === user.id;
            const value = getValue(user);
            
            if (value === 0 && activeTab !== 'cases') return null;

            return (
              <div
                key={user.id}
                className={`p-4 rounded-lg border transition-all ${getRankBg(rank)} ${
                  isCurrentUser ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getRankIcon(rank)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isCurrentUser ? 'text-orange-400' : 'text-white'}`}>
                          {user.username}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-xs bg-orange-500 px-2 py-1 rounded-full text-white">
                            Вы
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {getValueLabel(user)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {formatNumber(value)}
                    </div>
                    {activeTab === 'inventory' && user.total_items_count > 0 && (
                      <div className="text-gray-400 text-sm">
                        {user.total_items_count} предметов
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Пока нет данных</h3>
            <p className="text-gray-400">Рейтинги появятся после активности игроков</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsTab;
