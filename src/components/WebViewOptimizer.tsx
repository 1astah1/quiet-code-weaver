
import { useEffect } from 'react';

const WebViewOptimizer = () => {
  useEffect(() => {
    console.log('📱 [WEBVIEW_OPTIMIZER] Initializing WebView optimizations...');
    
    // Предотвращаем зум при двойном тапе
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchend', preventZoom, { passive: false });
    
    // Предотвращаем контекстное меню на длительном нажатии
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Предотвращаем выделение текста
    const preventSelection = (e: Event) => {
      if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('selectstart', preventSelection);
    
    // Оптимизация для iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      console.log('🍎 [WEBVIEW_OPTIMIZER] iOS detected, applying iOS optimizations');
      document.body.style.webkitUserSelect = 'none';
      document.body.style.webkitTouchCallout = 'none';
    }
    
    // Оптимизация для Android WebView
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isAndroid) {
      console.log('🤖 [WEBVIEW_OPTIMIZER] Android detected, applying Android optimizations');
      document.body.style.userSelect = 'none';
    }
    
    // Обработка изменения ориентации
    const handleOrientationChange = () => {
      console.log('📱 [WEBVIEW_OPTIMIZER] Orientation changed');
      // Небольшая задержка для корректного пересчета размеров
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Оптимизация скролла для лучшей производительности
    const optimizeScroll = () => {
      const scrollElements = document.querySelectorAll('[data-scroll-optimized]');
      scrollElements.forEach(element => {
        (element as HTMLElement).style.webkitOverflowScrolling = 'touch';
        (element as HTMLElement).style.overflowScrolling = 'touch';
      });
    };
    
    optimizeScroll();
    
    // Cleanup
    return () => {
      console.log('🧹 [WEBVIEW_OPTIMIZER] Cleaning up WebView optimizations');
      document.removeEventListener('touchend', preventZoom);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return null; // Этот компонент не рендерит ничего видимого
};

export default WebViewOptimizer;
