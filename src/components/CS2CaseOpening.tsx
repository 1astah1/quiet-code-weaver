import { useState } from 'react';
import { useCS2CaseOpening } from '@/hooks/useCS2CaseOpening';
import CS2CaseRoulette from './CS2CaseRoulette';
import CS2CaseResult from './CS2CaseResult';
import { Button } from '@/components/ui/button';

interface CS2CaseOpeningProps {
  userId: string;
  caseId: string;
  onClose: () => void;
  onBalanceUpdate?: (newBalance: number) => void;
}

const CS2CaseOpening = ({ userId, caseId, onClose, onBalanceUpdate }: CS2CaseOpeningProps) => {
  const { loading, error, result, phase, openCase, finishRoulette } = useCS2CaseOpening(userId, caseId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sold, setSold] = useState(false);

  // Открыть кейс при первом рендере
  useState(() => { openCase(); });

  // Продажа скина (эмуляция)
  const handleSell = async () => {
    if (!result) return;
    setIsProcessing(true);
    // Здесь можно вызвать Supabase RPC для продажи
    setTimeout(() => {
      setIsProcessing(false);
      setSold(true);
      if (onBalanceUpdate) onBalanceUpdate(result.reward.price);
      setTimeout(onClose, 1200);
    }, 1200);
  };

  // Забрать в инвентарь (эмуляция)
  const handleTake = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" onClick={onClose} className="text-white">✕</Button>
      </div>
      {error && (
        <div className="bg-red-700 text-white p-8 rounded-xl shadow-xl text-center">
          <div className="text-2xl mb-2">Ошибка открытия кейса</div>
          <div>{error}</div>
          <Button onClick={onClose} className="mt-4">Закрыть</Button>
        </div>
      )}
      {phase === 'anim' && (
        <div className="text-white text-2xl animate-pulse">Подготовка кейса...</div>
      )}
      {phase === 'roulette' && result && (
        <CS2CaseRoulette
          items={result.roulette_items}
          winnerPosition={result.winner_position}
          onComplete={finishRoulette}
        />
      )}
      {phase === 'result' && result && !sold && (
        <CS2CaseResult
          reward={result.reward}
          onTake={handleTake}
          onSell={handleSell}
          isProcessing={isProcessing}
        />
      )}
      {sold && (
        <div className="text-green-400 text-2xl font-bold animate-bounce mt-8">Скин успешно продан!</div>
      )}
    </div>
  );
};

export default CS2CaseOpening; 