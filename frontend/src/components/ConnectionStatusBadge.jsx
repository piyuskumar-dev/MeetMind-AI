import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Coffee } from 'lucide-react';

const PULSE = {
  initial: { scale: 1, opacity: 1 },
  animate: { scale: [1, 1.6, 1], opacity: [1, 0, 1] },
  transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
};

const variants = {
  CONNECTED: {
    label: 'Connected',
    icon: Wifi,
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    ring: 'bg-emerald-400',
  },
  WAKING_UP: {
    label: 'Waking Up',
    icon: Coffee,
    dot: 'bg-amber-400',
    pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    ring: 'bg-amber-400',
  },
  CONNECTING: {
    label: 'Connecting…',
    icon: RefreshCw,
    dot: 'bg-amber-400',
    pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    ring: 'bg-amber-400',
    spin: true,
  },
  ERROR: {
    label: 'Connection Lost (Retrying)',
    icon: WifiOff,
    dot: 'bg-rose-400',
    pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    ring: 'bg-rose-400',
  },
  DISCONNECTED: {
    label: 'Disconnected',
    icon: WifiOff,
    dot: 'bg-zinc-400',
    pill: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    ring: 'bg-zinc-400',
  },
};

export const ConnectionStatusBadge = ({ status = 'DISCONNECTED' }) => {
  const v = variants[status] ?? variants.DISCONNECTED;
  const Icon = v.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-colors duration-300 ${v.pill}`}
    >
      {/* Pulsing dot for live states. Static dot for terminal states. */}
      {(status === 'CONNECTED' || status === 'WAKING_UP' || status === 'CONNECTING' || status === 'ERROR') && (
        <span className="relative inline-flex w-2 h-2">
          <motion.span
            className={`absolute inset-0 rounded-full ${v.ring}`}
            {...PULSE}
          />
          <span className={`relative inline-flex w-2 h-2 rounded-full ${v.dot}`} />
        </span>
      )}
      {status === 'DISCONNECTED' && <span className={`w-2 h-2 rounded-full ${v.dot}`} />}
      <Icon className={`w-3.5 h-3.5 ${v.spin ? 'animate-spin' : ''}`} />
      <span>{v.label}</span>
    </div>
  );
};

export default ConnectionStatusBadge;
