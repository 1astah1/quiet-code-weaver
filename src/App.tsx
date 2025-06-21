
import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import OptimizedLoadingScreen from "@/components/OptimizedLoadingScreen";
import MainApp from "@/components/MainApp";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import { createOptimizedQueryClient } from "@/utils/queryOptimization";

// Создаем оптимизированный QueryClient один раз
const queryClient = createOptimizedQueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    // Предзагрузка критических стилей
    const preloadStyles = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/index.css';
      link.as = 'style';
      link.onload = () => link.remove();
      document.head.appendChild(link);
    };

    preloadStyles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black overflow-hidden">
            <ConnectionStatus />
            {isLoading ? (
              <OptimizedLoadingScreen onLoadingComplete={handleLoadingComplete} />
            ) : (
              <MainApp />
            )}
            <Toaster />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
