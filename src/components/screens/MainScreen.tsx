
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RecentWins from "@/components/RecentWins";
import CaseCard from "@/components/skins/CaseCard";
import BannerCarousel from "@/components/BannerCarousel";
import FreeCaseTimer from "@/components/FreeCaseTimer";
import { useBannerNavigation } from "@/components/enhanced/BannerNavigationHandler";

interface MainScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onNavigate: (section: string) => void;
}

const MainScreen = ({ currentUser, onCoinsUpdate, onNavigate }: MainScreenProps) => {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const { handleBannerAction } = useBannerNavigation({ onNavigate });

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      console.log('📦 Loading cases...');
      
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          case_skins!inner (
            skins (
              rarity
            )
          )
        `)
        .order('id');
      
      if (error) {
        console.error('❌ Error loading cases:', error);
        throw error;
      }
      
      console.log('✅ Cases loaded:', data.length);
      return data;
    }
  });

  const filteredCases = useMemo(() => {
    if (!cases || selectedRarity === 'all') return cases || [];
    
    return cases.filter(caseItem => 
      caseItem.case_skins?.some((caseSkin: any) => 
        caseSkin.skins?.rarity === selectedRarity
      )
    );
  }, [cases, selectedRarity]);

  const rarities = useMemo(() => {
    if (!cases) return [];
    
    const allRarities = new Set<string>();
    cases.forEach(caseItem => {
      caseItem.case_skins?.forEach((caseSkin: any) => {
        if (caseSkin.skins?.rarity) {
          allRarities.add(caseSkin.skins.rarity);
        }
      });
    });
    
    return Array.from(allRarities);
  }, [cases]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-800 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      {/* Banner Carousel with Navigation */}
      <div className="mb-6">
        <BannerCarousel onBannerAction={handleBannerAction} />
      </div>

      {/* Free Case Timer */}
      <div className="mb-6">
        <FreeCaseTimer currentUser={currentUser} />
      </div>

      {/* Filter Buttons */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedRarity('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedRarity === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Все кейсы
          </button>
          {rarities.map(rarity => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedRarity === rarity
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {filteredCases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            case={caseItem}
            currentUser={currentUser}
            onCoinsUpdate={onCoinsUpdate}
          />
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl text-white mb-2">Кейсы не найдены</h3>
          <p className="text-gray-400">Попробуйте выбрать другую редкость</p>
        </div>
      )}

      {/* Recent Wins */}
      <div className="mt-8">
        <RecentWins />
      </div>
    </div>
  );
};

export default MainScreen;
