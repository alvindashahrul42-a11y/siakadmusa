import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ── Singleton event bus ───────────────────────────────────────────────────────

type ToastListener = (toast: ToastItem) => void;
const listeners: ToastListener[] = [];

export const toast = {
  success: (title: string, message?: string, duration = 3500) =>
    emit({ type: 'success', title, message, duration }),
  error: (title: string, message?: string, duration = 5000) =>
    emit({ type: 'error', title, message, duration }),
  warning: (title: string, message?: string, duration = 4000) =>
    emit({ type: 'warning', title, message, duration }),
  info: (title: string, message?: string, duration = 3500) =>
    emit({ type: 'info', title, message, duration }),
};

function emit(opts: Omit<ToastItem, 'id'>) {
  const item: ToastItem = { ...opts, id: crypto.randomUUID() };
  listeners.forEach(fn => fn(item));
}

// ── ToastContainer component ──────────────────────────────────────────────────

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler: ToastListener = (item) => {
      setToasts(prev => [...prev, item]);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const remove = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {toasts.map(t => (
        <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

// ── Individual card ───────────────────────────────────────────────────────────

const CONFIG: Record<ToastType, {
  icon: React.ElementType;
  bar: string;
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
}> = {
  success: {
    icon: CheckCircle,
    bar: 'bg-emerald-500',
    bg: 'bg-white',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    titleColor: 'text-gray-800',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-500',
    bg: 'bg-white',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-gray-800',
  },
  warning: {
    icon: AlertCircle,
    bar: 'bg-amber-400',
    bg: 'bg-white',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    titleColor: 'text-gray-800',
  },
  info: {
    icon: Info,
    bar: 'bg-blue-500',
    bg: 'bg-white',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-gray-800',
  },
};

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { icon: Icon, bar, bg, border, iconColor, titleColor } = CONFIG[item.type];
  const duration = item.duration ?? 4000;

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  // Progress bar width animates from 100% -> 0%
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <div
      className={`
        pointer-events-auto w-full rounded-xl shadow-lg border overflow-hidden
        ${bg} ${border}
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
      role="alert"
    >
      {/* Progress bar */}
      <div className={`h-1 ${bar} transition-none`} style={{ width: `${progress}%` }} />

      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${titleColor}`}>{item.title}</p>
          {item.message && (
            <p className="text-xs text-gray-500 mt-0.5 font-mono break-all leading-relaxed">
              {item.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-1"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
