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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Analysis History
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300">
            {jobHistory.length}
          </span>
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
        <AnimatePresence initial={false}>
          {jobHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 px-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800"
            >
              <Video className="w-7 h-7 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No analyzed videos yet. Start a job to populate history.
              </p>
            </motion.div>
          ) : (
            jobHistory.map((job) => {
              const isSelected = activeJobId === job.id;
              return (
                <motion.button
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleJobClick(job)}
                  className={`group relative w-full text-left rounded-xl border p-3 transition-colors ${
                    isSelected
                      ? 'border-violet-500/60 bg-violet-500/10 dark:bg-violet-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-1 text-zinc-900 dark:text-zinc-100" title={job.result?.title || 'Job Output'}>
                    {job.result?.title || 'Processing Job'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 truncate font-mono">
                    {job.source}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 capitalize">
                      {job.language}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatDate(job.timestamp)}
                    </span>
                    <span className="flex-1" />
                    <span
                      role="button"
                      onClick={(e) => handleChatClick(job, e)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center gap-1 hover:bg-violet-500/25 transition-colors cursor-pointer"
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
                    className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
      <aside className="w-72 xl:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-[calc(100vh-4rem)] overflow-hidden hidden lg:flex flex-col p-4 transition-colors duration-300">
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
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-zinc-950 z-50 flex flex-col p-4 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 lg:hidden"
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
