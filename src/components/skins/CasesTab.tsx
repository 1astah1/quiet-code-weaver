import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CaseCard from "./CaseCard";
import CasePreviewModal from "./CasePreviewModal";
import CS2CaseOpening from "@/components/CS2CaseOpening";
import AdModal from "@/components/ads/AdModal";
import { useFreeCaseTimers } from '@/hooks/useFreeCaseTimers';

interface CasesTabProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CasesTab = ({ currentUser, onCoinsUpdate }: CasesTabProps) => {
  const [selectedCaseForPreview, setSelectedCaseForPreview] = useState<any>(null);
  const [openingCase, setOpeningCase] = useState<any>(null);
  const [showAdForCase, setShowAdForCase] = useState<any>(null);

  const { refetch: refetchFreeTimers } = useFreeCaseTimers(currentUser.id);

  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      try {
        console.log('Loading cases...');
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Cases fetch error:', error);
          throw error;
        }
        
        console.log('Cases loaded:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error in cases query:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  const handleCaseOpen = (caseData: any, isFree: boolean = false) => {
    if (!caseData || !currentUser) {
      console.error('Invalid case data or user for opening');
      return;
    }

    if (isFree) {
      setShowAdForCase(caseData);
    } else {
      console.log('🎯 [CASES_TAB] Opening case with safe animation:', caseData.name);
      setOpeningCase(caseData);
    }
  };

  const handleAdComplete = (success: boolean) => {
    if (success && showAdForCase) {
      console.log('🎯 [CASES_TAB] Ad completed, opening free case:', showAdForCase.name);
      setOpeningCase(showAdForCase);
    }
    setShowAdForCase(null);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    onCoinsUpdate(newBalance);
  };

  if (error) {
    console.error('Cases tab error:', error);
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-base sm:text-lg mb-2">Ошибка загрузки кейсов</div>
          <div className="text-gray-400 text-xs sm:text-sm">Попробуйте обновить страницу</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-white text-sm sm:text-lg">Загрузка кейсов...</div>
      </div>
    );
  }

  const freeCases = cases.filter(caseItem => caseItem?.is_free) || [];
  const paidCases = cases.filter(caseItem => !caseItem?.is_free) || [];

  return (
    <div className="space-y-6">
      {/* Free cases */}
      {freeCases.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
            <span className="mr-2 text-2xl">🎁</span>
            Бесплатные кейсы
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {freeCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                currentUser={currentUser}
                onOpen={handleCaseOpen}
                onCoinsUpdate={onCoinsUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paid cases */}
      {paidCases.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
            <span className="mr-2 text-2xl">💎</span>
            Премиум кейсы
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {paidCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                currentUser={currentUser}
                onOpen={handleCaseOpen}
                onCoinsUpdate={onCoinsUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {cases.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-5xl sm:text-6xl mb-4">📦</div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Пока нет кейсов</h3>
          <p className="text-slate-400 text-sm sm:text-base">Скоро здесь появятся удивительные кейсы!</p>
        </div>
      )}

      {selectedCaseForPreview && (
        <CasePreviewModal
          caseItem={selectedCaseForPreview}
          onClose={() => setSelectedCaseForPreview(null)}
        />
      )}

      {showAdForCase && (
        <AdModal
          isOpen={!!showAdForCase}
          onClose={handleAdComplete}
          caseName={showAdForCase.name}
        />
      )}

      {openingCase && currentUser && (
        <CS2CaseOpening
          userId={currentUser.id}
          caseId={openingCase.id}
          onClose={() => {
            setOpeningCase(null);
            refetchFreeTimers();
          }}
          onBalanceUpdate={onCoinsUpdate}
        />
      )}
    </div>
  );
};

export default CasesTab;
