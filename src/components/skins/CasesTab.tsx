
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
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [openingCase, setOpeningCase] = useState<any>(null);
  const [canOpenFreeCase, setCanOpenFreeCase] = useState(false);

  // Получаем случаи
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Получаем информацию о последнем бесплатном открытии
  const { data: userData } = useQuery({
    queryKey: ['user-free-case-timer', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('last_free_case_notification')
        .eq('id', currentUser.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Получаем скины для выбранного кейса
  const { data: caseSkins = [] } = useQuery({
    queryKey: ['case-skins', selectedCase?.id],
    queryFn: async () => {
      if (!selectedCase?.id) return [];
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          probability,
          never_drop,
          custom_probability,
          skins (*)
        `)
        .eq('case_id', selectedCase.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCase?.id
  });

  const updateLastFreeCase = async () => {
    await supabase
      .from('users')
      .update({ last_free_case_notification: new Date().toISOString() })
      .eq('id', currentUser.id);
  };

  const handleCaseOpen = (caseData: any) => {
    setOpeningCase(caseData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">Загрузка кейсов...</div>
      </div>
    );
  }

  const freeCases = cases.filter(caseItem => caseItem.is_free);
  const paidCases = cases.filter(caseItem => !caseItem.is_free);

  return (
    <div className="space-y-6">
      {/* Бесплатные кейсы */}
      {freeCases.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">🎁</span>
            Бесплатные кейсы
          </h2>
          
          <FreeCaseTimer 
            lastOpenTime={userData?.last_free_case_notification}
            onTimerComplete={() => setCanOpenFreeCase(true)}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {freeCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                currentUser={currentUser}
                onCaseSelect={handleCaseOpen}
                onCoinsUpdate={onCoinsUpdate}
                disabled={!canOpenFreeCase}
                onFreeOpen={updateLastFreeCase}
              />
            ))}
          </div>
        </div>
      )}

      {/* Платные кейсы */}
      {paidCases.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">💎</span>
            Премиум кейсы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                currentUser={currentUser}
                onCaseSelect={handleCaseOpen}
                onCoinsUpdate={onCoinsUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {cases.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-white mb-2">Пока нет кейсов</h3>
          <p className="text-slate-400">Скоро здесь появятся удивительные кейсы!</p>
        </div>
      )}

      {selectedCase && (
        <CasePreviewModal
          caseItem={selectedCase}
          caseSkins={caseSkins}
          onClose={() => setSelectedCase(null)}
        />
      )}

      {openingCase && (
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
