import React from 'react';

interface WatermelonGameOverModalProps {
  coinsEarned: number;
  hearts: number;
  adAvailable: boolean;
  onRestoreLife: () => void;
  onBackToStart: () => void;
}

const WatermelonGameOverModal: React.FC<WatermelonGameOverModalProps> = ({
  coinsEarned,
  hearts,
  adAvailable,
  onRestoreLife,
  onBackToStart,
}) => {
  const renderHearts = () => {
    if (hearts === 2) return '❤️❤️';
    if (hearts === 1) return '❤️♡';
    return '♡♡';
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, margin: '40px auto', boxShadow: '0 4px 24px #0002', textAlign: 'center' }}>
      <h2 style={{ color: '#e53935', marginBottom: 16 }}>Игра окончена!</h2>
      <div style={{ fontSize: 24, marginBottom: 16 }}>
        Заработано монет: <b style={{ color: '#4caf50' }}>{coinsEarned}</b>
      </div>
      <div style={{ fontSize: 20, marginBottom: 24 }}>
        Жизни: {renderHearts()}
      </div>
      {hearts > 0 ? (
        <button
          onClick={onBackToStart}
          style={{ margin: 8, padding: '12px 32px', fontSize: 18, borderRadius: 8, background: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Играть снова
        </button>
      ) : (
        <button
          onClick={onRestoreLife}
          disabled={!adAvailable}
          style={{ margin: 8, padding: '12px 32px', fontSize: 18, borderRadius: 8, background: adAvailable ? '#ff9800' : '#ccc', color: '#fff', border: 'none', cursor: adAvailable ? 'pointer' : 'not-allowed' }}
        >
          Восстановить жизнь (за рекламу)
        </button>
      )}
      <br />
      <button
        onClick={onBackToStart}
        style={{ margin: 8, padding: '8px 24px', fontSize: 16, borderRadius: 8, background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Вернуться в меню
      </button>
    </div>
  );
};

export default WatermelonGameOverModal; 