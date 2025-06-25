import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: { type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options?: { type?: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type: options?.type, duration: options?.duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options?.duration || 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastContainer = ({ toasts }: { toasts?: Toast[] }) => {
  if (!toasts) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            minWidth: 200,
            padding: '12px 20px',
            borderRadius: 8,
            color: '#fff',
            background: toast.type === 'error' ? '#e74c3c' : toast.type === 'success' ? '#27ae60' : '#333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontWeight: 500,
            fontSize: 16,
            opacity: 0.95,
            transition: 'all 0.3s',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}; 