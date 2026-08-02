import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { Toast } from '../components/Toast';
import { api } from '../services/api';
import {
  MessageSquare, Send, ArrowLeft, Loader2, Bot, User,
  Trash2, Copy, Check, ChevronDown, ChevronUp, BookOpen, History, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from '../utils/markdown';

const SUGGESTED = [
  'What key decisions were reached?',
  'List all action items with owners and deadlines.',
  'Who is responsible for the main deliverables?',
  'Summarize the core discussion topics.',
];

export const ChatPage = () => {
  const { activeJob, backendStatus } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [chatStatus, setChatStatus] = useState('DISCONNECTED');
  const [toast, setToast] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openCitations, setOpenCitations] = useState({});

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const currentJob = location.state?.job || activeJob;
    if (currentJob) setJob(currentJob);
  }, [location.state, activeJob]);

  useEffect(() => {
    if (!job?.id) return;
    setMessages([]);
    setInputVal('');
    setOpenCitations({});
    setChatStatus('DISCONNECTED');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [job?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => () => {
    eventSourceRef.current?.close();
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-8 text-center transition-colors">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">No Active Session</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
          Select or process a meeting recording to start an interactive transcript Q&amp;A session.
        </p>
        <Link
          to="/process"
          className="px-4 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-subtle"
        >
          Analyze Meeting
        </Link>
      </div>
    );
  }

  const showToast = (message, type = 'success') => setToast({ message, type });

  const closeEventSource = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || chatStatus === 'CONNECTING') return;

    const userText = inputVal.trim();
    setInputVal('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userText },
      { role: 'assistant', content: '', isStreaming: true, sources: [] },
    ]);
    setChatStatus('CONNECTING');

    const url = `${api.baseUrl}/chat/stream?job_id=${encodeURIComponent(job.id)}&question=${encodeURIComponent(userText)}`;
    closeEventSource();

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setChatStatus('CONNECTED');

    es.addEventListener('sources', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages((prev) => {
          const list = [...prev];
          const last = list[list.length - 1];
          if (last?.role === 'assistant') last.sources = payload;
          return list;
        });
      } catch (err) {
        console.error('Failed to parse sources payload', err);
      }
    });

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.token) {
          setMessages((prev) => {
            const list = [...prev];
            const last = list[list.length - 1];
            if (last?.role === 'assistant') last.content += payload.token;
            return list;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE token payload', err);
      }
    };

    const finish = () => {
      setChatStatus('DISCONNECTED');
      closeEventSource();
      setMessages((prev) => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last?.role === 'assistant') last.isStreaming = false;
        return list;
      });
    };

    es.addEventListener('completed', finish);

    es.addEventListener('error', (event) => {
      let message = 'RAG stream encountered an issue.';
      try {
        const parsed = JSON.parse(event.data);
        message = parsed?.message || message;
      } catch { /* keep default */ }
      showToast(message, 'error');
      setMessages((prev) => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last?.role === 'assistant') {
          last.content = last.content || `❌ Error: ${message}`;
          last.isStreaming = false;
        }
        return list;
      });
      setChatStatus('ERROR');
      closeEventSource();
    });
  };

  const copyMessage = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      showToast('Message copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('Clipboard access denied', 'error');
    }
  };

  const clearChat = () => {
    setMessages([]);
    closeEventSource();
    setChatStatus('DISCONNECTED');
    showToast('Conversation cleared');
  };

  const toggleCitation = (idx) =>
    setOpenCitations((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const connectionStatus = backendStatus === 'WAKING_UP'
    ? 'WAKING_UP'
    : chatStatus === 'CONNECTING' || chatStatus === 'CONNECTED' || chatStatus === 'ERROR'
      ? chatStatus
      : 'CONNECTED';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] flex transition-colors duration-200">
      <Sidebar
        activeJobId={job?.id}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-[#0B0F17] border-l border-slate-200/80 dark:border-slate-800 transition-colors relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0B0F17]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 flex-shrink-0 lg:hidden">
              <button
                onClick={() => navigate('/results')}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="View history"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {job.result?.title || 'Meeting Assistant'}
              </h1>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                {job.source}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ConnectionStatusBadge status={connectionStatus} />
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 select-text">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-slate-900 dark:text-white">Meeting Knowledge Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
                Ask questions about decisions, assigned action items, or transcript details. All responses are derived via RAG similarity search.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInputVal(q)}
                    className="p-3 text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-500/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all font-medium truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto w-full">
              {messages.map((msg, idx) => {
                const isBot = msg.role === 'assistant';
                const hasSources = isBot && msg.sources && msg.sources.length > 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex gap-3 p-4 rounded-xl border transition-colors ${
                      isBot
                        ? 'saas-card'
                        : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/30 flex-row-reverse'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      isBot ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {isBot ? 'MeetMind Assistant' : 'You'}
                        </span>
                        {isBot && msg.content && (
                          <button
                            onClick={() => copyMessage(msg.content, idx)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Copy reply"
                          >
                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <div>
                        {!msg.content && isBot && msg.isStreaming ? (
                          <span className="inline-flex gap-1 items-center my-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : (
                          <Markdown text={msg.content || ''} streaming={!!msg.isStreaming} />
                        )}
                      </div>

                      {hasSources && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => toggleCitation(idx)}
                            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Grounded Context ({msg.sources.length} sources)</span>
                            {openCitations[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <AnimatePresence>
                            {openCitations[idx] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2 space-y-2"
                              >
                                {msg.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono leading-relaxed select-text text-slate-300"
                                  >
                                    <div className="flex justify-between font-semibold text-[9px] uppercase tracking-wider text-slate-500 mb-1 pb-1 border-b border-slate-800">
                                      <span>Chunk #{src.chunk_index ?? src.chunk_id ?? sIdx + 1}</span>
                                      {src.score && <span>Relevance: {src.score.toFixed?.(2) ?? src.score}</span>}
                                    </div>
                                    <p className="whitespace-pre-wrap">{src.content}</p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              required
              disabled={chatStatus === 'CONNECTING'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a question about this meeting…"
              className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-colors placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || chatStatus === 'CONNECTING'}
              className="px-4 py-3 rounded-lg text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-subtle flex items-center justify-center flex-shrink-0"
              title="Send message"
            >
              {chatStatus === 'CONNECTING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ChatPage;
