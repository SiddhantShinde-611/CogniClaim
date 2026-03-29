import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg bg-white transition-all',
              t.type === 'success' && 'border-green-200 bg-green-50',
              t.type === 'error' && 'border-red-200 bg-red-50',
              t.type === 'warning' && 'border-yellow-200 bg-yellow-50',
              t.type === 'info' && 'border-blue-200 bg-blue-50'
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
            <p className="text-sm text-text-primary flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
