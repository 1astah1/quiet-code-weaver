import React, { useEffect } from 'react';

interface QuizRewardModalProps {
  reward: { amount: number; type: string } | null;
  onClose: () => void;
}

const QuizRewardModal = ({ reward, onClose }: QuizRewardModalProps) => {
  useEffect(() => {
    if (reward) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reward, onClose]);

  if (!reward) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-6 shadow-lg w-full max-w-xs text-center animate-pulse">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-white mb-2">Поздравляем!</h2>
        <p className="text-slate-300 mb-4">Вы получили награду!</p>
        
        <div className="bg-orange-500 rounded-lg p-4 mb-4">
          <div className="text-2xl font-bold text-white">
            +{reward.amount} {reward.type === 'balance' ? 'монет' : reward.type}
          </div>
        </div>
        
        <div className="text-sm text-slate-400">
          Награда добавлена на ваш баланс
        </div>
      </div>
    </div>
  );
};

export default QuizRewardModal; 