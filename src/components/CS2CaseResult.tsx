import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { CS2RouletteItem } from '@/hooks/useCS2CaseOpening';
import LazyImage from '@/components/ui/LazyImage';
import { getRarityColor, getRarityShade } from '@/utils/rarityColors';
import { Coins } from 'lucide-react';

interface CS2CaseResultProps {
  reward: CS2RouletteItem;
  onTake: () => void;
  onSell: () => void;
  isProcessing?: boolean;
}

const CS2CaseResult = ({ reward, onTake, onSell, isProcessing }: CS2CaseResultProps) => {
  const rarity = reward.rarity?.toLowerCase() || 'consumer grade';
  const rarityColor = getRarityColor(rarity);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        damping: 15,
        stiffness: 100,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-4 sm:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 60%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Вы выиграли скин!
        </motion.h2>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl border-2"
          style={{ 
            borderColor: rarityColor,
            backgroundColor: getRarityShade(rarity),
            boxShadow: `0 0 30px 0px ${rarityColor}`,
          }}
        >
          <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4">
            <LazyImage 
              src={reward.image_url ?? ''}
              alt={reward.name} 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h3 className="text-white text-xl sm:text-2xl font-bold">{reward.name}</h3>
          <p className="text-sm uppercase font-semibold mt-1" style={{ color: rarityColor }}>
            {reward.rarity}
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-lg sm:text-xl font-bold mt-2">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            {reward.price}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button onClick={onTake} disabled={isProcessing} size="lg" className="bg-green-600 hover:bg-green-700">
            Забрать в инвентарь
          </Button>
          <Button onClick={onSell} disabled={isProcessing} size="lg" className="bg-orange-600 hover:bg-orange-700">
            Продать за {reward.price}
          </Button>
        </motion.div>

        {isProcessing && (
          <motion.div variants={itemVariants} className="mt-4 flex items-center space-x-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Обработка...</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CS2CaseResult; 