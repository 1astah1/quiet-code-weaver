
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles } from "lucide-react";
import { useVibration } from "@/hooks/useVibration";
import { useCaseOpening } from "@/hooks/useCaseOpening";

interface CaseOpeningAnimationProps {
  caseItem: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningAnimationProps) => {
  const [stage, setStage] = useState<'opening' | 'revealing' | 'complete'>('opening');
  const [showConfetti, setShowConfetti] = useState(false);
  const { vibrate, patterns, isSupported } = useVibration();
  const { openCase, isLoading, wonSkin } = useCaseOpening();

  useEffect(() => {
    if (caseItem) {
      // Запускаем открытие кейса
      openCase(caseItem.id);
      
      // Вибрация при начале открытия
      vibrate(patterns.caseOpening);
      
      setStage('opening');
    }
  }, [caseItem]);

  useEffect(() => {
    if (wonSkin) {
      // Переход к стадии раскрытия
      const revealTimer = setTimeout(() => {
        setStage('revealing');
        
        // Вибрация при раскрытии
        vibrate(patterns.medium);
        
        // Если это редкий предмет, добавляем специальную вибрацию
        if (wonSkin.rarity === 'Legendary' || wonSkin.rarity === 'Mythical') {
          setTimeout(() => vibrate(patterns.rareItem), 200);
          setShowConfetti(true);
        } else if (wonSkin.rarity === 'Rare' || wonSkin.rarity === 'Epic') {
          setTimeout(() => vibrate(patterns.success), 150);
        }
      }, 2000);

      // Завершение анимации
      const completeTimer = setTimeout(() => {
        setStage('complete');
        setTimeout(() => {
          onClose();
          setShowConfetti(false);
          setStage('opening');
        }, 3000);
      }, 4000);

      return () => {
        clearTimeout(revealTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [wonSkin, vibrate, patterns, onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'from-gray-400 to-gray-600';
      case 'Uncommon':
        return 'from-green-400 to-green-600';
      case 'Rare':
        return 'from-blue-400 to-blue-600';
      case 'Epic':
        return 'from-purple-400 to-purple-600';
      case 'Legendary':
        return 'from-orange-400 to-orange-600';
      case 'Mythical':
        return 'from-red-400 to-red-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {/* Конфетти для редких предметов */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -100, 
                  x: Math.random() * window.innerWidth,
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5 
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 360,
                  opacity: 0 
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2,
                  ease: "easeOut" 
                }}
                className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            ))}
          </div>
        )}

        <div className="relative">
          {/* Стадия открытия */}
          {stage === 'opening' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 0.5, repeat: Infinity }
                }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-2xl font-bold text-white mb-2"
              >
                Открываем кейс...
              </motion.h2>
              <div className="text-gray-300">
                {isSupported ? "Почувствуйте магию!" : "Приготовьтесь к сюрпризу!"}
              </div>
            </motion.div>
          )}

          {/* Стадия раскрытия */}
          {stage === 'revealing' && wonSkin && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 150 }}
                className="mb-6"
              >
                <Card className={`w-80 bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} border-0 shadow-2xl`}>
                  <CardContent className="p-6 text-center">
                    <motion.div
                      animate={{ scale: [0.9, 1.1, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden"
                    >
                      {wonSkin.image_url ? (
                        <img 
                          src={wonSkin.image_url} 
                          alt={wonSkin.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">🔫</span>
                        </div>
                      )}
                    </motion.div>
                    
                    <Badge className="mb-3 bg-white/20 text-white">
                      {wonSkin.rarity}
                    </Badge>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {wonSkin.name}
                    </h3>
                    
                    <p className="text-white/80 mb-3">
                      {wonSkin.weapon_type}
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-white">
                      <Coins className="w-5 h-5" />
                      <span className="text-lg font-semibold">
                        {wonSkin.price} монет
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Поздравляем!
              </motion.h2>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300"
              >
                Вы получили {wonSkin.rarity} предмет!
              </motion.p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaseOpeningAnimation;
