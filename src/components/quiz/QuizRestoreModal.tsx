import React from 'react';

const QuizRestoreModal = ({ isOpen, onClose, restoreTimeLeft, onWatchAd }: {
  isOpen: boolean,
  onClose: () => void,
  restoreTimeLeft: number,
  onWatchAd: () => void
}) => {
  if (!isOpen) return null;
  const hours = Math.floor(restoreTimeLeft / 3600);
  const minutes = Math.floor((restoreTimeLeft % 3600) / 60);
  const seconds = restoreTimeLeft % 60;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-6 shadow-lg w-full max-w-xs text-center">
        <h2 className="text-xl font-bold text-white mb-2">Нет жизней</h2>
        <p className="text-slate-300 mb-4">Следующее сердце восстановится через:</p>
        <div className="text-2xl font-mono text-orange-400 mb-4">
          {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <button
          className="w-full py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold mb-2 disabled:opacity-50"
          onClick={onWatchAd}
        >
          Посмотреть рекламу (1 раз в день)
        </button>
        <button
          className="w-full py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default QuizRestoreModal; 