import { useContext, createContext, useState, ReactNode } from "react";

// Тип для одного тоста
export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ReactNode;
}

// Контекст для тостов
const ToastContext = createContext<{
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, "id">) => void;
  hideToast: (id: string) => void;
} | null>(null);

// Провайдер для оборачивания приложения
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Хук для использования тостов
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    toasts: ctx.toasts,
    toast: ctx.showToast,
    hideToast: ctx.hideToast,
  };
}

// Быстрая функция для показа тоста (можно доработать под ваши нужды)
export function toast(toast: Omit<ToastData, "id">) {
  // Для глобального вызова — не реализовано, только через useToast
  // Можно реализовать через event bus или window, если нужно
  console.warn("toast() должен вызываться через useToast().toast внутри компонента");
}
