import { useState, useEffect, useCallback, createContext, useContext, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X, Wifi, WifiOff } from 'lucide-react';

// ═══════════════════════════════════════════════════
// Toast Types
// ═══════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

// ═══════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// ═══════════════════════════════════════════════════
// Toast Item Component
// ═══════════════════════════════════════════════════

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; glow: string }> = {
  success: {
    bg: 'rgba(0, 255, 163, 0.08)',
    border: 'rgba(0, 255, 163, 0.25)',
    icon: '#00FFA3',
    glow: '0 0 20px rgba(0, 255, 163, 0.15)',
  },
  error: {
    bg: 'rgba(255, 71, 87, 0.08)',
    border: 'rgba(255, 71, 87, 0.25)',
    icon: '#FF4757',
    glow: '0 0 20px rgba(255, 71, 87, 0.15)',
  },
  warning: {
    bg: 'rgba(255, 159, 67, 0.08)',
    border: 'rgba(255, 159, 67, 0.25)',
    icon: '#FF9F43',
    glow: '0 0 20px rgba(255, 159, 67, 0.15)',
  },
  info: {
    bg: 'rgba(54, 162, 235, 0.08)',
    border: 'rgba(54, 162, 235, 0.25)',
    icon: '#36A2EB',
    glow: '0 0 20px rgba(54, 162, 235, 0.15)',
  },
};

const ToastItem: FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const colors = COLORS[toast.type];

  useEffect(() => {
    const duration = toast.duration || (toast.type === 'error' ? 6000 : 4000);
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-full max-w-sm rounded-2xl border backdrop-blur-xl overflow-hidden"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: colors.glow + ', 0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5" style={{ color: colors.icon }}>
          {ICONS[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-color)' }}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-xs font-bold mt-2 underline underline-offset-2"
              style={{ color: colors.icon }}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-color)' }} />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || (toast.type === 'error' ? 6000 : 4000)) / 1000, ease: 'linear' }}
        className="h-0.5 origin-left"
        style={{ backgroundColor: colors.icon }}
      />
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════
// Toast Provider
// ═══════════════════════════════════════════════════

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts(prev => {
      // Limit to 5 toasts max, remove oldest if needed
      const updated = [...prev, { ...toast, id }];
      return updated.length > 5 ? updated.slice(-5) : updated;
    });
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, dismiss }}>
      {children}

      {/* Toast Container — fixed top-center, above everything */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
           style={{ paddingTop: 'env(safe-area-inset-top, 0px)', maxWidth: '420px', width: '100%' }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto w-full px-4">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
