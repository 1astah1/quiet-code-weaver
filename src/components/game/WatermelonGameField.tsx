import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import WatermelonGameOverModal from './WatermelonGameOverModal';

interface WatermelonGameFieldProps {
  onEnd: (coinsEarned: number) => void;
}

// Иерархия фруктов по ТЗ
const FRUIT_LEVELS = [
  { radius: 15, color: '#ff6b6b', name: 'Вишня' },      // Уровень 1
  { radius: 20, color: '#ff8e8e', name: 'Клубника' },   // Уровень 2
  { radius: 30, color: '#8b5cf6', name: 'Виноград' },   // Уровень 3
  { radius: 40, color: '#ffa726', name: 'Мандарин' },   // Уровень 4
  { radius: 50, color: '#ff9800', name: 'Апельсин' },   // Уровень 5
  { radius: 60, color: '#4caf50', name: 'Яблоко' },     // Уровень 6
  { radius: 70, color: '#8bc34a', name: 'Груша' },      // Уровень 7
  { radius: 80, color: '#ffeb3b', name: 'Персик' },     // Уровень 8
  { radius: 90, color: '#ffc107', name: 'Ананас' },     // Уровень 9
  { radius: 100, color: '#e91e63', name: 'Арбуз' },     // Уровень 10
];

interface FruitData {
  body: Matter.Body;
  level: number;
}

const WatermelonGameField: React.FC<WatermelonGameFieldProps> = ({ onEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const fruitsRef = useRef<FruitData[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [hearts, setHearts] = useState(2);
  const [mergeCount, setMergeCount] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || gameOver) return;

    // Инициализация Matter.js
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Создание рендерера
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 320,
        height: 420,
        wireframes: false,
        background: '#f8f9fa',
        showAngleIndicator: false,
        showCollisions: false,
        showVelocity: false,
      }
    });
    renderRef.current = render;

    // Создание границ контейнера
    const ground = Matter.Bodies.rectangle(160, 410, 320, 20, { isStatic: true, render: { fillStyle: '#6c757d' } });
    const leftWall = Matter.Bodies.rectangle(10, 210, 20, 400, { isStatic: true, render: { fillStyle: '#6c757d' } });
    const rightWall = Matter.Bodies.rectangle(310, 210, 20, 400, { isStatic: true, render: { fillStyle: '#6c757d' } });
    const topWall = Matter.Bodies.rectangle(160, 10, 320, 20, { isStatic: true, render: { fillStyle: '#6c757d' } });

    // Добавление тел в мир
    Matter.World.add(engine.world, [ground, leftWall, rightWall, topWall]);

    // Функция создания фрукта
    const createFruit = (x: number, y: number, level: number) => {
      const fruitData = FRUIT_LEVELS[level - 1];
      const fruit = Matter.Bodies.circle(x, y, fruitData.radius, {
        restitution: 0.6,
        friction: 0.1,
        density: 0.001,
        render: { fillStyle: fruitData.color }
      });
      
      const fruitInfo: FruitData = { body: fruit, level };
      fruitsRef.current.push(fruitInfo);
      Matter.World.add(engine.world, fruit);
      return fruitInfo;
    };

    // Функция слияния фруктов
    const mergeFruits = (fruit1: FruitData, fruit2: FruitData) => {
      const newLevel = fruit1.level + 1;
      if (newLevel > FRUIT_LEVELS.length) return; // Максимальный уровень

      const centerX = (fruit1.body.position.x + fruit2.body.position.x) / 2;
      const centerY = (fruit1.body.position.y + fruit2.body.position.y) / 2;

      // Удаляем старые фрукты
      Matter.World.remove(engine.world, fruit1.body);
      Matter.World.remove(engine.world, fruit2.body);
      fruitsRef.current = fruitsRef.current.filter(f => f !== fruit1 && f !== fruit2);

      // Создаем новый фрукт
      const newFruit = createFruit(centerX, centerY, newLevel);
      
      // Добавляем монеты по формуле n-го слияния = n монет
      setMergeCount(prev => {
        const newCount = prev + 1;
        setCoinsEarned(coins => coins + newCount);
        return newCount;
      });

      console.log(`Слияние! Создан ${FRUIT_LEVELS[newLevel - 1].name} (уровень ${newLevel})`);
    };

    // Отслеживание столкновений
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Проверяем, касается ли фрукт верхней границы
        if ((bodyA === topWall && fruitsRef.current.some(f => f.body === bodyB)) ||
            (bodyB === topWall && fruitsRef.current.some(f => f.body === bodyA))) {
          setGameOver(true);
          setHearts(prev => Math.max(0, prev - 1));
          return;
        }

        // Проверяем слияние фруктов
        const fruitA = fruitsRef.current.find(f => f.body === bodyA);
        const fruitB = fruitsRef.current.find(f => f.body === bodyB);
        
        if (fruitA && fruitB && fruitA.level === fruitB.level) {
          // Небольшая задержка для стабильности
          setTimeout(() => mergeFruits(fruitA, fruitB), 50);
        }
      });
    });

    // Создание начальных фруктов
    setTimeout(() => createFruit(160, 50, 1), 1000);
    setTimeout(() => createFruit(180, 50, 1), 2000);
    setTimeout(() => createFruit(140, 50, 1), 3000);

    // Запуск симуляции
    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(render);

    // Очистка при размонтировании
    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, [gameOver]);

  if (gameOver) {
    return (
      <WatermelonGameOverModal
        coinsEarned={coinsEarned}
        hearts={hearts}
        adAvailable={true}
        onRestoreLife={() => {
          setHearts(prev => Math.min(2, prev + 1));
          setGameOver(false);
          setCoinsEarned(0);
          setMergeCount(0);
        }}
        onBackToStart={() => onEnd(coinsEarned)}
      />
    );
  }

  return (
    <div style={{ background: '#f7f7f7', borderRadius: 16, padding: 32, maxWidth: 400, margin: '40px auto', boxShadow: '0 4px 24px #0002', textAlign: 'center' }}>
      {/* Верхняя панель */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{hearts === 2 ? '❤️❤️' : hearts === 1 ? '❤️♡' : '♡♡'}</span>
        <span style={{ fontSize: 18, fontWeight: 500 }}>Монеты: <b>{coinsEarned}</b></span>
      </div>
      {/* Canvas с физикой */}
      <canvas
        ref={canvasRef}
        style={{ border: '2px solid #ddd', borderRadius: 12, margin: '0 auto 24px auto', display: 'block' }}
        width={320}
        height={420}
      />
      <button onClick={() => onEnd(coinsEarned)} style={{ marginTop: 8, padding: '8px 32px', borderRadius: 8, background: '#e53935', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>Завершить игру</button>
    </div>
  );
};

export default WatermelonGameField; 