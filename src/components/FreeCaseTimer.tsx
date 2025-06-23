
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FreeCaseTimerProps {
  lastOpenTime: string | null;
  onTimerComplete: () => void;
  isDisabled: boolean;
  userId: string;
  caseId: string;
}

const FreeCaseTimer = ({ onTimerComplete, userId, caseId }: FreeCaseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canOpen, setCanOpen] = useState(false);

  // Query to get the last opening time for this specific case
  const { data: lastOpeningData } = useQuery({
    queryKey: ['free-case-timer', userId, caseId],
    queryFn: async () => {
      try {
        console.log('🕒 Checking free case timer for user:', userId, 'case:', caseId);
        
        const { data, error } = await supabase
          .from('user_free_case_openings')
          .select('opened_at')
          .eq('user_id', userId)
          .eq('case_id', caseId)
          .order('opened_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Error fetching free case timer:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('❌ Free case timer query error:', error);
        return null;
      }
    },
    enabled: !!userId && !!caseId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0 // Always check for fresh data
  });

  useEffect(() => {
    const updateTimer = () => {
      if (!lastOpeningData?.opened_at) {
        // No previous opening found, can open immediately
        setCanOpen(true);
        setTimeLeft(0);
        onTimerComplete();
        return;
      }

      const lastOpenTime = new Date(lastOpeningData.opened_at);
      const now = new Date();
      const timeDiff = now.getTime() - lastOpenTime.getTime();
      const cooldownPeriod = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const remaining = cooldownPeriod - timeDiff;

      if (remaining <= 0) {
        setCanOpen(true);
        setTimeLeft(0);
        onTimerComplete();
      } else {
        setCanOpen(false);
        setTimeLeft(remaining);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastOpeningData, onTimerComplete]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${seconds}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    } else {
      return `${seconds}с`;
    }
  };

  if (canOpen) {
    return (
      <div className="text-center mb-3">
        <div className="text-green-400 text-sm font-medium">
          ✅ Доступно для открытия
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-3">
      <div className="text-orange-400 text-sm font-medium mb-1">
        ⏰ Следующее открытие через:
      </div>
      <div className="text-white text-sm font-mono">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};

export default FreeCaseTimer;
