import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { Toast } from '../components/Toast';
import { api } from '../services/api';
import { 
  MessageSquare, Send, ArrowLeft, Loader2, Bot, User, 
  Trash2, Copy, Check, Info, ShieldCheck, ChevronDown, ChevronUp, BookOpen, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatPage = () => {
  const { activeJob } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [chatStatus, setChatStatus] = useState('DISCONNECTED'); // CONNECTED, CONNECTING, DISCONNECTED, ERROR
  const [toast, setToast] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Track open states for citations of each message
  const [openCitations, setOpenCitations] = useState({});

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const currentJob = location.state?.job || activeJob;
    if (currentJob) {
      setJob(currentJob);
    }
  }, [location.state, activeJob]);

  // Reset chat state and disconnect stream when job ID changes
  useEffect(() => {
    if (job?.id) {
      setMessages([]);
      setInputVal('');
      setOpenCitations({});
      setChatStatus('DISCONNECTED');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [job?.id]);

  // Smooth scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="ambient-glow -top-10 -left-10 opacity-30" />
        <MessageSquare className="w-16 h-16 text-gray-400 opacity-40 mb-4 animate-pulse-slow" />
        <h2 className="font-syne text-xl font-bold mb-2">No Active Chat Session</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
          Chat sessions require an active analyzed video context. Please choose or submit a video for analysis.
        </p>
        <Link to="/process" className="px-6 py-3 bg-accent text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-accent/25 transition-all">
          Analyze Video
        </Link>
      </div>
    );
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || chatStatus === 'CONNECTING') return;

    const userText = inputVal.trim();
    setInputVal('');

    // User Message
    const userMessage = { role: 'user', content: userText };
    // Assistant Placeholder (isStreaming flags cursor placement)
    const assistantMessage = { role: 'assistant', content: '', isStreaming: true, sources: [] };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setChatStatus('CONNECTING');

    const encodedQuestion = encodeURIComponent(userText);
    const sseChatUrl = `${api.baseUrl}/chat/stream?job_id=${job.id}&question=${encodedQuestion}`;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(sseChatUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setChatStatus('CONNECTED');
    };

    // Capture Document Chunks Citations
    es.addEventListener('sources', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages(prev => {
          const list = [...prev];
          const last = list[list.length - 1];
          if (last && last.role === 'assistant') {
            last.sources = payload;
          }
          return list;
        });
      } catch (err) {
        console.error('Failed to parse sources payload', err);
      }
    });

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.token) {
          setMessages(prev => {
            const list = [...prev];
            const last = list[list.length - 1];
            if (last && last.role === 'assistant') {
              last.content += payload.token;
            }
            return list;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE token payload', err);
      }
    };

    es.addEventListener('completed', () => {
      setChatStatus('DISCONNECTED');
      es.close();
      eventSourceRef.current = null;
      setMessages(prev => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last && last.role === 'assistant') {
          last.isStreaming = false;
        }
        return list;
      });
    });

    es.addEventListener('error', (event) => {
      let errorMsg = 'RAG stream pipeline encountered an issue.';
      try {
        const parsed = JSON.parse(event.data);
        errorMsg = parsed.message || errorMsg;
      } catch (e) {}

      setChatStatus('ERROR');
      showToast(errorMsg, 'error');
      es.close();
      eventSourceRef.current = null;

      setMessages(prev => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last && last.role === 'assistant') {
          last.content = `❌ Error: ${errorMsg}`;
          last.isStreaming = false;
        }
        return list;
      });
    });

    es.onerror = () => {
      setChatStatus('ERROR');
      es.close();
      eventSourceRef.current = null;
    };
  };

  const copyMessageText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    showToast('Message copied to clipboard!');
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const clearChatHistory = () => {
    setMessages([]);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setChatStatus('DISCONNECTED');
    showToast('Conversation cleared!');
  };

  const toggleCitation = (idx) => {
    setOpenCitations(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper parsing methods for inline formatting
  const parseCodeSpans = (text) => {
    const codeParts = text.split('`');
    if (codeParts.length > 1) {
      return codeParts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <code key={idx} className="px-1.5 py-0.5 rounded bg-gray-150 dark:bg-gray-900 font-mono text-xs text-accent-glow font-medium">{part}</code>;
        }
        return part;
      });
    }
    return text;
  };

  const parseInlines = (text) => {
    const boldParts = text.split('**');
    if (boldParts.length > 1) {
      return boldParts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <strong key={idx} className="font-bold text-gray-900 dark:text-white">{part}</strong>;
        }
        return parseCodeSpans(part);
      });
    }
    return parseCodeSpans(text);
  };

  const parseParagraphs = (text, showCursor) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const isLastLine = lIdx === lines.length - 1;
      
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={lIdx} className="font-bold text-sm text-accent-glow mt-4 mb-2">
            {line.replace('### ', '')}
            {showCursor && isLastLine && <span className="streaming-cursor" />}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={lIdx} className="font-bold text-md text-accent mt-5 mb-2.5">
            {line.replace('## ', '')}
            {showCursor && isLastLine && <span className="streaming-cursor" />}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={lIdx} className="font-bold text-lg text-accent mt-6 mb-3">
            {line.replace('# ', '')}
            {showCursor && isLastLine && <span className="streaming-cursor" />}
          </h2>
        );
      }

      // Unordered list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleaned = line.replace(/^[\s*-]+/, '');
        return (
          <ul key={lIdx} className="list-disc pl-5 my-1.5 space-y-0.5">
            <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {parseInlines(cleaned)}
              {showCursor && isLastLine && <span className="streaming-cursor" />}
            </li>
          </ul>
        );
      }

      // Ordered list items
      if (/^\d+\.\s/.test(line.trim())) {
        const cleaned = line.replace(/^\d+\.\s/, '');
        const number = line.trim().match(/^(\d+)\.\s/)[1];
        return (
          <ol key={lIdx} start={number} className="list-decimal pl-5 my-1.5 space-y-0.5">
            <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {parseInlines(cleaned)}
              {showCursor && isLastLine && <span className="streaming-cursor" />}
            </li>
          </ol>
        );
      }

      if (!line.trim()) return <div key={lIdx} className="h-2.5" />;

      return (
        <p key={lIdx} className="text-sm leading-relaxed mb-2 text-gray-700 dark:text-gray-300">
          {parseInlines(line)}
          {showCursor && isLastLine && <span className="streaming-cursor" />}
        </p>
      );
    });
  };

  // Robust codeblock & text streaming parser
  const renderMessageContent = (text, isStreaming, msgIdx) => {
    if (!text) {
      if (isStreaming) {
        return (
          <span className="inline-flex gap-1.5 items-center mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        );
      }
      return null;
    }

    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, pIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : 'code';
        const code = match ? match[2].trim() : part.slice(3, -3).trim();

        return (
          <div key={pIdx} className="my-4 rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
            <div className="bg-gray-150 dark:bg-gray-900 px-4 py-2 border-b border-border-light dark:border-border-dark flex items-center justify-between text-[10px] font-mono text-gray-500">
              <span>{lang.toUpperCase()}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  showToast('Code block copied!');
                }}
                className="flex items-center gap-1 hover:text-accent font-sans transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <pre className="p-4 bg-[#07070a] text-gray-200 overflow-x-auto text-xs font-mono select-text leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={pIdx} className="space-y-1">
          {parseParagraphs(part, isStreaming && pIdx === parts.length - 1)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-[#060609] flex transition-colors duration-300 relative overflow-hidden">
      <div className="ambient-glow -top-32 -left-32 opacity-25" />
      <div className="ambient-glow-cyan top-2/3 -right-20 opacity-20" />

      {/* History Sidebar */}
      <Sidebar 
        isDashboard={false} 
        activeJobId={job?.id}
        onSelectJob={(newJob) => {
          if (newJob.id !== job?.id) {
            setJob(newJob);
            navigate('/chat', { state: { job: newJob }, replace: true });
          }
        }}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main RAG Console */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-md border-l border-border-light dark:border-border-dark transition-colors duration-300 relative z-10">
        
        {/* Navigation/Header Status */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-white dark:bg-[#111118]/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/results')}
                className="p-1.5 rounded-lg border border-border-light dark:border-border-dark text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-[#1a1a25] lg:hidden transition-colors"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-border-light dark:border-border-dark text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-[#1a1a25] lg:hidden transition-colors"
                title="View analysis history"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <h1 className="font-syne text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                🤖 Chat Assistant: {job.result.title}
              </h1>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-md">
                Ref: {job.source}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <ConnectionStatusBadge status={chatStatus === 'CONNECTING' ? 'CONNECTING' : chatStatus === 'CONNECTED' ? 'CONNECTED' : chatStatus} />
            <button
              onClick={clearChatHistory}
              className="p-2 rounded-xl border border-border-light dark:border-border-dark text-gray-400 hover:text-accent-danger hover:bg-accent-danger/5 transition-colors cursor-pointer bg-transparent"
              title="Clear conversation history log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messaging Board scrollbox */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 select-text">
          {messages.length === 0 ? (
            /* Welcome / Zero State UI */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
              <Bot className="w-12 h-12 text-accent animate-pulse-slow mb-4" />
              <h3 className="font-syne text-md font-bold mb-1.5">Converse with your Meeting Context</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
                Ask specific questions, fetch quotes, or trace assignments. Grounded results are backed by mathematical similarity searches in Chroma DB.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {[
                  "What key decisions were reached?",
                  "Detail the action items with owners and deadlines.",
                  "Who is responsible for the main milestones?",
                  "Give a brief conceptual overview of topics discussed."
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputVal(q);
                    }}
                    className="p-3 text-left text-xs border border-border-light dark:border-border-dark rounded-xl bg-gray-50/50 dark:bg-[#111118]/80 hover:border-accent dark:hover:border-accent hover:bg-accent/[0.02] dark:hover:bg-accent/[0.01] transition-all truncate font-medium cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message feeds */
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
                    className={`flex gap-4 p-4.5 rounded-2xl border transition-all ${
                      isBot 
                        ? 'bg-gray-50/[0.2] dark:bg-[#111118]/70 border-border-light dark:border-border-dark' 
                        : 'bg-accent/[0.04] border-accent/15 flex-row-reverse'
                    }`}
                  >
                    {/* Role Avatar */}
                    <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isBot ? 'bg-accent/10 text-accent' : 'bg-accent text-white'
                    }`}>
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {isBot ? 'MeetMind AI' : 'User Request'}
                        </span>
                        {isBot && msg.content && (
                          <button
                            onClick={() => copyMessageText(msg.content, idx)}
                            className="p-1 rounded text-gray-400 hover:text-accent hover:bg-gray-100 dark:hover:bg-[#1a1a25] transition-colors cursor-pointer bg-transparent border-none outline-none"
                            title="Copy reply content"
                          >
                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      
                      {/* Message Content Body */}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {renderMessageContent(msg.content, msg.isStreaming, idx)}
                      </div>

                      {/* Grounded Source Citations Accordion */}
                      {hasSources && (
                        <div className="mt-4 pt-3.5 border-t border-border-light dark:border-border-dark">
                          <button
                            onClick={() => toggleCitation(idx)}
                            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 hover:text-accent transition-colors bg-transparent border-none outline-none cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Retrieved Context Sources ({msg.sources.length})</span>
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
                                    className="p-3 bg-gray-50/50 dark:bg-[#07070a]/90 rounded-xl border border-border-light dark:border-border-dark/60 text-[11px] leading-relaxed select-text font-mono text-gray-500"
                                  >
                                    <div className="flex justify-between font-bold text-[9px] uppercase text-gray-400 mb-1 border-b border-border-light dark:border-border-dark pb-1">
                                      <span>Chunk #{src.chunk_index}</span>
                                      <span>Match confidence base</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-400">{src.content}</p>
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

        {/* Interactive Query box bar */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-[#111118]/90">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              required
              disabled={chatStatus === 'CONNECTING'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Query any insights, actions, or details..."
              className="flex-1 p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#151520] text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || chatStatus === 'CONNECTING'}
              className="p-3.5 rounded-xl text-white bg-accent hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:scale-100 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm shadow-accent/15"
              title="Query AI Chatbot"
            >
              {chatStatus === 'CONNECTING' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 fill-current" />
              )}
            </button>
          </form>
        </div>

      </main>

      {/* Toast Alert */}
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

export default ChatPage;
