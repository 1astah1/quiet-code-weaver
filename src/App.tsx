
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import LoadingScreen from "@/components/LoadingScreen";
import MainApp from "@/components/MainApp";

// Оптимизированная конфигурация QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Быстрая загрузка - уменьшаем время загрузки
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Предзагрузка критических стилей
    const preloadStyles = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/index.css';
      link.as = 'style';
      document.head.appendChild(link);
    };

    preloadStyles();

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black overflow-hidden">
            {isLoading ? <LoadingScreen /> : <MainApp />}
            <Toaster />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
