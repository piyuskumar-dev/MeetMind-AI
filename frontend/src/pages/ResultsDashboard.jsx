import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  FileText, Download, Share2, MessageSquare,
  ChevronRight, Calendar, Copy, Check, ChevronUp,
  ChevronDown, BarChart3, HelpCircle, ListTodo, FileCode, CheckCircle2, History, ArrowRight
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
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-8 text-center transition-colors">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">No Meeting Selected</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
          Upload and process a meeting recording to generate an executive dashboard.
        </p>
        <Link
          to="/process"
          className="px-4 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-subtle flex items-center gap-1.5"
        >
          <span>Analyze Meeting</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
      showToast('Copied to clipboard');
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
    showToast('Markdown exported');
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
  body { font-family: 'Inter', system-ui, sans-serif; padding: 48px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin: 0 0 12px; }
  h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 24px 0 8px; }
  .meta { font-size: 11px; color: #64748b; display: flex; gap: 16px; margin-bottom: 24px; }
  .section { page-break-inside: avoid; margin-bottom: 20px; }
  pre { white-space: pre-wrap; font-family: 'Inter', sans-serif; font-size: 12px; color: #334155; line-height: 1.6; margin: 0; }
</style>
</head><body>
<h1>${escape(title)}</h1>
<div class="meta">
  <span><strong>Source:</strong> ${escape(selectedJob.source)}</span>
  <span><strong>Date:</strong> ${new Date(selectedJob.timestamp || Date.now()).toLocaleDateString()}</span>
</div>
<div class="section"><h2>Executive Summary</h2><pre>${escape(r.summary)}</pre></div>
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
      showToast('Share link copied to clipboard');
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

  const renderCard = (cardId, title, icon, content, rawText, bodyClassName = '') => {
    const isCollapsed = collapsedStates[cardId];
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="saas-card p-5 sm:p-6 relative flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {icon}
            </div>
            <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-200">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyToClipboard(rawText || content, cardId)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Copy ${title}`}
            >
              {copiedStates[cardId] ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                downloadBlob(rawText || content, `${slug(title)}.txt`, 'text/plain;charset=utf-8;');
                showToast(`${title} exported`);
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Download ${title}`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleCollapse(cardId)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className={`pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 ${bodyClassName}`}>
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] flex transition-colors duration-200">
      <Sidebar
        isDashboard
        activeJobId={selectedJob.id}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 p-5 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors shadow-subtle"
          >
            <History className="w-3.5 h-3.5" />
            History ({jobHistory.length})
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(selectedJob.timestamp || Date.now()).toLocaleString()}</span>
              <span>•</span>
              <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">
                {selectedJob.language}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {selectedJob.result?.title || 'Meeting Summary'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-subtle"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              Markdown
            </button>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-subtle"
              title="Export Print-ready PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-subtle"
              title="Share report"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={() => navigate('/chat', { state: { job: selectedJob } })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-subtle"
              title="Ask AI about this meeting"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Interactive Chat
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {renderCard(
            'summary',
            'Executive Summary',
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
            <Markdown text={selectedJob.result?.summary} />,
            selectedJob.result?.summary
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderCard(
              'action_items',
              'Action Items',
              <ListTodo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
              <Markdown text={selectedJob.result?.action_items} />,
              selectedJob.result?.action_items
            )}
            {renderCard(
              'decisions',
              'Key Decisions',
              <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
              <Markdown text={selectedJob.result?.decisions || selectedJob.result?.key_decisions} />,
              selectedJob.result?.decisions || selectedJob.result?.key_decisions
            )}
            {renderCard(
              'questions',
              'Open Questions',
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
              <Markdown text={selectedJob.result?.questions || selectedJob.result?.open_questions} />,
              selectedJob.result?.questions || selectedJob.result?.open_questions
            )}
          </div>

          {renderCard(
            'stats',
            'Meeting Analytics & Metrics',
            <BarChart3 className="w-4 h-4 text-slate-500" />,
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Word Count', value: stats.words.toLocaleString() },
                { label: 'Speaking Duration', value: `~${stats.minutes} min` },
                { label: 'Reading Duration', value: `~${stats.readTime} min` },
                { label: 'Action Items', value: stats.actions },
                { label: 'Key Decisions', value: stats.decisions },
                { label: 'Open Questions', value: stats.questions },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{m.label}</span>
                  <span className="font-mono text-base font-semibold block mt-0.5 text-slate-900 dark:text-white">{m.value}</span>
                </div>
              ))}
            </div>,
            `Word Count: ${stats.words}\nSpeaking Duration: ~${stats.minutes}m\nReading Duration: ~${stats.readTime}m\nAction Items: ${stats.actions}\nDecisions: ${stats.decisions}\nOpen Questions: ${stats.questions}`
          )}

          {selectedJob.transcript && renderCard(
            'transcript',
            'Transcript Document',
            <FileCode className="w-4 h-4 text-slate-500" />,
            <div className="max-h-72 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 select-text whitespace-pre-wrap">
              {selectedJob.transcript}
            </div>,
            selectedJob.transcript
          )}
        </div>
      </main>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Dashboard">
        <div className="space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Copy the direct URL to share this meeting dashboard with your team.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={getShareLink()}
              className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-xs outline-none select-all text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={copyShareLink}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
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

