import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import CS2CaseOpening from '../CS2CaseOpening';

interface FreeCaseTimerProps {
  caseId: string;
  caseName: string;
  onCaseOpened?: (caseData: any) => void;
}

const FreeCaseTimer: React.FC<FreeCaseTimerProps> = ({
  caseId,
  caseName,
  onCaseOpened
}) => {
  const { user } = useSecureAuth();
  const [timeLeft, setTimeLeft] = useState<number>(8 * 60 * 60 * 1000); // Start with full time
  const [canOpen, setCanOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkLastOpenTime = useCallback(async () => {
    if (!user?.id || !caseId) return;

    setIsLoading(true);
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
        setCanOpen(false); // Assume cannot open on error
        return;
      }

      if (data?.opened_at) {
        const openTime = new Date(data.opened_at);
        const now = new Date();
        const timeDiff = now.getTime() - openTime.getTime();
        const eightHours = 8 * 60 * 60 * 1000;

        if (timeDiff < eightHours) {
          setTimeLeft(eightHours - timeDiff);
          setCanOpen(false);
        } else {
          setCanOpen(true);
          setTimeLeft(0);
        }
      } else {
        setCanOpen(true);
        setTimeLeft(0);
      }
    } catch (error) {
      console.error('Error in checkLastOpenTime:', error);
      setCanOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, caseId]);

  useEffect(() => {
    checkLastOpenTime();
  }, [checkLastOpenTime]);

  useEffect(() => {
    if (canOpen || isLoading) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          setCanOpen(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canOpen, isLoading]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };

  const handleOpenFreeCase = () => {
    if (!user) return;
    setIsOpening(true);
  };

  const handleCloseOpening = () => {
    setIsOpening(false);
    // After closing, re-check the timer immediately
    checkLastOpenTime();
  };
  
  const handleBalanceUpdate = () => {
    // This function can be used if balance needs to be updated from opening modal
  }

  if (!user) return null;

  if (isLoading) {
    return (
      <Button disabled className="w-full bg-slate-600 text-slate-400">
        <Clock className="w-4 h-4 mr-2" />
        Загрузка...
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {canOpen ? (
        <Button
          onClick={handleOpenFreeCase}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Бесплатно
        </Button>
      ) : (
        <Button
          disabled
          className="w-full bg-slate-600 text-slate-400 cursor-not-allowed"
        >
          <Clock className="w-4 h-4 mr-2" />
          Доступно через {formatTime(timeLeft)}
        </Button>
      )}

      {isOpening && user && (
        <CS2CaseOpening
          userId={user.id}
          caseId={caseId}
          onClose={handleCloseOpening}
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}
    </div>
  );
};

export default FreeCaseTimer;
