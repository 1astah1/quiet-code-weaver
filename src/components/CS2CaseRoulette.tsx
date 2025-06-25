import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { CS2RouletteItem } from '@/hooks/useCS2CaseOpening';
import LazyImage from '@/components/ui/LazyImage';
import { getRarityColor, getRarityShade } from '@/utils/rarityColors';

interface CS2CaseRouletteProps {
  items: CS2RouletteItem[];
  winnerPosition: number;
  onComplete: () => void;
}

const ITEM_WIDTH = 144; // w-36
const ITEM_GAP = 16; // gap-4

const CS2CaseRoulette = ({ items, winnerPosition, onComplete }: CS2CaseRouletteProps) => {
  const controls = useAnimation();
  const [extendedItems, setExtendedItems] = useState<CS2RouletteItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      const repeatedItems = Array(5).fill(items).flat();
      setExtendedItems(repeatedItems);
    }
  }, [items]);
  
  useEffect(() => {
    if (extendedItems.length === 0 || isSpinning) return;
    
    setIsSpinning(true);

    const targetIndex = items.length * 3 + winnerPosition;
    
    const containerWidth = document.querySelector('.roulette-container')?.clientWidth || 0;
    const centerOffset = containerWidth / 2 - ITEM_WIDTH / 2;

    const finalPosition = -(targetIndex * (ITEM_WIDTH + ITEM_GAP)) + centerOffset;
    
    const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH * 0.6);
    const targetX = finalPosition + randomOffset;

    controls.start({
      x: [0, targetX],
      transition: {
        x: {
          type: "spring",
          damping: 25,
          stiffness: 100,
          mass: 2.5,
        },
      },
    }).then(() => {
      controls.start({
        x: finalPosition,
        transition: {
          type: "tween",
          ease: "easeOut",
          duration: 0.5,
        }
      }).then(() => {
        setTimeout(() => {
          onComplete();
        }, 800);
      });
    });

  }, [extendedItems, winnerPosition, controls, onComplete, items.length, isSpinning]);

  if (extendedItems.length === 0) {
    return <div className="text-white">Загрузка предметов...</div>;
  }
  
  return (
    <div className="relative w-full max-w-full overflow-hidden roulette-container">
      {/* Central Marker */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-full z-20"
        style={{
          background: 'linear-gradient(to bottom, transparent, #fdba74, transparent)'
        }}
      />

      <motion.div
        className="flex items-center gap-4"
        animate={controls}
      >
        {extendedItems.map((item, index) => {
          const rarity = item.rarity?.toLowerCase() || 'consumer grade';
          const rarityColor = getRarityColor(rarity);
          const winnerIndex = items.length * 3 + winnerPosition;
          const isWinner = index === winnerIndex;

          return (
            <motion.div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-36 h-36 rounded-lg flex flex-col items-center justify-center relative"
              style={{
                backgroundColor: getRarityShade(rarity),
              }}
              animate={{
                boxShadow: isSpinning ? 'none' : (isWinner ? `0 0 20px 5px ${rarityColor}` : 'none'),
                scale: isSpinning ? 1 : (isWinner ? 1.1 : 1),
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 flex items-center justify-center mb-1">
                <LazyImage
                  src={item.image_url ?? ''}
                  alt={item.name}
                  className="w-full h-full object-contain drop-shadow-lg"
                  timeout={1000}
                />
              </div>
              <p className="text-white text-xs font-semibold text-center truncate w-full px-2">{item.name}</p>
              <div
                className="absolute bottom-0 left-0 w-full h-1 rounded-b-lg"
                style={{ backgroundColor: rarityColor }}
              ></div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default CS2CaseRoulette; 