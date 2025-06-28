import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, Coins, Sparkles, Star } from 'lucide-react';

interface QuizRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    type: 'coins' | 'gift';
    amount: number;
    milestone: number;
  };
}

const QuizRewardModal: React.FC<QuizRewardModalProps> = ({
  isOpen,
  onClose,
  reward
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setShowConfetti(true);
      
      // Stop confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Auto close after 4 seconds
      setTimeout(() => {
        setIsAnimating(false);
        onClose();
      }, 4000);
    }
  }, [isOpen, onClose]);

  const getRewardIcon = () => {
    if (reward.type === 'gift') {
      return (
        <div className="relative">
          <Gift className="w-24 h-24 text-purple-400 drop-shadow-lg" />
          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          <Sparkles className="w-4 h-4 text-pink-400 absolute -bottom-1 -left-1 animate-pulse delay-300" />
        </div>
      );
    }
    
    return (
      <div className="relative">
        <Coins className="w-24 h-24 text-yellow-400 drop-shadow-lg" />
        <Star className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
      </div>
    );
  };

  const getRewardTitle = () => {
    if (reward.type === 'gift') {
      return 'Подарок! 🎁';
    }
    return 'Награда! 🎉';
  };

  const getRewardDescription = () => {
    if (reward.type === 'gift') {
      return `Поздравляем! Вы достигли ${reward.milestone} правильных ответов и получили особый подарок!`;
    }
    return `Отлично! Вы достигли ${reward.milestone} правильных ответов!`;
  };

  const getBackgroundGradient = () => {
    if (reward.type === 'gift') {
      return 'bg-gradient-to-br from-purple-900/90 via-pink-900/80 to-indigo-900/90';
    }
    return 'bg-gradient-to-br from-yellow-900/90 via-orange-900/80 to-red-900/90';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent">
        <Card className={`relative overflow-hidden ${getBackgroundGradient()} border-0 shadow-2xl`}>
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full animate-bounce ${
                    ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][i % 5]
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}

          <div className="p-8 text-center relative z-10">
            {/* Reward Icon */}
            <div className={`mb-6 transform transition-all duration-700 ${
              isAnimating ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              {getRewardIcon()}
            </div>

            {/* Title */}
            <h2 className={`text-3xl font-bold mb-4 transition-all duration-500 delay-300 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${reward.type === 'gift' ? 'text-purple-200' : 'text-yellow-200'}`}>
              {getRewardTitle()}
            </h2>

            {/* Description */}
            <p className={`text-lg mb-6 transition-all duration-500 delay-500 ${
              isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } text-slate-200`}>
              {getRewardDescription()}
            </p>

            {/* Reward Amount */}
            <div className={`mb-6 transition-all duration-500 delay-700 ${
              isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}>
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
                reward.type === 'gift' 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30' 
                  : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
              }`}>
                {reward.type === 'gift' ? (
                  <Gift className="w-6 h-6 text-purple-300" />
                ) : (
                  <Coins className="w-6 h-6 text-yellow-300" />
                )}
                <span className={`text-2xl font-bold ${
                  reward.type === 'gift' ? 'text-purple-200' : 'text-yellow-200'
                }`}>
                  +{reward.amount}
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={onClose}
              className={`w-full transition-all duration-500 delay-1000 ${
                isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${
                reward.type === 'gift'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
              } text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              Продолжить
            </Button>
          </div>

          {/* Glow Effect */}
          <div className={`absolute inset-0 rounded-xl ${
            reward.type === 'gift' 
              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' 
              : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10'
          } blur-xl`} />
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default QuizRewardModal; 