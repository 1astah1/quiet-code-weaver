import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import AdModal from '@/components/ads/AdModal';
import { useCaseOpeningWithAd } from '@/hooks/useCaseOpeningWithAd';
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/ui/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FreeCaseTimerProps {
  caseId: string;
  caseName: string;
  onCaseOpened?: (result: any) => void;
}

const FreeCaseTimer: React.FC<FreeCaseTimerProps> = ({
  caseId,
  caseName,
  onCaseOpened
}) => {
  const { user } = useSecureAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [canOpen, setCanOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [lastOpenTime, setLastOpenTime] = useState<Date | null>(null);
  
  const caseOpeningMutation = useCaseOpeningWithAd();

  // Проверяем время последнего открытия бесплатного кейса
  useEffect(() => {
    if (!user?.id || !caseId) return;

    const checkLastOpenTime = async () => {
      try {
        const { data, error } = await supabase
          .from('user_free_case_openings')
          .select('opened_at')
          .eq('user_id', user.id)
          .eq('case_id', caseId)
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error checking last open time:', error);
          return;
        }

        if (data?.opened_at) {
          const openTime = new Date(data.opened_at);
          setLastOpenTime(openTime);
          
          const now = new Date();
          const timeDiff = now.getTime() - openTime.getTime();
          const eightHours = 8 * 60 * 60 * 1000; // 8 часов в миллисекундах
          
          if (timeDiff < eightHours) {
            setTimeLeft(eightHours - timeDiff);
            setCanOpen(false);
          } else {
            setCanOpen(true);
            setTimeLeft(0);
          }
        } else {
          // Если никогда не открывал этот кейс
          setCanOpen(true);
          setTimeLeft(0);
        }
      } catch (error) {
        console.error('Error in checkLastOpenTime:', error);
      }
    };

    checkLastOpenTime();
  }, [user?.id, caseId]);

  // Обновляем таймер каждую секунду
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1000) {
          setCanOpen(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${seconds}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    } else {
      return `${seconds}с`;
    }
  };

  const handleWatchAd = () => {
    setIsAdModalOpen(true);
  };

  const handleAdWatched = async () => {
    setIsAdModalOpen(false);
    
    if (!user?.id) return;

    try {
      const result = await caseOpeningMutation.mutateAsync({
        userId: user.id,
        caseId: caseId,
        isFree: true,
        adWatched: true
      });

      if (result.success && onCaseOpened) {
        onCaseOpened(result);
        
        // Обновляем время последнего открытия
        setLastOpenTime(new Date());
        setTimeLeft(8 * 60 * 60 * 1000); // 8 часов
        setCanOpen(false);
      }
    } catch (error) {
      console.error('Error opening free case:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-2">
      {canOpen ? (
        <Button
          onClick={handleWatchAd}
          disabled={caseOpeningMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          {caseOpeningMutation.isPending ? 'Открываем...' : 'Бесплатно (с рекламой)'}
        </Button>
      ) : (
        <Button
          disabled
          className="w-full bg-slate-600 text-slate-400 cursor-not-allowed"
        >
          <Clock className="w-4 h-4 mr-2" />
          {timeLeft ? `Доступно через ${formatTime(timeLeft)}` : 'Загрузка...'}
        </Button>
      )}

      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onAdWatched={handleAdWatched}
        caseName={caseName}
      />
    </div>
  );
};

export default FreeCaseTimer;
