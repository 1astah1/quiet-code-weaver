import React, { useState } from 'react';

interface WatermelonGameStartModalProps {
  hearts: number; // 0, 1, 2
  nextRegen: string; // время до восстановления (строка)
  adAvailable: boolean;
  onStart: () => void;
  onShowRules: () => void;
  onRestoreLife: () => void;
}

const WatermelonGameStartModal: React.FC<WatermelonGameStartModalProps> = ({
  hearts,
  nextRegen,
  adAvailable,
  onStart,
  onShowRules,
  onRestoreLife,
}) => {
  const renderHearts = () => {
    if (hearts === 2) return '❤️❤️';
    if (hearts === 1) return '❤️♡';
    return '♡♡';
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 340, margin: '40px auto', boxShadow: '0 4px 24px #0002', textAlign: 'center' }}>
      <h2>Watermelon Game</h2>
      <div style={{ fontSize: 32, margin: '16px 0' }}>{renderHearts()}</div>
      {hearts < 2 && (
        <div style={{ color: '#888', marginBottom: 8 }}>
          Восстановление жизни через: <b>{nextRegen}</b>
        </div>
      )}
      <button
        onClick={onStart}
        disabled={hearts === 0}
        style={{ margin: 8, padding: '8px 24px', fontSize: 18, borderRadius: 8, background: hearts === 0 ? '#ccc' : '#4caf50', color: '#fff', border: 'none', cursor: hearts === 0 ? 'not-allowed' : 'pointer' }}
      >
        Старт
      </button>
      <button
        onClick={onShowRules}
        style={{
          background: 'none',
          color: '#2196f3',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: 14,
          marginBottom: 12,
          marginTop: -8,
          fontWeight: 500
        }}
      >
        Правила
      </button>
      <br />
      <button
        onClick={onRestoreLife}
        disabled={!adAvailable}
        style={{ margin: 8, padding: '8px 24px', fontSize: 16, borderRadius: 8, background: adAvailable ? '#ff9800' : '#ccc', color: '#fff', border: 'none', cursor: adAvailable ? 'pointer' : 'not-allowed' }}
      >
        Восстановить жизнь (за рекламу)
      </button>
    </div>
  );
};

export default WatermelonGameStartModal; 