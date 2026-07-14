import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { Toast } from '../components/Toast';
import { api } from '../services/api';
import {
  MessageSquare, Send, ArrowLeft, Loader2, Bot, User,
  Trash2, Copy, Check, ChevronDown, ChevronUp, BookOpen, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from '../utils/markdown';

const SUGGESTED = [
  'What key decisions were reached?',
  'Detail the action items with owners and deadlines.',
  'Who is responsible for the main milestones?',
  'Give a brief overview of the topics discussed.',
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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -left-10 w-[360px] h-[360px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl" />
        <MessageSquare className="w-16 h-16 text-zinc-400 opacity-40 mb-4" />
        <h2 className="font-syne text-xl font-bold mb-2 text-zinc-900 dark:text-white">No Active Chat Session</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
          Chat sessions require an analyzed video context. Start a job to chat with its transcript.
        </p>
        <Link
          to="/process"
          className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          Analyze Video
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
      showToast('Message copied!');
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex transition-colors duration-300 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-2/3 -right-20 w-[420px] h-[420px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/10 blur-3xl" />

      <Sidebar
        activeJobId={job?.id}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md border-l border-zinc-200 dark:border-zinc-800 transition-colors duration-300 relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/results')}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden"
                title="View analysis history"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <h1 className="font-syne text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                Chat · {job.result?.title || 'Meeting'}
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-md">
                {job.source}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <ConnectionStatusBadge status={connectionStatus} />
            <button
              onClick={clearChat}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 select-text">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
              <Bot className="w-12 h-12 text-violet-500 mb-4" />
              <h3 className="font-syne text-base font-bold mb-1.5 text-zinc-900 dark:text-white">Converse with your meeting</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-6">
                Ask specific questions, fetch quotes, or trace assignments. Answers are grounded in similarity search over the transcript.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInputVal(q)}
                    className="p-3 text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 hover:border-violet-500 dark:hover:border-violet-500 transition-colors truncate font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto w-full">
              {messages.map((msg, idx) => {
                const isBot = msg.role === 'assistant';
                const hasSources = isBot && msg.sources && msg.sources.length > 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
                      isBot
                        ? 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800'
                        : 'bg-violet-500/5 border-violet-500/20 flex-row-reverse'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isBot ? 'bg-violet-500/10 text-violet-500' : 'bg-violet-500 text-white'
                    }`}>
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                          {isBot ? 'MeetMind AI' : 'You'}
                        </span>
                        {isBot && msg.content && (
                          <button
                            onClick={() => copyMessage(msg.content, idx)}
                            className="p-1 rounded text-zinc-400 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Copy reply"
                          >
                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <div>
                        {!msg.content && isBot && msg.isStreaming ? (
                          <span className="inline-flex gap-1.5 items-center mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : (
                          <Markdown text={msg.content || ''} streaming={!!msg.isStreaming} />
                        )}
                      </div>

                      {hasSources && (
                        <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-800">
                          <button
                            onClick={() => toggleCitation(idx)}
                            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500 hover:text-violet-500 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Sources ({msg.sources.length})</span>
                            {openCitations[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <AnimatePresence>
                            {openCitations[idx] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2.5 space-y-2"
                              >
                                {msg.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-3 bg-zinc-50 dark:bg-zinc-950/90 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] leading-relaxed select-text font-mono"
                                  >
                                    <div className="flex justify-between font-bold text-[9px] uppercase tracking-[0.12em] text-zinc-500 mb-1 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                                      <span>Chunk #{src.chunk_index ?? src.chunk_id ?? sIdx + 1}</span>
                                      {src.score && <span>score {src.score.toFixed?.(2) ?? src.score}</span>}
                                    </div>
                                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{src.content}</p>
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

        {/* Input */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              required
              disabled={chatStatus === 'CONNECTING'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about decisions, action items, or anything else…"
              className="flex-1 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-colors placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || chatStatus === 'CONNECTING'}
              className="p-3.5 rounded-xl text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:shadow-[0_10px_30px_rgba(124,58,237,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center justify-center flex-shrink-0"
              title="Send"
            >
              {chatStatus === 'CONNECTING' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ChatPage;
