import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-white dark:bg-[#111118] p-8 rounded-3xl max-w-sm space-y-6 shadow-xl border border-border-light dark:border-border-dark"
      >
        <HelpCircle className="w-16 h-16 text-accent mx-auto animate-bounce" />
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-gray-900 dark:text-white">Page Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 w-full p-3 rounded-xl font-bold text-white bg-accent hover:bg-opacity-95 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};
export default NotFound;
