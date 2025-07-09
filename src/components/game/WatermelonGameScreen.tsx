import React, { useState, useEffect } from 'react';
import WatermelonGameStartModal from './WatermelonGameStartModal';
import WatermelonGameRulesModal from './WatermelonGameRulesModal';
import WatermelonGameField from './WatermelonGameField';
import { useWatermelonGame } from '@/hooks/useWatermelonGame';

interface WatermelonGameScreenProps {
  onBack: () => void;
}

const WatermelonGameScreen: React.FC<WatermelonGameScreenProps> = ({ onBack }) => {
  const { getGameStatus, startGame, endGame, restoreHeartAd, loading, error } = useWatermelonGame();
  const [gameStatus, setGameStatus] = useState<any>(null);
  const [showRules, setShowRules] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Загружаем статус игры при монтировании
  useEffect(() => {
    loadGameStatus();
  }, []);

  const loadGameStatus = async () => {
    const status = await getGameStatus();
    if (status) {
      setGameStatus(status);
    }
  };

  const handleStartGame = async () => {
    const result = await startGame();
    if (result?.success) {
      setCurrentSessionId(result.session_id);
      setInGame(true);
      // Обновляем статус после начала игры
      await loadGameStatus();
    } else {
      alert(result?.error || 'Не удалось начать игру');
    }
  };

  const handleEndGame = async (coinsEarned: number) => {
    if (currentSessionId) {
      const result = await endGame(currentSessionId, coinsEarned);
      if (result?.success) {
        console.log(`Игра завершена! Заработано: ${coinsEarned} монет`);
        // Обновляем статус после завершения игры
        await loadGameStatus();
      }
    }
    setInGame(false);
    setCurrentSessionId(null);
  };

  const handleRestoreLife = async () => {
    const result = await restoreHeartAd();
    if (result?.success) {
      alert('Жизнь восстановлена!');
      await loadGameStatus();
    } else {
      alert('Не удалось восстановить жизнь');
    }
  };

  // Показываем загрузку если данные ещё не загружены
  if (!gameStatus && loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Загрузка...</div>
        <button onClick={onBack} style={{ marginTop: 24 }}>Назад</button>
      </div>
    );
  }

  // Показываем ошибку если что-то пошло не так
  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: 16 }}>Ошибка: {error}</div>
        <button onClick={loadGameStatus} style={{ margin: 8 }}>Повторить</button>
        <button onClick={onBack} style={{ margin: 8 }}>Назад</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      {inGame ? (
        <WatermelonGameField onEnd={handleEndGame} />
      ) : showRules ? (
        <WatermelonGameRulesModal onClose={() => setShowRules(false)} />
      ) : (
        <WatermelonGameStartModal
          hearts={gameStatus?.hearts || 0}
          nextRegen={gameStatus?.next_regen || '00:00:00'}
          adAvailable={gameStatus?.ad_available || false}
          onStart={handleStartGame}
          onShowRules={() => setShowRules(true)}
          onRestoreLife={handleRestoreLife}
        />
      )}
      <button onClick={onBack} style={{ marginTop: 24 }}>Назад</button>
    </div>
  );
};

export default WatermelonGameScreen; 