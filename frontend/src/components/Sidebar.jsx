import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Video, Trash2, MessageSquare, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const Sidebar = ({
  isDashboard = false,
  onSelectJob = null,
  activeJobId = null,
  mobileOpen = false,
  onCloseMobile = null,
}) => {
  const { jobHistory, removeJobFromHistory } = useApp();
  const navigate = useNavigate();

  const handleJobClick = (job) => {
    onSelectJob ? onSelectJob(job) : navigate('/results', { state: { job } });
    onCloseMobile?.();
  };

  const handleChatClick = (job, e) => {
    e.stopPropagation();
    navigate('/chat', { state: { job } });
    onCloseMobile?.();
  };

  const renderContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Analysis History
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {jobHistory.length}
          </span>
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
        <AnimatePresence initial={false}>
          {jobHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
            >
              <Video className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No analyzed meetings yet. Upload a recording to populate your workspace history.
              </p>
            </motion.div>
          ) : (
            jobHistory.map((job) => {
              const isSelected = activeJobId === job.id;
              return (
                <motion.button
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleJobClick(job)}
                  className={`group relative w-full text-left rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100 shadow-subtle'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111827]'
                  }`}
                >
                  <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 text-slate-900 dark:text-slate-100" title={job.result?.title || 'Job Output'}>
                    {job.result?.title || 'Processing Job'}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-mono">
                    {job.source}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {job.language}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(job.timestamp)}
                    </span>
                    <span className="flex-1" />
                    <span
                      role="button"
                      onClick={(e) => handleChatClick(job, e)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center gap-1 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </span>
                  </div>

                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeJobFromHistory(job.id);
                    }}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete history item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="w-72 xl:w-80 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0B0F17] h-[calc(100vh-3.5rem)] overflow-hidden hidden lg:flex flex-col p-3.5 transition-colors duration-200">
        {renderContent(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-[#0B0F17] z-50 flex flex-col p-4 shadow-xl border-r border-slate-200 dark:border-slate-800 lg:hidden"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

