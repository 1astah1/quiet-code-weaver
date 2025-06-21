
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FreeCaseTimerProps {
  lastOpenTime: string | null;
  onTimerComplete: () => void;
  isDisabled?: boolean;
  userId: string;
  caseId: string;
}

const FreeCaseTimer = ({ 
  lastOpenTime, 
  onTimerComplete, 
  isDisabled = false, 
  userId, 
  caseId 
}: FreeCaseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastFreeOpen, setLastFreeOpen] = useState<string | null>(lastOpenTime);

  useEffect(() => {
    const checkTimer = async () => {
      try {
        // Проверяем последнее время открытия бесплатного кейса на сервере
        const { data, error } = await supabase
          .from('users')
          .select('last_free_case_notification')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        const serverLastOpen = data?.last_free_case_notification;
        
        if (!serverLastOpen) {
          setIsAvailable(true);
          setTimeLeft(0);
          onTimerComplete();
          return;
        }

        const lastOpen = new Date(serverLastOpen);
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

        setLastFreeOpen(serverLastOpen);
      } catch (error) {
        console.error('Timer check error:', error);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [userId, onTimerComplete]);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isAvailable && !isDisabled) {
    return null;
  }

  if (isDisabled || !isAvailable) {
    return (
      <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm font-medium mb-2">
        <Clock className="w-4 h-4" />
        <span>
          {timeLeft > 0 
            ? `Следующий бесплатный кейс через: ${formatTime(timeLeft)}`
            : 'Загрузка...'
          }
        </span>
      </div>
    );
  }

  return null;
};

export default FreeCaseTimer;
