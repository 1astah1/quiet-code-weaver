
import { useEffect, useRef } from 'react';

interface KeyboardHandlerOptions {
  onKeyboardShow?: (height: number) => void;
  onKeyboardHide?: () => void;
  adjustViewport?: boolean;
}

export const useKeyboardHandler = (options: KeyboardHandlerOptions = {}) => {
  const { onKeyboardShow, onKeyboardHide, adjustViewport = true } = options;
  const initialViewportHeight = useRef<number>(window.innerHeight);
  const isKeyboardOpen = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;
      const threshold = 150; // Минимальная высота для определения клавиатуры

      if (heightDifference > threshold && !isKeyboardOpen.current) {
        // Клавиатура открылась
        isKeyboardOpen.current = true;
        onKeyboardShow?.(heightDifference);
        
        if (adjustViewport) {
          document.body.style.height = `${currentHeight}px`;
          document.body.style.overflow = 'hidden';
        }
      } else if (heightDifference <= threshold && isKeyboardOpen.current) {
        // Клавиатура закрылась
        isKeyboardOpen.current = false;
        onKeyboardHide?.();
        
        if (adjustViewport) {
          document.body.style.height = '';
          document.body.style.overflow = '';
        }
      }
    };

    const handleVisualViewportChange = () => {
      if ('visualViewport' in window) {
        const viewport = window.visualViewport as any;
        const heightDifference = window.screen.height - viewport.height;
        
        if (heightDifference > 150 && !isKeyboardOpen.current) {
          isKeyboardOpen.current = true;
          onKeyboardShow?.(heightDifference);
        } else if (heightDifference <= 150 && isKeyboardOpen.current) {
          isKeyboardOpen.current = false;
          onKeyboardHide?.();
        }
      }
    };

    // Используем Visual Viewport API если доступен (более точный для мобильных)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisualViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      
      // Очищаем стили при размонтировании
      if (adjustViewport) {
        document.body.style.height = '';
        document.body.style.overflow = '';
      }
    };
  }, [onKeyboardShow, onKeyboardHide, adjustViewport]);

  return {
    isKeyboardOpen: isKeyboardOpen.current
  };
};
