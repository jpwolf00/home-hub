'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Toast, useToast, ToastType } from './ToastContext';

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<ToastType, string> = {
  success: 'bg-green-500/90 border-green-400',
  error: 'bg-red-500/90 border-red-400',
  warning: 'bg-yellow-500/90 border-yellow-400',
  info: 'bg-blue-500/90 border-blue-400',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md ${colors[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-white text-lg">{icons[toast.type]}</span>
      <span className="text-white flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="text-white/70 hover:text-white transition-colors p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
