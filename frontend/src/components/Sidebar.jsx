import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Video, Trash2, ArrowLeft, MessageSquare, ListTodo, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = ({ 
  isDashboard = false, 
  onSelectJob = null, 
  activeJobId = null,
  mobileOpen = false,
  onCloseMobile = null
}) => {
  const { jobHistory, removeJobFromHistory } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleJobClick = (job) => {
    if (onSelectJob) {
      onSelectJob(job);
    } else {
      navigate('/results', { state: { job } });
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleChatClick = (job) => {
    navigate('/chat', { state: { job } });
    if (onCloseMobile) onCloseMobile();
  };

  const renderContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-syne text-md font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Analysis History
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
            {jobHistory.length}
          </span>
          {isMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161622] text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {jobHistory.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border-light dark:border-border-dark">
              <Video className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400">No analyzed videos yet. Go start a job!</p>
            </div>
          ) : (
            jobHistory.map((job) => {
              const isSelected = activeJobId === job.id;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-[#111118]/40'
                  }`}
                  onClick={() => handleJobClick(job)}
                >
                  <div className="pr-8">
                    <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-white" title={job.result?.title || 'Job Output'}>
                      {job.result?.title || 'Processing Job'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-mono text-[10px]">
                      Source: {job.source}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-accent-cyan/15 text-accent-cyan px-2 py-0.5 rounded font-mono capitalize">
                        {job.language}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChatClick(job);
                        }}
                        className="text-[10px] bg-accent/15 text-accent hover:bg-accent/25 px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Chat
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeJobFromHistory(job.id);
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-[#161622] bg-transparent"
                    title="Delete history item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-80 border-r border-border-light dark:border-border-dark bg-white dark:bg-[#111118] h-[calc(100vh-4rem)] overflow-y-auto hidden lg:flex flex-col p-4 transition-colors duration-300">
        {renderContent(false)}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-[#111118] z-50 flex flex-col p-4 shadow-2xl border-r border-border-light dark:border-border-dark lg:hidden"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
