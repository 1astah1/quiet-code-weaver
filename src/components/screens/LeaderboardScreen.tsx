
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Crown } from "lucide-react";

const LeaderboardScreen = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .order('total_inventory_value', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-slate-400 font-bold">#{position}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pt-6">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Загрузка рейтинга...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pt-6 pb-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Рейтинг игроков</h1>
          <p className="text-slate-400">Топ по стоимости инвентаря</p>
        </div>

        <div className="space-y-3">
          {leaderboard?.map((player, index) => (
            <div
              key={player.id}
              className={`bg-slate-800/50 rounded-lg p-4 border ${
                index < 3 
                  ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent' 
                  : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">{player.username}</h3>
                      {index < 3 && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-slate-400 text-sm">
                      {player.total_items_count} предметов
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-orange-400 font-bold">
                    {player.total_inventory_value.toLocaleString()} ₽
                  </div>
                  <div className="text-slate-400 text-sm">
                    {player.total_cases_opened} кейсов
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!leaderboard || leaderboard.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Рейтинг пуст</h3>
            <p className="text-slate-400">Станьте первым в рейтинге!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
