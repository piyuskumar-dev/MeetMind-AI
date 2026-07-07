import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { 
  FileText, Clipboard, Download, Share2, MessageSquare, 
  ChevronRight, Calendar, ArrowLeft, Copy, Check, ChevronUp, 
  ChevronDown, BarChart3, HelpCircle, ListTodo, FileCode, CheckCircle2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ResultsDashboard = () => {
  const { activeJob, setActiveJob, jobHistory } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Selected job state
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Card collapsible states (transcript collapsed by default, others expanded)
  const [collapsedStates, setCollapsedStates] = useState({
    summary: false,
    action_items: false,
    decisions: false,
    questions: false,
    stats: false,
    transcript: true
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
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="ambient-glow -top-20 -left-20 opacity-30" />
        <FileText className="w-16 h-16 text-gray-400 opacity-40 mb-4 animate-pulse-slow" />
        <h2 className="font-syne text-xl font-bold mb-2">No Active Analysis Selected</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
          It looks like you haven't processed any meetings yet. Start an analysis job to generate dashboards.
        </p>
        <Link to="/process" className="px-6 py-3 bg-accent text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-accent/25 transition-all">
          Start Analysis
        </Link>
      </div>
    );
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const toggleCollapse = (cardId) => {
    setCollapsedStates(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const copyToClipboard = (text, cardId) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [cardId]: true }));
    showToast('Copied to clipboard!');
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [cardId]: false }));
    }, 2000);
  };

  const downloadCardText = (title, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${title} exported as text!`);
  };

  const downloadMarkdown = () => {
    const markdownContent = `# ${selectedJob.result.title}

Source: ${selectedJob.source}
Date: ${new Date(selectedJob.timestamp || Date.now()).toLocaleString()}
Language: ${selectedJob.language}

## 📋 Executive Summary
${selectedJob.result.summary}

## ✅ Action Items
${selectedJob.result.action_items}

## 🔑 Key Decisions
${selectedJob.result.decisions || selectedJob.result.key_decisions}

## ❓ Open Questions
${selectedJob.result.questions || selectedJob.result.open_questions}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedJob.result.title.toLowerCase().replace(/\s+/g, '_')}_summary.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Markdown downloaded!');
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented PDF generation', 'error');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedJob.result.title}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            h1, h2 { font-family: 'Syne', sans-serif; }
            .section-block { page-break-inside: avoid; margin-bottom: 24px; }
            pre { white-space: pre-wrap; font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-white">
          <div class="max-w-3xl mx-auto">
            <h1 class="text-3xl font-extrabold text-purple-800 border-b-2 border-purple-800 pb-3 mb-2">${selectedJob.result.title}</h1>
            <div class="text-xs text-gray-500 mb-6 flex justify-between">
              <span><strong>Source:</strong> ${selectedJob.source}</span>
              <span><strong>Date:</strong> ${new Date(selectedJob.timestamp || Date.now()).toLocaleDateString()}</span>
            </div>
            
            <div class="section-block">
              <h2 class="text-lg font-bold text-purple-700 border-b border-gray-200 pb-1 mb-2">📋 Summary</h2>
              <pre class="text-sm text-gray-700 leading-relaxed font-sans">${selectedJob.result.summary}</pre>
            </div>
            
            <div class="section-block">
              <h2 class="text-lg font-bold text-purple-700 border-b border-gray-200 pb-1 mb-2">✅ Action Items</h2>
              <pre class="text-sm text-gray-700 leading-relaxed font-sans">${selectedJob.result.action_items}</pre>
            </div>
            
            <div class="section-block">
              <h2 class="text-lg font-bold text-purple-700 border-b border-gray-200 pb-1 mb-2">🔑 Key Decisions</h2>
              <pre class="text-sm text-gray-700 leading-relaxed font-sans">${selectedJob.result.decisions || selectedJob.result.key_decisions}</pre>
            </div>
            
            <div class="section-block">
              <h2 class="text-lg font-bold text-purple-700 border-b border-gray-200 pb-1 mb-2">❓ Open Questions</h2>
              <pre class="text-sm text-gray-700 leading-relaxed font-sans">${selectedJob.result.questions || selectedJob.result.open_questions}</pre>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Compiling PDF print dialog...');
  };

  const getShareLink = () => {
    return `${window.location.origin}/results?job_id=${selectedJob.id}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    showToast('Share link copied!');
    setIsShareModalOpen(false);
  };

  // Compute stats metrics dynamically from transcript
  const getTranscriptStats = () => {
    const text = selectedJob.transcript || '';
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Average speech speed is ~140 wpm
    const estimatedMinutes = Math.max(Math.round(wordCount / 140), 1);
    
    // Average reading speed is ~250 wpm
    const readTimeMinutes = Math.max(Math.round(wordCount / 250), 1);

    // Count action items & decisions (approx by line count in markdown strings)
    const countItems = (str) => {
      if (!str) return 0;
      const lines = str.split('\n');
      return lines.filter(l => /^\d+\.\s|^\s*-\s/.test(l.trim())).length;
    };

    return {
      words: wordCount,
      minutes: estimatedMinutes,
      readTime: readTimeMinutes,
      actions: countItems(selectedJob.result.action_items),
      decisions: countItems(selectedJob.result.decisions || selectedJob.result.key_decisions),
      questions: countItems(selectedJob.result.questions || selectedJob.result.open_questions)
    };
  };

  const stats = getTranscriptStats();

  // Rendering utility for cards
  const renderCard = (cardId, title, icon, content, colorClass, rawText) => {
    const isCollapsed = collapsedStates[cardId];
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6 dark:bg-[#111118]/80 backdrop-blur-md relative group flex flex-col transition-all overflow-hidden"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg bg-gray-100 dark:bg-[#161622] ${colorClass}`}>
              {icon}
            </div>
            <h3 className="font-syne text-xs uppercase tracking-wider font-extrabold text-gray-800 dark:text-white">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Action Buttons (Copy, Download, Collapse) */}
            <button
              onClick={() => copyToClipboard(rawText || content, cardId)}
              className="text-gray-400 hover:text-accent p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161622] transition-colors"
              title={`Copy ${title}`}
            >
              {copiedStates[cardId] ? <Check className="w-3.5 h-3.5 text-accent-success animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => downloadCardText(title, rawText || content)}
              className="text-gray-400 hover:text-accent p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161622] transition-colors"
              title={`Download ${title}`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleCollapse(cardId)}
              className="text-gray-400 hover:text-accent p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161622] transition-colors"
              title={isCollapsed ? "Expand card" : "Collapse card"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Card Body - Collapsible content with animation */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-5 border-t border-border-light dark:border-border-dark mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap select-text font-sans">
                  {content}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-[#060609] flex transition-colors duration-300 relative overflow-hidden">
      <div className="ambient-glow -top-32 -left-32 opacity-35" />
      <div className="ambient-glow-cyan bottom-10 -right-20 opacity-20" />

      {/* Sidebar selection */}
      <Sidebar 
        isDashboard={true} 
        activeJobId={selectedJob.id} 
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-5xl mx-auto relative z-10">
        
        {/* Mobile History Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-[#111118]/80 text-accent border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 transition-all active:scale-95 shadow-sm"
          >
            <History className="w-4 h-4 text-accent" />
            <span>View Analysis History ({jobHistory.length})</span>
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border-light dark:border-border-dark pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono tracking-wide mb-1.5 uppercase">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{new Date(selectedJob.timestamp || Date.now()).toLocaleString()}</span>
              <span>•</span>
              <span className="bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full capitalize">
                {selectedJob.language}
              </span>
            </div>
            <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {selectedJob.result.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-[#111118]/80 border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Download full report as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              Markdown
            </button>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-[#111118]/80 border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Print formatting or save as PDF"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              PDF Document
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold bg-white dark:bg-[#111118]/80 border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Share dashboard report link"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              Share
            </button>
            <button
              onClick={() => navigate('/chat', { state: { job: selectedJob } })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-white gradient-accent hover:shadow-lg hover:shadow-accent/25 transition-all active:scale-95 cursor-pointer duration-200"
              title="Ask AI questions about this meeting"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dashboard grid layout */}
        <div className="space-y-6">
          
          {/* 1. Executive Summary */}
          {renderCard(
            'summary', 
            'Executive Summary', 
            <FileText className="w-4 h-4" />, 
            selectedJob.result.summary,
            'text-accent',
            selectedJob.result.summary
          )}

          {/* 2. Insights row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderCard(
              'action_items',
              'Action Items',
              <ListTodo className="w-4 h-4" />,
              selectedJob.result.action_items,
              'text-cyan-500',
              selectedJob.result.action_items
            )}
            {renderCard(
              'decisions',
              'Key Decisions',
              <CheckCircle2 className="w-4 h-4" />,
              selectedJob.result.decisions || selectedJob.result.key_decisions,
              'text-emerald-500',
              selectedJob.result.decisions || selectedJob.result.key_decisions
            )}
            {renderCard(
              'questions',
              'Open Questions',
              <HelpCircle className="w-4 h-4" />,
              selectedJob.result.questions || selectedJob.result.open_questions,
              'text-amber-500',
              selectedJob.result.questions || selectedJob.result.open_questions
            )}
          </div>

          {/* 3. Statistics card */}
          {renderCard(
            'stats',
            'Meeting Statistics',
            <BarChart3 className="w-4 h-4" />,
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Word Count</span>
                <span className="font-mono text-lg font-bold text-accent mt-0.5">{stats.words.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Speaking length</span>
                <span className="font-mono text-lg font-bold text-cyan-500 mt-0.5">~{stats.minutes} mins</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Reading Duration</span>
                <span className="font-mono text-lg font-bold text-emerald-500 mt-0.5">~{stats.readTime} mins</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tasks Assigned</span>
                <span className="font-mono text-lg font-bold text-gray-800 dark:text-white mt-0.5">{stats.actions}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Final Decisions</span>
                <span className="font-mono text-lg font-bold text-gray-800 dark:text-white mt-0.5">{stats.decisions}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#161622] rounded-xl border border-border-light dark:border-border-dark flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Open Questions</span>
                <span className="font-mono text-lg font-bold text-gray-800 dark:text-white mt-0.5">{stats.questions}</span>
              </div>
            </div>,
            'text-indigo-400',
            `Word Count: ${stats.words}\nSpeech Duration: ~${stats.minutes}m\nReading Duration: ~${stats.readTime}m\nTasks: ${stats.actions}\nDecisions: ${stats.decisions}\nUnresolved Questions: ${stats.questions}`
          )}

          {/* 4. Complete Transcript Box */}
          {selectedJob.transcript && renderCard(
            'transcript',
            'Meeting Transcript Console',
            <FileCode className="w-4 h-4" />,
            <div className="max-h-80 overflow-y-auto text-xs text-gray-400 font-mono leading-relaxed bg-[#07070a] p-4.5 rounded-xl border border-border-dark/60 select-text">
              {selectedJob.transcript}
            </div>,
            'text-slate-500',
            selectedJob.transcript
          )}

        </div>

      </main>

      {/* Share report Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Analysis Dashboard">
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Copy the public shareable link below to share this AI dashboard.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={getShareLink()}
              className="flex-1 p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-[#161622] font-mono text-xs outline-none select-all text-gray-700 dark:text-gray-300"
            />
            <button
              onClick={copyShareLink}
              className="px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-white bg-accent hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

export default ResultsDashboard;
