import React from 'react';

interface QuizRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  restoreTimeLeft: number;
  onWatchAd: () => void;
  loading?: boolean;
}

const QuizRestoreModal = ({ isOpen, onClose, restoreTimeLeft, onWatchAd, loading = false }: QuizRestoreModalProps) => {
  if (!isOpen) return null;
  
  const hours = Math.floor(restoreTimeLeft / 3600);
  const minutes = Math.floor((restoreTimeLeft % 3600) / 60);
  const seconds = restoreTimeLeft % 60;
  
  const canWatchAd = restoreTimeLeft === 0;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-6 shadow-lg w-full max-w-xs text-center">
        <h2 className="text-xl font-bold text-white mb-2">Нет жизней</h2>
        <p className="text-slate-300 mb-4">Следующее сердце восстановится через:</p>
        <div className="text-2xl font-mono text-orange-400 mb-4">
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {canWatchAd ? (
          <button
            className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={onWatchAd}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Посмотреть рекламу (1 раз в 8 часов)'}
          </button>
        ) : (
          <div className="w-full py-3 rounded-lg bg-slate-700 text-slate-400 font-bold mb-3">
            Реклама недоступна
          </div>
        )}
        
        <button
          className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition"
          onClick={onClose}
        >
          Закрыть
        </button>
        
        <div className="mt-4 text-xs text-slate-400">
          <p>• Сердце восстанавливается каждые 8 часов</p>
          <p>• Реклама доступна раз в 8 часов</p>
          <p>• Максимум 2 сердца</p>
        </div>
      </div>
    </div>
  );
};

export default QuizRestoreModal; 