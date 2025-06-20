
import { useState } from "react";
import { useCases, useCaseSkins, useUserFavorites, useToggleFavorite, useOpenCase } from "@/hooks/useCases";
import CaseOpeningSimulation from "@/components/CaseOpeningSimulation";
import CaseCard from "./CaseCard";
import CasePreviewModal from "./CasePreviewModal";
import { Loader2, Package, Sparkles } from "lucide-react";

interface CasesTabProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CasesTab = ({ currentUser, onCoinsUpdate }: CasesTabProps) => {
  const [openingCase, setOpeningCase] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  // API Hooks
  const { data: cases, isLoading: casesLoading } = useCases();
  const { data: favorites = [] } = useUserFavorites(currentUser.id);
  const { data: caseSkins = [] } = useCaseSkins(selectedCase?.id);
  const toggleFavoriteMutation = useToggleFavorite();
  const openCaseMutation = useOpenCase();

  const handleOpenCase = async (caseItem: any) => {
    if (caseItem.is_free) {
      // Для бесплатных кейсов показываем опцию рекламы
      const watchAd = confirm("Этот кейс можно открыть бесплатно за просмотр рекламы. Смотреть рекламу?");
      if (watchAd) {
        // Симуляция просмотра рекламы
        setTimeout(() => {
          setOpeningCase({ ...caseItem, isAdWatched: true });
        }, 2000);
        return;
      }
    }
    
    if (!caseItem.is_free && caseItem.price > currentUser.coins) {
      return; // Кнопка уже заблокирована, но на всякий случай
    }

    setOpeningCase(caseItem);
  };

  const handleCaseOpened = (result: any) => {
    onCoinsUpdate(result.newCoins);
    setOpeningCase(null);
  };

  const handleToggleFavorite = (caseId: string) => {
    const isFavorite = favorites.includes(caseId);
    toggleFavoriteMutation.mutate({
      userId: currentUser.id,
      caseId,
      isFavorite
    });
  };

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
            <div className="absolute inset-0 w-12 h-12 bg-orange-500/20 rounded-full animate-ping mx-auto" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">Загрузка кейсов</p>
            <p className="text-slate-400 text-sm">Подготавливаем лучшие предложения...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="space-y-6">
          <div className="relative">
            <Package className="w-20 h-20 text-slate-400 mx-auto" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-xl font-semibold">Кейсы не найдены</p>
            <p className="text-slate-400">Скоро здесь появятся новые кейсы</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center py-8 space-y-4">
        <div className="relative inline-block">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            Коллекция кейсов
          </h2>
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000" />
        </div>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Открывайте кейсы и получайте редкие скины. Каждый кейс содержит уникальные предметы с различной степенью редкости.
        </p>
        
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{cases.length}</div>
            <div className="text-slate-400 text-sm">Доступно кейсов</div>
          </div>
          <div className="w-px h-12 bg-slate-600" />
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{cases.filter(c => c.is_free).length}</div>
            <div className="text-slate-400 text-sm">Бесплатных</div>
          </div>
          <div className="w-px h-12 bg-slate-600" />
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{currentUser.coins}</div>
            <div className="text-slate-400 text-sm">Ваши монеты</div>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {cases.map((caseItem, index) => (
          <div 
            key={caseItem.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CaseCard
              caseItem={caseItem}
              isFavorite={favorites.includes(caseItem.id)}
              canAfford={caseItem.price <= currentUser.coins}
              onOpen={handleOpenCase}
              onPreview={setSelectedCase}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}
      </div>

      {/* Case Opening Simulation */}
      {openingCase && (
        <CaseOpeningSimulation
          caseItem={openingCase}
          onClose={() => setOpeningCase(null)}
          currentUser={currentUser}
          onCoinsUpdate={onCoinsUpdate}
        />
      )}

      {/* Case Preview Modal */}
      {selectedCase && (
        <CasePreviewModal
          caseItem={selectedCase}
          caseSkins={caseSkins}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
};

export default CasesTab;
