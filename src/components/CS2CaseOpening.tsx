import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCS2CaseOpening } from '@/hooks/useCS2CaseOpening';
import CS2CaseRoulette from './CS2CaseRoulette';
import CS2CaseResult from './CS2CaseResult';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { getRarityColor } from '@/utils/rarityColors';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CS2CaseOpeningProps {
  userId: string;
  caseId: string;
  onClose: () => void;
  onBalanceUpdate?: () => void;
}

const CS2CaseOpening = ({ userId, caseId, onClose, onBalanceUpdate }: CS2CaseOpeningProps) => {
  const { loading, error, result, phase, openCase, finishRoulette } = useCS2CaseOpening(userId, caseId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSoldMessage, setShowSoldMessage] = useState(false);
  const { toast } = useToast();
  
  const rarityColor = result ? getRarityColor(result.reward.rarity || '') : '#ffffff';

  useEffect(() => {
    openCase();
  }, [openCase]);

  useEffect(() => {
    if (result?.success && onBalanceUpdate) {
      onBalanceUpdate();
    }
  }, [result]);

  const handleSell = async () => {
    if (!result || !result.reward.user_inventory_id) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить предмет для продажи.',
        variant: 'destructive',
      });
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('final_sell_item', {
        p_inventory_id: result.reward.user_inventory_id,
        p_user_id: userId,
      });

      const sellResult = data as Array<{ success: boolean; message: string; new_balance: number }>;
      if (error || (sellResult && !sellResult[0]?.success)) {
        toast({
          title: 'Ошибка продажи',
          description: error?.message || (sellResult && sellResult[0]?.message) || 'Не удалось продать предмет.',
          variant: 'destructive',
        });
        console.error('Ошибка продажи предмета:', error || (sellResult && sellResult[0]?.message));
      } else if (sellResult && sellResult[0]?.success) {
        toast({
          title: 'Успех',
          description: 'Скин успешно продан!',
        });
        if (onBalanceUpdate) {
          onBalanceUpdate();
        }
        setShowSoldMessage(true);
        setTimeout(onClose, 1500);
      }
    } catch (e) {
      toast({
        title: 'Критическая ошибка',
        description: e instanceof Error ? e.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
      console.error('Критическая ошибка продажи:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTake = () => {
    setIsProcessing(true);
    setTimeout(onClose, 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${rarityColor}1A 0%, transparent 70%)`,
        }}
        animate={{
          scale: phase === 'result' ? [1.5, 2] : 1,
          opacity: phase === 'result' ? [0.5, 0] : 0.2,
        }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      
      <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-20">✕</Button>
      
      <AnimatePresence>
        {loading && phase === 'anim' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-white"
          >
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <span className="text-xl">Открываем кейс...</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/50 border border-red-500 text-white p-6 rounded-lg text-center"
          >
            <h3 className="text-xl font-bold mb-2">Ошибка</h3>
            <p>{error}</p>
            <Button onClick={onClose} className="mt-4">Закрыть</Button>
          </motion.div>
        )}

        {phase === 'roulette' && result && (
          <motion.div key="roulette" className="w-full">
            <CS2CaseRoulette
              items={result.roulette_items}
              winnerPosition={result.winner_position}
              onComplete={finishRoulette}
            />
          </motion.div>
        )}

        {phase === 'result' && result && !showSoldMessage && (
          <motion.div key="result">
            <CS2CaseResult
              reward={result.reward}
              onTake={handleTake}
              onSell={handleSell}
              isProcessing={isProcessing}
            />
          </motion.div>
        )}
        
        {showSoldMessage && (
          <motion.div
            key="sold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-400 text-2xl font-bold"
          >
            Скин продан!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CS2CaseOpening; 