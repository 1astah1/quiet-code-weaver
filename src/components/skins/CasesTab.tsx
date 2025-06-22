
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CaseCard from "./CaseCard";
import CasePreviewModal from "./CasePreviewModal";
import CaseOpeningAnimation from "@/components/CaseOpeningAnimation";
import FreeCaseTimer from "@/components/FreeCaseTimer";

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
  const [canOpenFreeCase, setCanOpenFreeCase] = useState(false);

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

  const { data: userData } = useQuery({
    queryKey: ['user-free-case-timer', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        console.log('No user ID for free case timer');
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('last_free_case_notification')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('User data fetch error:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    enabled: !!currentUser?.id,
    retry: 2
  });

  // Отдельный запрос для содержимого кейса при предварительном просмотре
  const { data: previewCaseSkins = [] } = useQuery({
    queryKey: ['case-skins-preview', selectedCaseForPreview?.id],
    queryFn: async () => {
      if (!selectedCaseForPreview?.id) return [];
      
      try {
        console.log('Loading case skins for preview:', selectedCaseForPreview.name);
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            probability,
            never_drop,
            custom_probability,
            skins (*)
          `)
          .eq('case_id', selectedCaseForPreview.id);
        
        if (error) {
          console.error('Case skins fetch error:', error);
          throw error;
        }
        
        console.log('Case skins loaded for preview:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error in case skins query:', error);
        return [];
      }
    },
    enabled: !!selectedCaseForPreview?.id,
    retry: 2
  });

  const handleCaseOpen = (caseData: any) => {
    if (!caseData || !currentUser) {
      console.error('Invalid case data or user for opening');
      return;
    }
    console.log('Opening case:', caseData.name);
    setOpeningCase(caseData);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Free cases */}
      {freeCases.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
            <span className="mr-2">🎁</span>
            Бесплатные кейсы
          </h2>
          
          <FreeCaseTimer 
            lastOpenTime={userData?.last_free_case_notification || null}
            onTimerComplete={() => setCanOpenFreeCase(true)}
            userId={currentUser.id}
            caseId={freeCases[0]?.id || ''}
          />
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-3 sm:mt-4">
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
            <span className="mr-2">💎</span>
            Премиум кейсы
          </h2>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
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
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-4">📦</div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Пока нет кейсов</h3>
          <p className="text-slate-400 text-sm sm:text-base">Скоро здесь появятся удивительные кейсы!</p>
        </div>
      )}

      {selectedCaseForPreview && (
        <CasePreviewModal
          caseItem={selectedCaseForPreview}
          caseSkins={previewCaseSkins}
          onClose={() => setSelectedCaseForPreview(null)}
        />
      )}

      {openingCase && currentUser && (
        <CaseOpeningAnimation
          caseItem={openingCase}
          onClose={() => setOpeningCase(null)}
          currentUser={currentUser}
          onCoinsUpdate={onCoinsUpdate}
        />
      )}
    </div>
  );
};

export default CasesTab;
