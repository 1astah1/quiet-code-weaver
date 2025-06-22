
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Coins, TrendingUp, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  id: string;
  username: string;
  total_cases_opened: number;
  total_spent: number;
  most_expensive_skin_value: number;
  total_earned: number;
  items_sold: number;
  items_in_inventory: number;
  rank: number;
}

const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState("earnings");

  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      console.log('Загрузка лидерборда...');
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_earned', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        throw error;
      }
      
      console.log('Лидерборд загружен:', data);
      return data as LeaderboardEntry[] || [];
    },
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-6 h-6 text-gray-600" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Лидерборд
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">Загрузка лидерборда...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Лидерборд
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="text-red-500">Ошибка загрузки лидерборда</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topEarners = leaderboardData?.slice(0, 10) || [];
  const topSpenders = [...(leaderboardData || [])].sort((a, b) => b.total_spent - a.total_spent).slice(0, 10);
  const topCaseOpeners = [...(leaderboardData || [])].sort((a, b) => b.total_cases_opened - a.total_cases_opened).slice(0, 10);

  const renderLeaderboardList = (data: LeaderboardEntry[], sortKey: keyof LeaderboardEntry) => (
    <div className="space-y-3">
      {data.map((player, index) => (
        <Card key={player.id} className={`transition-all duration-200 hover:shadow-md ${
          index < 3 ? 'border-l-4 border-l-yellow-500' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRankIcon(index + 1)}
                  <Badge className={getRankBadgeColor(index + 1)}>
                    #{index + 1}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{player.username}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {formatNumber(player.total_earned)} заработано
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {player.total_cases_opened} кейсов
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(player[sortKey] as number)}
                </div>
                <div className="text-sm text-gray-500">
                  {sortKey === 'total_earned' && 'монет заработано'}
                  {sortKey === 'total_spent' && 'монет потрачено'}
                  {sortKey === 'total_cases_opened' && 'кейсов открыто'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Лидерборд
          </CardTitle>
          <CardDescription>
            Топ игроков по различным достижениям
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Заработок
              </TabsTrigger>
              <TabsTrigger value="spending" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Трата
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Кейсы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earnings" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Топ по заработку</h3>
                <p className="text-gray-600 text-sm">Игроки, заработавшие больше всего монет от продажи скинов</p>
              </div>
              {renderLeaderboardList(topEarners, 'total_earned')}
            </TabsContent>

            <TabsContent value="spending" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Топ по тратам</h3>
                <p className="text-gray-600 text-sm">Игроки, потратившие больше всего монет на кейсы</p>
              </div>
              {renderLeaderboardList(topSpenders, 'total_spent')}
            </TabsContent>

            <TabsContent value="cases" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Топ по кейсам</h3>
                <p className="text-gray-600 text-sm">Игроки, открывшие больше всего кейсов</p>
              </div>
              {renderLeaderboardList(topCaseOpeners, 'total_cases_opened')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardScreen;
