
import { useState } from "react";
import { useCases, useCaseSkins, useUserFavorites, useToggleFavorite, useOpenCase } from "@/hooks/useCases";
import CaseOpeningSimulation from "@/components/CaseOpeningSimulation";
import CaseCard from "./CaseCard";
import CasePreviewModal from "./CasePreviewModal";
import { Loader2, Package } from "lucide-react";

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-400">Загрузка кейсов...</p>
        </div>
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">Кейсы не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold text-white mb-2">Коллекция кейсов</h2>
        <p className="text-slate-400">Открывайте кейсы и получайте редкие скины</p>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            isFavorite={favorites.includes(caseItem.id)}
            canAfford={caseItem.price <= currentUser.coins}
            onOpen={handleOpenCase}
            onPreview={setSelectedCase}
            onToggleFavorite={handleToggleFavorite}
          />
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
