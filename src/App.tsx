
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import MainApp from "@/components/MainApp";
import WebViewOptimizer from "@/components/WebViewOptimizer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    }
  }
});

const App = () => {
  console.log('🚀 [APP] App component rendering/mounting');

  // Логирование ошибок JavaScript
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

  console.log('🎨 [APP] Rendering app');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <WebViewOptimizer />
          <div className="min-h-screen bg-black overflow-hidden">
            <MainApp />
            <Toaster />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
