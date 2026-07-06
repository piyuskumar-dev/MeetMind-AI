import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-accent-success" />,
    error: <AlertCircle className="w-5 h-5 text-accent-danger" />,
    info: <Info className="w-5 h-5 text-accent-cyan" />,
  };

  const bgColors = {
    success: 'bg-[#111118]/95 border-accent-success/30 text-white',
    error: 'bg-[#111118]/95 border-accent-danger/30 text-white',
    info: 'bg-[#111118]/95 border-accent-cyan/30 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border glass shadow-2xl ${bgColors[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-2"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
export default Toast;
