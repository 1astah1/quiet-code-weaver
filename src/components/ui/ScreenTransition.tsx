
import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScreenTransitionProps {
  children: ReactNode;
  direction?: 'slide-left' | 'slide-right' | 'fade' | 'scale';
  duration?: number;
  isVisible?: boolean;
}

const ScreenTransition = ({ 
  children, 
  direction = 'fade', 
  duration = 300,
  isVisible = true 
}: ScreenTransitionProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) return null;

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all ease-out';
    
    switch (direction) {
      case 'slide-left':
        return cn(
          baseClasses,
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        );
      case 'slide-right':
        return cn(
          baseClasses,
          isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        );
      case 'scale':
        return cn(
          baseClasses,
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        );
      case 'fade':
      default:
        return cn(
          baseClasses,
          isAnimating ? 'opacity-100' : 'opacity-0'
        );
    }
  };

  return (
    <div 
      className={getTransitionClasses()}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export default ScreenTransition;
