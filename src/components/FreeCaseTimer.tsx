
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
  console.log('⏰ [FREE_CASE_TIMER] Component mounting:', {
    lastOpenTime,
    isDisabled,
    userId,
    caseId
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastFreeOpen, setLastFreeOpen] = useState<string | null>(lastOpenTime);

  useEffect(() => {
    const checkTimer = async () => {
      try {
        console.log('🔍 [FREE_CASE_TIMER] Checking timer status...');
        
        // Получаем информацию о пользователе и кейсе
        const [userResponse, caseResponse] = await Promise.all([
          supabase
            .from('users')
            .select('last_free_case_notification')
            .eq('id', userId)
            .single(),
          supabase
            .from('cases')
            .select('created_at')
            .eq('id', caseId)
            .single()
        ]);

        if (userResponse.error) {
          console.error('❌ [FREE_CASE_TIMER] Error fetching user data:', userResponse.error);
          return;
        }

        if (caseResponse.error) {
          console.error('❌ [FREE_CASE_TIMER] Error fetching case data:', caseResponse.error);
          return;
        }

        const serverLastOpen = userResponse.data?.last_free_case_notification;
        const caseCreatedAt = caseResponse.data?.created_at;
        
        console.log('📊 [FREE_CASE_TIMER] Data:', {
          serverLastOpen,
          caseCreatedAt
        });
        
        if (!serverLastOpen) {
          console.log('✅ [FREE_CASE_TIMER] No previous free case, available immediately');
          setIsAvailable(true);
          setTimeLeft(0);
          onTimerComplete();
          return;
        }

        const lastOpen = new Date(serverLastOpen);
        const caseCreated = new Date(caseCreatedAt);
        const now = new Date();
        
        // Если кейс был создан после последнего открытия бесплатного кейса, он доступен сразу
        if (caseCreated > lastOpen) {
          console.log('🆕 [FREE_CASE_TIMER] Case is newer than last free open, available immediately');
          setIsAvailable(true);
          setTimeLeft(0);
          onTimerComplete();
          return;
        }

        const timeDiff = now.getTime() - lastOpen.getTime();
        const eightHours = 8 * 60 * 60 * 1000; // 8 часов в миллисекундах

        console.log('⏱️ [FREE_CASE_TIMER] Time calculation:', {
          lastOpen: lastOpen.toISOString(),
          now: now.toISOString(),
          timeDiff,
          eightHours,
          isAvailable: timeDiff >= eightHours
        });

        if (timeDiff >= eightHours) {
          console.log('✅ [FREE_CASE_TIMER] Timer completed, case available');
          setIsAvailable(true);
          setTimeLeft(0);
          onTimerComplete();
        } else {
          console.log('⏳ [FREE_CASE_TIMER] Timer still running');
          setIsAvailable(false);
          const remaining = eightHours - timeDiff;
          setTimeLeft(remaining);
        }

        setLastFreeOpen(serverLastOpen);
      } catch (error) {
        console.error('💥 [FREE_CASE_TIMER] Timer check error:', error);
      }
    };

    console.log('🔄 [FREE_CASE_TIMER] Setting up timer checks...');
    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => {
      console.log('🛑 [FREE_CASE_TIMER] Cleaning up timer');
      clearInterval(interval);
    };
  }, [userId, caseId, onTimerComplete]);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log('🕐 [FREE_CASE_TIMER] Formatted time:', { milliseconds, formatted });
    return formatted;
  };

  console.log('🎨 [FREE_CASE_TIMER] Rendering:', {
    isAvailable,
    isDisabled,
    timeLeft,
    shouldRender: !isAvailable || isDisabled
  });

  if (isAvailable && !isDisabled) {
    console.log('🚫 [FREE_CASE_TIMER] Not rendering (available and not disabled)');
    return null;
  }

  if (isDisabled || !isAvailable) {
    console.log('✅ [FREE_CASE_TIMER] Rendering timer display');
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

  console.log('🚫 [FREE_CASE_TIMER] Not rendering (fallthrough)');
  return null;
};

export default FreeCaseTimer;
