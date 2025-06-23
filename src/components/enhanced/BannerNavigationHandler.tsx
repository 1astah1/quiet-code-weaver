
import { useCallback } from 'react';

interface BannerNavigationProps {
  onNavigate: (section: string) => void;
}

export const useBannerNavigation = ({ onNavigate }: BannerNavigationProps) => {
  const handleBannerAction = useCallback((action: string) => {
    console.log('🎯 Banner action triggered:', action);
    
    const actionMap: Record<string, string> = {
      'open_cases': 'skins',
      'view_tasks': 'tasks', 
      'view_inventory': 'inventory',
      'view_shop': 'skins',
      'view_quiz': 'quiz',
      'view_settings': 'settings',
      'view_premium': 'settings',
      'view_referrals': 'settings'
    };

    const targetSection = actionMap[action];
    
    if (targetSection) {
      console.log('✅ Navigating to:', targetSection);
      onNavigate(targetSection);
    } else {
      console.warn('⚠️ Unknown banner action:', action);
    }
  }, [onNavigate]);

  return { handleBannerAction };
};
