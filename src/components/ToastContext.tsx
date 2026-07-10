import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastItem, { ToastConfig, ToastType } from './Toast';

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration?: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((config: ToastConfig) => {
    // Reset first so a new toast while one is visible triggers re-render
    setToast({ visible: false, message: '', type: 'info' });
    // Use a micro-delay so the state reset triggers the useEffect in ToastItem
    setTimeout(() => {
      setToast({
        visible: true,
        message: config.message,
        type: config.type,
        duration: config.duration,
      });
    }, 50);
  }, []);

  const handleHide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastItem
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={handleHide}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return ctx;
}
