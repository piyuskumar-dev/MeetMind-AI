import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Coffee } from 'lucide-react';

const PULSE = {
  initial: { scale: 1, opacity: 1 },
  animate: { scale: [1, 1.5, 1], opacity: [1, 0, 1] },
  transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
};

const variants = {
  CONNECTED: {
    label: 'Connected',
    icon: Wifi,
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    ring: 'bg-emerald-500',
  },
  WAKING_UP: {
    label: 'Starting Up',
    icon: Coffee,
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    ring: 'bg-amber-500',
  },
  CONNECTING: {
    label: 'Connecting…',
    icon: RefreshCw,
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    ring: 'bg-amber-500',
    spin: true,
  },
  ERROR: {
    label: 'Retrying Connection',
    icon: WifiOff,
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    ring: 'bg-rose-500',
  },
  DISCONNECTED: {
    label: 'Offline',
    icon: WifiOff,
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    ring: 'bg-slate-400',
  },
};

export const ConnectionStatusBadge = ({ status = 'DISCONNECTED' }) => {
  const v = variants[status] ?? variants.DISCONNECTED;
  const Icon = v.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-colors duration-200 ${v.pill}`}
    >
      {(status === 'CONNECTED' || status === 'WAKING_UP' || status === 'CONNECTING' || status === 'ERROR') && (
        <span className="relative inline-flex w-1.5 h-1.5">
          <motion.span
            className={`absolute inset-0 rounded-full ${v.ring}`}
            {...PULSE}
          />
          <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${v.dot}`} />
        </span>
      )}
      {status === 'DISCONNECTED' && <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />}
      <Icon className={`w-3 h-3 ${v.spin ? 'animate-spin' : ''}`} />
      <span>{v.label}</span>
    </div>
  );
};

export default ConnectionStatusBadge;

