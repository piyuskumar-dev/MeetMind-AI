import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Video, Trash2, ArrowLeft, MessageSquare, ListTodo, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = ({ isDashboard = false, onSelectJob = null, activeJobId = null }) => {
  const { jobHistory, removeJobFromHistory } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleJobClick = (job) => {
    if (onSelectJob) {
      onSelectJob(job);
    } else {
      navigate('/results', { state: { job } });
    }
  };

  const handleChatClick = (job) => {
    navigate('/chat', { state: { job } });
  };

  return (
    <aside className="w-80 border-r border-border-light dark:border-border-dark bg-white dark:bg-[#111118] h-[calc(100vh-4rem)] overflow-y-auto hidden lg:flex flex-col p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-syne text-md font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Analysis History
        </h2>
        <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
          {jobHistory.length}
        </span>
      </div>

      <div className="flex-1 space-y-2">
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
                      : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-surface-dark2/50'
                  }`}
                  onClick={() => handleJobClick(job)}
                >
                  <div className="pr-8">
                    <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-white" title={job.result?.title || 'Job Output'}>
                      {job.result?.title || 'Processing Job'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
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
                    className="absolute top-3 right-3 text-gray-400 hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-dark bg-transparent"
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
    </aside>
  );
};
