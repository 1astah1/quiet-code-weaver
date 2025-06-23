
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CaseOpeningAnimation from "@/components/CaseOpeningAnimation";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useCases } from "@/hooks/useCases";
import { useOpenCase } from "@/hooks/useOpenCase";
import { useToast } from "@/hooks/use-toast";

interface SkinsScreenProps {
  currentUser: any;
}

const SkinsScreen = ({ currentUser }: SkinsScreenProps) => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  
  const { data: cases, isLoading } = useCases();
  const openCaseMutation = useOpenCase();
  const { toast } = useToast();

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer': return '#b0c3d9';
      case 'industrial': return '#5e98d9';
      case 'mil-spec': return '#4b69ff';
      case 'restricted': return '#8847ff';
      case 'classified': return '#d32ce6';
      case 'covert': return '#eb4b4b';
      case 'contraband': return '#e4ae39';
      default: return '#666666';
    }
  };

  const selectRandomReward = (caseData: any) => {
    if (!caseData.case_rewards || caseData.case_rewards.length === 0) {
      return null;
    }

    const availableRewards = caseData.case_rewards.filter((reward: any) => 
      !reward.never_drop && reward.probability > 0
    );

    if (availableRewards.length === 0) {
      return null;
    }

    // Простой алгоритм выбора на основе вероятности
    const totalProbability = availableRewards.reduce((sum: number, reward: any) => 
      sum + reward.probability, 0
    );

    let random = Math.random() * totalProbability;
    
    for (const reward of availableRewards) {
      random -= reward.probability;
      if (random <= 0) {
        return reward;
      }
    }

    // Fallback на первую награду
    return availableRewards[0];
  };

  const handleOpenCase = async (caseData: any) => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Пользователь не найден",
        variant: "destructive",
      });
      return;
    }

    if (!caseData.is_free && currentUser.coins < caseData.price) {
      toast({
        title: "Недостаточно монет",
        description: `Для открытия этого кейса нужно ${caseData.price} монет`,
        variant: "destructive",
      });
      return;
    }

    const selectedReward = selectRandomReward(caseData);
    if (!selectedReward) {
      toast({
        title: "Ошибка",
        description: "Не удалось определить награду из кейса",
        variant: "destructive",
      });
      return;
    }

    setSelectedCase(caseData);
    setIsAnimationOpen(true);

    try {
      const result = await openCaseMutation.mutateAsync({
        userId: currentUser.id,
        caseId: caseData.id,
        rewardType: selectedReward.reward_type,
        skinId: selectedReward.reward_type === 'skin' ? selectedReward.skin_id : undefined,
        coinRewardId: selectedReward.reward_type === 'coins' ? selectedReward.coin_reward_id : undefined,
        isFree: caseData.is_free
      });

      if (result.success) {
        setWonItem(result.reward);
      }
    } catch (error) {
      setIsAnimationOpen(false);
      setSelectedCase(null);
    }
  };

  const handleAnimationComplete = () => {
    setSelectedCase(null);
    setWonItem(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Загрузка кейсов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Кейсы CS2
        </h1>
        <p className="text-gray-400">
          Открывайте кейсы и получайте редкие скины!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases?.map((caseItem: any) => (
          <Card key={caseItem.id} className="bg-gray-900 border-gray-700 hover:border-orange-500 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  {caseItem.image_url && (
                    <OptimizedImage
                      src={caseItem.image_url}
                      alt={caseItem.name}
                      className="w-full h-full object-contain"
                      fallback={
                        <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">📦</span>
                        </div>
                      }
                    />
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {caseItem.name}
                </h3>

                {caseItem.description && (
                  <p className="text-gray-400 text-sm mb-4">
                    {caseItem.description}
                  </p>
                )}

                <div className="flex justify-center space-x-2 mb-4">
                  {caseItem.is_free && (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      Бесплатно
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    {caseItem.case_type}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-yellow-400">
                    {caseItem.is_free ? 'БЕСПЛАТНО' : `${caseItem.price} монет`}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">
                    Возможные награды:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {caseItem.case_rewards?.slice(0, 5).map((reward: any, index: number) => (
                      <div
                        key={`${reward.id}-${index}`}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: reward.reward_type === 'skin' 
                            ? getRarityColor(reward.skins?.rarity || '') 
                            : '#fbbf24'
                        }}
                      />
                    ))}
                    {caseItem.case_rewards?.length > 5 && (
                      <span className="text-xs text-gray-400">+{caseItem.case_rewards.length - 5}</span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenCase(caseItem)}
                  disabled={(!caseItem.is_free && currentUser?.coins < caseItem.price) || openCaseMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {openCaseMutation.isPending ? (
                    "Открываем..."
                  ) : caseItem.is_free ? (
                    "Открыть бесплатно"
                  ) : (
                    `Открыть за ${caseItem.price} монет`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CaseOpeningAnimation
        isOpen={isAnimationOpen}
        onClose={() => setIsAnimationOpen(false)}
        caseData={selectedCase}
        wonItem={wonItem}
        onOpenComplete={handleAnimationComplete}
      />
    </div>
  );
};

export default SkinsScreen;
