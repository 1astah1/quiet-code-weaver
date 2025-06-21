
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import LoadingScreen from "@/components/LoadingScreen";
import MainApp from "@/components/MainApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('🚨 [QUERY_CLIENT] Global query error:', error);
      },
      onSuccess: (data) => {
        console.log('✅ [QUERY_CLIENT] Global query success');
      }
    },
    mutations: {
      onError: (error) => {
        console.error('🚨 [QUERY_CLIENT] Global mutation error:', error);
      },
      onSuccess: (data) => {
        console.log('✅ [QUERY_CLIENT] Global mutation success');
      }
    }
  }
});

const App = () => {
  console.log('🚀 [APP] App component rendering/mounting');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('⏱️ [APP] Setting up loading timer...');
    const timer = setTimeout(() => {
      console.log('✅ [APP] Loading complete, showing main app');
      setIsLoading(false);
    }, 3000);

    return () => {
      console.log('🛑 [APP] Cleaning up loading timer');
      clearTimeout(timer);
    };
  }, []);

  // Логирование изменений состояния загрузки
  useEffect(() => {
    console.log('📊 [APP] Loading state changed:', { isLoading });
  }, [isLoading]);

  // Логирование ошибок JavaScript
  useEffect(() => {
    console.log('🛡️ [APP] Setting up global error handlers...');
    
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 [APP] Global JavaScript error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 [APP] Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.log('🛑 [APP] Removing global error handlers');
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  console.log('🎨 [APP] Rendering app with loading state:', { isLoading });

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
