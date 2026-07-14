import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  FileText, Download, Share2, MessageSquare,
  ChevronRight, Calendar, Copy, Check, ChevronUp,
  ChevronDown, BarChart3, HelpCircle, ListTodo, FileCode, CheckCircle2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from '../utils/markdown';

export const ResultsDashboard = () => {
  const { activeJob, setActiveJob, jobHistory } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [collapsedStates, setCollapsedStates] = useState({
    summary: false,
    action_items: false,
    decisions: false,
    questions: false,
    stats: false,
    transcript: true,
  });

  useEffect(() => {
    if (location.state?.job) {
      setSelectedJob(location.state.job);
      setActiveJob(location.state.job);
      window.history.replaceState({}, document.title);
    } else if (activeJob) {
      setSelectedJob(activeJob);
    } else if (jobHistory.length > 0) {
      setSelectedJob(jobHistory[0]);
      setActiveJob(jobHistory[0]);
    }
  }, [location.state, activeJob, jobHistory, setActiveJob]);

  if (!selectedJob) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl" />
        <FileText className="w-16 h-16 text-zinc-400 opacity-40 mb-4" />
        <h2 className="font-syne text-xl font-bold mb-2 text-zinc-900 dark:text-white">No Active Analysis Selected</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
          Process a meeting recording to generate a dashboard.
        </p>
        <Link
          to="/process"
          className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          Start Analysis
        </Link>
      </div>
    );
  }

  const showToast = (message, type = 'success') => setToast({ message, type });

  const toggleCollapse = (cardId) =>
    setCollapsedStates((prev) => ({ ...prev, [cardId]: !prev[cardId] }));

  const copyToClipboard = async (text, cardId) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopiedStates((prev) => ({ ...prev, [cardId]: true }));
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedStates((prev) => ({ ...prev, [cardId]: false })), 2000);
    } catch {
      showToast('Clipboard access denied', 'error');
    }
  };

  const downloadBlob = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const slug = (s) => (s || 'meeting').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const downloadMarkdown = () => {
    const r = selectedJob.result || {};
    const title = r.title || 'Meeting Summary';
    const md = `# ${title}

Source: ${selectedJob.source}
Date: ${new Date(selectedJob.timestamp || Date.now()).toLocaleString()}
Language: ${selectedJob.language}

## Summary
${r.summary || ''}

## Action Items
${r.action_items || ''}

## Key Decisions
${r.decisions || r.key_decisions || ''}

## Open Questions
${r.questions || r.open_questions || ''}
`;
    downloadBlob(md, `${slug(title)}_summary.md`, 'text/markdown;charset=utf-8;');
    showToast('Markdown downloaded!');
  };

  const downloadPDF = () => {
    const r = selectedJob.result || {};
    const title = r.title || 'Meeting Summary';
    const escape = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Popup blocked — allow popups to print', 'error');
      return;
    }
    win.document.write(`<!doctype html><html><head><title>${escape(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; padding: 48px; color: #1f2937; line-height: 1.65; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; color: #6d28d9; border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin: 0 0 8px; }
  h2 { font-size: 16px; font-weight: 700; color: #6d28d9; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 24px 0 8px; }
  .meta { font-size: 11px; color: #6b7280; display: flex; gap: 16px; margin-bottom: 24px; }
  .section { page-break-inside: avoid; margin-bottom: 20px; }
  pre { white-space: pre-wrap; font-family: 'Inter', sans-serif; font-size: 12px; color: #374151; line-height: 1.7; margin: 0; }
</style>
</head><body>
<h1>${escape(title)}</h1>
<div class="meta">
  <span><strong>Source:</strong> ${escape(selectedJob.source)}</span>
  <span><strong>Date:</strong> ${new Date(selectedJob.timestamp || Date.now()).toLocaleDateString()}</span>
</div>
<div class="section"><h2>Summary</h2><pre>${escape(r.summary)}</pre></div>
<div class="section"><h2>Action Items</h2><pre>${escape(r.action_items)}</pre></div>
<div class="section"><h2>Key Decisions</h2><pre>${escape(r.decisions || r.key_decisions)}</pre></div>
<div class="section"><h2>Open Questions</h2><pre>${escape(r.questions || r.open_questions)}</pre></div>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},250)};</script>
</body></html>`);
    win.document.close();
    showToast('Compiling print preview…');
  };

  const getShareLink = () => `${window.location.origin}/results?job_id=${selectedJob.id}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      showToast('Share link copied!');
      setIsShareModalOpen(false);
    } catch {
      showToast('Clipboard access denied', 'error');
    }
  };

  const getTranscriptStats = () => {
    const text = selectedJob.transcript || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(Math.round(words / 140), 1);
    const readTime = Math.max(Math.round(words / 250), 1);
    const countItems = (str) => {
      if (!str) return 0;
      return String(str).split('\n').filter((l) => /^\d+\.\s|^\s*-\s/.test(l.trim())).length;
    };
    return {
      words,
      minutes,
      readTime,
      actions: countItems(selectedJob.result?.action_items),
      decisions: countItems(selectedJob.result?.decisions || selectedJob.result?.key_decisions),
      questions: countItems(selectedJob.result?.questions || selectedJob.result?.open_questions),
    };
  };
  const stats = getTranscriptStats();

  // Card render
  const renderCard = (cardId, title, icon, content, colorClass, rawText, bodyClassName = '') => {
    const isCollapsed = collapsedStates[cardId];
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md relative group flex flex-col transition-colors overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${colorClass}`}>
              {icon}
            </div>
            <h3 className="font-syne text-xs uppercase tracking-[0.12em] font-extrabold text-zinc-800 dark:text-white">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyToClipboard(rawText || content, cardId)}
              className="text-zinc-400 hover:text-violet-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={`Copy ${title}`}
            >
              {copiedStates[cardId] ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                downloadBlob(rawText || content, `${slug(title)}.txt`, 'text/plain;charset=utf-8;');
                showToast(`${title} exported`);
              }}
              className="text-zinc-400 hover:text-violet-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={`Download ${title}`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleCollapse(cardId)}
              className="text-zinc-400 hover:text-violet-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className={`pt-5 border-t border-zinc-200 dark:border-zinc-800 mt-4 ${bodyClassName}`}>
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex transition-colors duration-300 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -right-20 w-[420px] h-[420px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/10 blur-3xl" />

      <Sidebar
        isDashboard
        activeJobId={selectedJob.id}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-5xl mx-auto relative z-10 w-full">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-300 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            <History className="w-4 h-4" />
            History ({jobHistory.length})
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono tracking-[0.12em] mb-1.5 uppercase">
              <Calendar className="w-3.5 h-3.5 text-violet-500" />
              <span>{new Date(selectedJob.timestamp || Date.now()).toLocaleString()}</span>
              <span>•</span>
              <span className="bg-violet-500/10 text-violet-600 dark:text-violet-300 font-semibold px-2 py-0.5 rounded-full capitalize">
                {selectedJob.language}
              </span>
            </div>
            <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">
              {selectedJob.result?.title || 'Meeting Summary'}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
              title="Download full report as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-violet-500" />
              Markdown
            </button>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
              title="Print-ready PDF layout"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              PDF
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
              title="Share report link"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              Share
            </button>
            <button
              onClick={() => navigate('/chat', { state: { job: selectedJob } })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-white bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 hover:shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-shadow"
              title="Ask AI about this meeting"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {renderCard(
            'summary',
            'Executive Summary',
            <FileText className="w-4 h-4" />,
            <Markdown text={selectedJob.result?.summary} />,
            'text-violet-500',
            selectedJob.result?.summary
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderCard(
              'action_items',
              'Action Items',
              <ListTodo className="w-4 h-4" />,
              <Markdown text={selectedJob.result?.action_items} />,
              'text-cyan-500',
              selectedJob.result?.action_items
            )}
            {renderCard(
              'decisions',
              'Key Decisions',
              <CheckCircle2 className="w-4 h-4" />,
              <Markdown text={selectedJob.result?.decisions || selectedJob.result?.key_decisions} />,
              'text-emerald-500',
              selectedJob.result?.decisions || selectedJob.result?.key_decisions
            )}
            {renderCard(
              'questions',
              'Open Questions',
              <HelpCircle className="w-4 h-4" />,
              <Markdown text={selectedJob.result?.questions || selectedJob.result?.open_questions} />,
              'text-amber-500',
              selectedJob.result?.questions || selectedJob.result?.open_questions
            )}
          </div>

          {renderCard(
            'stats',
            'Meeting Statistics',
            <BarChart3 className="w-4 h-4" />,
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Word Count', value: stats.words.toLocaleString(), color: 'text-violet-500' },
                { label: 'Speaking Length', value: `~${stats.minutes} min`, color: 'text-cyan-500' },
                { label: 'Reading Time', value: `~${stats.readTime} min`, color: 'text-emerald-500' },
                { label: 'Action Items', value: stats.actions, color: 'text-zinc-900 dark:text-white' },
                { label: 'Decisions', value: stats.decisions, color: 'text-zinc-900 dark:text-white' },
                { label: 'Open Questions', value: stats.questions, color: 'text-zinc-900 dark:text-white' },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col justify-center">
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">{m.label}</span>
                  <span className={`font-mono text-lg font-bold mt-0.5 ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>,
            'text-violet-400',
            `Word Count: ${stats.words}\nSpeaking Length: ~${stats.minutes}m\nReading Time: ~${stats.readTime}m\nAction Items: ${stats.actions}\nDecisions: ${stats.decisions}\nOpen Questions: ${stats.questions}`
          )}

          {selectedJob.transcript && renderCard(
            'transcript',
            'Meeting Transcript',
            <FileCode className="w-4 h-4" />,
            <div className="max-h-80 overflow-y-auto text-xs text-zinc-400 font-mono leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800 select-text whitespace-pre-wrap">
              {selectedJob.transcript}
            </div>,
            'text-zinc-500',
            selectedJob.transcript
          )}
        </div>
      </main>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Dashboard">
        <div className="space-y-4">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            Copy the public link below to share this dashboard.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={getShareLink()}
              className="flex-1 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-xs outline-none select-all text-zinc-700 dark:text-zinc-300"
            />
            <button
              onClick={copyShareLink}
              className="px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ResultsDashboard;
