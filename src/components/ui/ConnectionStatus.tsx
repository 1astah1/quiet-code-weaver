
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { connectionOptimizer } from '@/utils/connectionOptimizer';

const ConnectionStatus = () => {
  const [connectionQuality, setConnectionQuality] = useState(
    connectionOptimizer.getConnectionQuality()
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Проверяем качество соединения каждые 30 секунд
    const interval = setInterval(() => {
      setConnectionQuality(connectionOptimizer.getConnectionQuality());
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-16 right-4 z-50 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        Нет соединения
      </div>
    );
  }

  if (connectionQuality === 'slow') {
    return (
      <div className="fixed top-16 right-4 z-50 bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
        <Signal className="w-4 h-4" />
        Медленное соединение
      </div>
    );
  }

  return null;
};

export default ConnectionStatus;
