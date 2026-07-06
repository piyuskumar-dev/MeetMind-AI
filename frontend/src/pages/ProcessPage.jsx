import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useSSE } from '../hooks/useSSE';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { 
  Youtube, FileAudio, Play, Loader2, CheckCircle2, 
  Clock, AlertTriangle, Terminal, ArrowRight, ShieldCheck,
  Timer, BarChart3, Database, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProcessPage = () => {
  const { addJobToHistory, setActiveJob } = useApp();
  const navigate = useNavigate();

  // Input states
  const [sourceType, setSourceType] = useState('youtube'); // youtube or local
  const [sourceValue, setSourceValue] = useState('');
  const [language, setLanguage] = useState('english');
  
  // Job execution states
  const [jobId, setJobId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('pending');
  const [logs, setLogs] = useState([]);
  
  // Stats tracker states
  const [chunksCount, setChunksCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estCompletionTime, setEstCompletionTime] = useState(0); // in seconds

  const milestones = [
    { 
      key: 'audio', 
      label: 'Audio Processing', 
      description: 'Extracting and transcoding media into mono WAV streams', 
      progressRange: [5, 25] 
    },
    { 
      key: 'transcription', 
      label: 'Gemini Transcription', 
      description: 'Running neural speech-to-text decoding via Gemini API', 
      progressRange: [30, 50] 
    },
    { 
      key: 'summarization', 
      label: 'AI Title & Summaries', 
      description: 'Creating executive summaries using hierarchical LLM maps', 
      progressRange: [60, 70] 
    },
    { 
      key: 'extraction', 
      label: 'Insight Extraction', 
      description: 'Parsing tasks, responsibilities, deadlines, and core decisions', 
      progressRange: [80, 90] 
    },
    { 
      key: 'rag', 
      label: 'RAG Indexing', 
      description: 'Generating vector embeddings and writing collections to Chroma DB', 
      progressRange: [95, 100] 
    }
  ];

  const terminalEndRef = useRef(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Elapsed timer incrementer
  useEffect(() => {
    let interval;
    if (jobId && progress < 100 && !pipelineError) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, progress, pipelineError]);

  // Countdown estimator
  useEffect(() => {
    let interval;
    if (jobId && progress < 100 && estCompletionTime > 0 && !pipelineError) {
      interval = setInterval(() => {
        setEstCompletionTime(prev => Math.max(prev - 1, 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, progress, estCompletionTime, pipelineError]);

  // Logger helper
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // SSE event handlers
  const eventListeners = {
    processing_started: (data) => {
      setProgress(data.progress);
      setCurrentStage('audio');
      addLog('🎬 Pipeline process initialized. Creating background execution context...', 'info');
    },
    audio_extraction_started: (data) => {
      setProgress(data.progress);
      addLog('🔊 Extracting audio stream and normalising parameters...', 'info');
    },
    audio_extracted: (data) => {
      setProgress(data.progress);
      setCurrentStage('transcription');
      setChunksCount(data.chunks_count);
      
      // Rough estimation: each chunk takes ~3-4s to transcribe + 8s summarisation overhead
      const est = Math.max(data.chunks_count * 4 + 8, 12);
      setEstCompletionTime(est);
      
      addLog(`✅ Audio extraction complete. Partitioned media into ${data.chunks_count} chunk(s) for decoding.`, 'success');
      addLog(`⏳ Estimated completion countdown: ~${est} seconds remaining.`, 'info');
    },
    transcribing: (data) => {
      setProgress(data.progress);
      const chunkMsg = data.chunk 
        ? `Decoding audio segment ${data.chunk} of ${data.total_chunks} [Gemini STT]...` 
        : 'Spawning Gemini STT process...';
      addLog(`📝 ${chunkMsg}`, 'info');
    },
    transcription_completed: (data) => {
      setProgress(data.progress);
      setCurrentStage('summarization');
      addLog('✅ Gemini transcription complete. Transcript compiled successfully.', 'success');
    },
    generating_title: (data) => {
      setProgress(data.progress);
      addLog('🏷️ Title extractor running - querying title representations...', 'info');
    },
    generating_summary: (data) => {
      setProgress(data.progress);
      addLog('📋 Running consolidated AI meeting analysis...', 'info');
    },
    extracting_action_items: (data) => {
      setProgress(data.progress);
      setCurrentStage('extraction');
      addLog('🔎 Parsing meeting contexts for actionable items, owners, and dates...', 'info');
    },
    extracting_decisions: (data) => {
      setProgress(data.progress);
      addLog('🔑 Parsing contexts for finalized assertions and core decisions...', 'info');
    },
    extracting_questions: (data) => {
      setProgress(data.progress);
      addLog('❓ Scanning open threads and follow-up queries...', 'info');
    },
    building_rag: (data) => {
      setProgress(data.progress);
      setCurrentStage('rag');
      addLog('🧠 Computing sentence embeddings and building indexing structures in Chroma DB...', 'info');
    },
    completed: (data) => {
      if (typeof disconnect === 'function') {
        disconnect();
      }
      setProgress(100);
      setEstCompletionTime(0);
      addLog('🎉 Pipeline analysis successfully finished! Saving results to local cache...', 'success');
      
      const completedJob = {
        id: jobId,
        source: sourceValue,
        language: language,
        result: data,
        timestamp: new Date().toISOString()
      };
      
      // Save to history & context
      addJobToHistory(completedJob);
      setActiveJob(completedJob);
      
      // Auto transition to results view
      setTimeout(() => {
        navigate('/results', { state: { job: completedJob } });
      }, 1500);
    },
    error: (data) => {
      if (typeof disconnect === 'function') {
        disconnect();
      }
      setPipelineError(data.message);
      addLog(`❌ Job execution failed: ${data.message}`, 'error');
    }
  };
 
  // SSE handler
  const sseUrl = jobId ? `${api.baseUrl}/stream/${jobId}` : null;
  const { status: sseStatus, disconnect } = useSSE(sseUrl, {
    enabled: !!jobId && !pipelineError && progress < 100,
    eventListeners
  });

  const handleStartProcess = async (e) => {
    e.preventDefault();
    if (!sourceValue.trim()) return;

    setIsSubmitting(true);
    setPipelineError(null);
    setLogs([]);
    setProgress(0);
    setChunksCount(0);
    setTimeElapsed(0);
    setEstCompletionTime(0);
    setCurrentStage('pending');

    try {
      addLog(`Connecting to AI Video Assistant endpoint at ${api.baseUrl}...`, 'info');
      const response = await api.processVideo(sourceValue.trim(), language);
      addLog(`Analysis job successfully queued. ID: ${response.job_id}`, 'success');
      setJobId(response.job_id);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Server connection timed out';
      setPipelineError(errMsg);
      addLog(`Error submitting request: ${errMsg}`, 'error');
      setIsSubmitting(false);
    }
  };

  const getMilestoneStatus = (milestone) => {
    if (pipelineError) {
      return currentStage === milestone.key ? 'failed' : 'pending';
    }
    const [minProg, maxProg] = milestone.progressRange;
    if (progress >= maxProg) return 'completed';
    if (progress >= minProg || currentStage === milestone.key) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-[#060609] text-gray-900 dark:text-gray-100 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="ambient-glow -top-20 -left-20 opacity-30 dark:opacity-60" />
      <div className="ambient-glow-cyan top-1/3 -right-20 opacity-20 dark:opacity-40" />

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!jobId ? (
            /* Submission view */
            <motion.div
              key="submission"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="premium-card p-6 sm:p-8 dark:bg-[#111118]/80 backdrop-blur-md"
            >
              <div className="border-b border-border-light dark:border-border-dark pb-5 mb-6">
                <h1 className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Start Analysis Pipeline
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
                  Paste a YouTube URL or specify the path to a local media file to extract transcripts, summaries, and build a RAG knowledge base.
                </p>
              </div>

              <form onSubmit={handleStartProcess} className="space-y-6">
                {/* Source Selection Tabs */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
                    Source media Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('youtube');
                        setSourceValue('');
                      }}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs uppercase tracking-wider font-bold transition-all duration-200 ${
                        sourceType === 'youtube'
                          ? 'border-accent bg-accent/5 text-accent shadow-sm'
                          : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#15151f]'
                      }`}
                    >
                      <Youtube className="w-4 h-4 text-red-500" />
                      YouTube URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('local');
                        setSourceValue('');
                      }}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs uppercase tracking-wider font-bold transition-all duration-200 ${
                        sourceType === 'local'
                          ? 'border-accent bg-accent/5 text-accent shadow-sm'
                          : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#15151f]'
                      }`}
                    >
                      <FileAudio className="w-4 h-4 text-cyan-500" />
                      Local File
                    </button>
                  </div>
                </div>

                {/* Input Text Box */}
                <div>
                  <label htmlFor="source-value" className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
                    {sourceType === 'youtube' ? 'YouTube Media URL' : 'Absolute System File Path'}
                  </label>
                  <input
                    id="source-value"
                    type="text"
                    required
                    value={sourceValue}
                    onChange={(e) => setSourceValue(e.target.value)}
                    placeholder={
                      sourceType === 'youtube'
                        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                        : '/Users/admin/Desktop/meeting.mp4'
                    }
                    className="w-full p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#161622] font-mono text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                    {sourceType === 'youtube'
                      ? 'Note: URL must be publicly available. Processing utilizes yt-dlp to extract high-quality audio segments.'
                      : 'Provide the full absolute path of a WAV, MP3, or MP4 file on the local host machine.'}
                  </p>
                </div>

                {/* Transcribe Language Dropdown */}
                <div>
                  <label htmlFor="language-select" className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
                    Target Language
                  </label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#161622] text-sm focus:border-accent outline-none"
                  >
                    <option value="english">English (Automatic Gemini Translation to English)</option>
                    <option value="hinglish">Hinglish / Code-Switched (Direct Multi-lingual Transcription)</option>
                  </select>
                </div>

                {/* Submit Trigger */}
                <button
                  type="submit"
                  disabled={isSubmitting || !sourceValue.trim()}
                  className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl text-sm font-bold tracking-wider text-white gradient-accent hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      SUBMITTING JOB REQUEST...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      INITIALISE AI PIPELINE
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Live tracking view */
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Header Badge Card */}
              <div className="premium-card p-4 flex items-center justify-between dark:bg-[#111118]/80 backdrop-blur-md">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-[#161622] px-2 py-0.5 rounded-md border border-border-light dark:border-border-dark">
                    ID: {jobId}
                  </span>
                  <h2 className="font-syne text-md font-bold mt-1.5 flex items-center gap-2">
                    <Database className="w-4 h-4 text-accent" />
                    Live Job Pipeline Tracker
                  </h2>
                </div>
                <ConnectionStatusBadge status={sseStatus} />
              </div>

              {/* Progress Statistics Panel Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="premium-card p-4 flex items-center gap-3.5 dark:bg-[#111118]/80 backdrop-blur-md">
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Elapsed Time</p>
                    <p className="font-mono text-sm font-semibold mt-0.5">{timeElapsed} seconds</p>
                  </div>
                </div>

                <div className="premium-card p-4 flex items-center gap-3.5 dark:bg-[#111118]/80 backdrop-blur-md">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Est. Completion</p>
                    <p className="font-mono text-sm font-semibold mt-0.5">
                      {progress === 100 ? 'Done' : estCompletionTime > 0 ? `~${estCompletionTime}s remaining` : 'Calculating...'}
                    </p>
                  </div>
                </div>

                <div className="premium-card p-4 flex items-center gap-3.5 dark:bg-[#111118]/80 backdrop-blur-md">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Audio Chunks</p>
                    <p className="font-mono text-sm font-semibold mt-0.5">
                      {chunksCount > 0 ? `${chunksCount} segment(s)` : 'Analyzing...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress and Timeline card */}
              <div className="premium-card p-6 sm:p-8 dark:bg-[#111118]/80 backdrop-blur-md space-y-6">
                {/* Main Progress Indicator */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-2 text-accent">
                      {progress < 100 && !pipelineError && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                      {progress === 100 && <CheckCircle2 className="w-4 h-4 text-accent-success" />}
                      {pipelineError && <AlertTriangle className="w-4 h-4 text-accent-danger" />}
                      {pipelineError ? 'JOB TERMINATED' : progress === 100 ? 'PIPELINE COMPLETE!' : 'EXECUTING PIPELINE PIPES...'}
                    </span>
                    <span className="font-mono text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-150 dark:bg-[#161622] h-2.5 rounded-full overflow-hidden border border-border-light dark:border-border-dark/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        pipelineError ? 'from-accent-danger to-red-600' : 'from-accent via-accent-cyan to-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Vertical Interactive Timeline */}
                <div className="border-t border-border-light dark:border-border-dark pt-6">
                  <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    PIPELINE STAGES
                  </h3>
                  <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-border-light dark:border-border-dark/80 ml-3">
                    {milestones.map((m, idx) => {
                      const mStatus = getMilestoneStatus(m);
                      return (
                        <div key={idx} className="relative">
                          {/* Left Node Icon */}
                          <div className={`absolute -left-[37px] top-0 w-6 h-6 rounded-full flex items-center justify-center border bg-white dark:bg-[#111118] transition-all duration-300 ${
                            mStatus === 'completed' ? 'border-accent-success text-accent-success' :
                            mStatus === 'active' ? 'border-accent text-accent shadow-sm shadow-accent/20 scale-110' :
                            mStatus === 'failed' ? 'border-accent-danger text-accent-danger' :
                            'border-border-light dark:border-border-dark text-gray-400 opacity-60'
                          }`}>
                            {mStatus === 'completed' && <CheckCircle2 className="w-4 h-4 text-accent-success fill-accent-success/5" />}
                            {mStatus === 'active' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {mStatus === 'pending' && <Clock className="w-3 h-3" />}
                            {mStatus === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                          </div>
                          
                          {/* Node Text Content */}
                          <div className="pl-3">
                            <h4 className={`text-sm font-semibold ${
                              mStatus === 'active' ? 'text-accent dark:text-accent-glow font-bold' : 
                              mStatus === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                            }`}>
                              {m.label}
                            </h4>
                            <p className={`text-[11px] mt-0.5 font-medium leading-relaxed ${
                              mStatus === 'active' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'
                            }`}>
                              {m.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Terminal Logs console */}
              <div className="premium-card rounded-2xl overflow-hidden flex flex-col border border-border-light dark:border-border-dark">
                <div className="bg-gray-50 dark:bg-[#15151f] px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Terminal className="w-3.5 h-3.5 text-accent" />
                    Live System logs
                  </span>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                    streaming
                  </span>
                </div>
                
                <div className="p-4 bg-[#07070a] text-gray-300 font-mono text-[11px] h-52 overflow-y-auto space-y-2.5 select-text">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2.5 leading-relaxed items-start">
                      <span className="text-gray-600 flex-shrink-0">[{log.timestamp}]</span>
                      <span className={
                        log.type === 'success' ? 'text-emerald-400 font-semibold' :
                        log.type === 'error' ? 'text-red-400 font-semibold' : 'text-gray-300'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-600 italic">Connecting and initializing process streams...</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* Graceful Error Handler Box */}
              {pipelineError && (
                <div className="p-4 rounded-2xl border border-accent-danger/20 bg-accent-danger/[0.03] text-accent-danger flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    Pipeline Job Terminated
                  </div>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed bg-[#0c0c12]/60 p-3 rounded-xl border border-border-dark/60">
                    {pipelineError}
                  </p>
                  <button
                    onClick={() => setJobId(null)}
                    className="w-fit mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-accent-danger text-white hover:bg-opacity-90 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Configure New Job Setup
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProcessPage;
