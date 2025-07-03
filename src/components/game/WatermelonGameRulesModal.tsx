import React from 'react';

interface WatermelonGameRulesModalProps {
  onClose: () => void;
}

const WatermelonGameRulesModal: React.FC<WatermelonGameRulesModalProps> = ({ onClose }) => {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, margin: '40px auto', boxShadow: '0 4px 24px #0002', textAlign: 'left', position: 'relative' }}>
      <h2 style={{ textAlign: 'center' }}>Правила игры</h2>
      <ul style={{ fontSize: 16, margin: '18px 0 24px 0', paddingLeft: 18 }}>
        <li>Соединяйте одинаковые фрукты — они сливаются в более крупный фрукт.</li>
        <li>Каждое слияние приносит монеты: 1-е — 1 монета, 2-е — 2 монеты и т.д.</li>
        <li>Игра заканчивается, если фрукт касается верхней границы.</li>
        <li>У вас 2 жизни. Восстановление: 1 жизнь / 8 часов или за рекламу (1 раз / 3 часа).</li>
        <li>Все данные (жизни, монеты, таймеры) сохраняются.</li>
      </ul>
      <button onClick={onClose} style={{ display: 'block', margin: '0 auto', padding: '8px 32px', borderRadius: 8, background: '#2196f3', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>Закрыть</button>
    </div>
  );
};

export default WatermelonGameRulesModal; 