
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface FreeCaseTimerProps {
  lastOpenTime: string | null;
  onTimerComplete: () => void;
}

const FreeCaseTimer = ({ lastOpenTime, onTimerComplete }: FreeCaseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (!lastOpenTime) {
      setIsAvailable(true);
      onTimerComplete();
      return;
    }

    const checkTimer = () => {
      const lastOpen = new Date(lastOpenTime);
      const now = new Date();
      const timeDiff = now.getTime() - lastOpen.getTime();
      const twoHours = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах

      if (timeDiff >= twoHours) {
        setIsAvailable(true);
        setTimeLeft(0);
        onTimerComplete();
      } else {
        setIsAvailable(false);
        const remaining = twoHours - timeDiff;
        setTimeLeft(remaining);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [lastOpenTime, onTimerComplete]);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isAvailable) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2 text-orange-400 text-sm font-medium bg-slate-800/50 rounded-lg p-3 border border-orange-500/30">
      <Clock className="w-4 h-4" />
      <span>Следующий бесплатный кейс через: {formatTime(timeLeft)}</span>
    </div>
  );
};

export default FreeCaseTimer;
