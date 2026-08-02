import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useSSE, SSE_PROGRESS_MAP } from '../hooks/useSSE';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import {
  FileAudio, Loader2, CheckCircle2,
  Clock, AlertTriangle, Terminal,
  Timer, BarChart3, Database, Upload, X, Video, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FORMAT_BYTES = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ALLOWED_EXT = ['mp4', 'mp3', 'wav', 'mov', 'm4a', 'aac'];
const MIN_BYTES = 1 * 1024 * 1024;
const MAX_BYTES = 300 * 1024 * 1024;

const STAGES = [
  { key: 'audio', label: 'Audio Preprocessing', description: 'Extracting and transcoding media into normalized WAV audio stream', range: [5, 25] },
  { key: 'transcription', label: 'Neural Speech-to-Text', description: 'Decoding spoken content with Gemini multi-lingual model', range: [30, 50] },
  { key: 'summarization', label: 'Executive Summarization', description: 'Structuring main discussions into hierarchical summaries', range: [60, 70] },
  { key: 'extraction', label: 'Action & Decision Mining', description: 'Identifying owners, deliverables, deadlines, and core assertions', range: [80, 90] },
  { key: 'rag', label: 'Vector Knowledge Indexing', description: 'Computing embeddings and indexing chunks into vector store', range: [95, 100] },
];

const isVideoFile = (name) => ['mp4', 'mov'].includes((name.split('.').pop() || '').toLowerCase());

export const ProcessPage = () => {
  const { addJobToHistory, setActiveJob, backendStatus } = useApp();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('english');
  const [validationError, setValidationError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineError, setPipelineError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [chunksCount, setChunksCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estCompletionTime, setEstCompletionTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const terminalEndRef = useRef(null);

  const addLog = useCallback((message, type = 'info') => {
    setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  }, []);

  const jobIdRef = useRef(null);
  const selectedFileRef = useRef(null);
  const languageRef = useRef('english');

  useEffect(() => { jobIdRef.current = jobId; }, [jobId]);
  useEffect(() => { selectedFileRef.current = selectedFile; }, [selectedFile]);
  useEffect(() => { languageRef.current = language; }, [language]);

  const eventListeners = useMemo(() => ({
    processing_started: (data) => {
      console.log("[ProcessPage] event: processing_started", data);
      setProgress(SSE_PROGRESS_MAP.processing_started);
      setCurrentStage('audio');
      addLog('Pipeline process initialized. Spawning execution context…', 'info');
    },
    audio_extraction_started: (data) => {
      console.log("[ProcessPage] event: audio_extraction_started", data);
      setProgress(SSE_PROGRESS_MAP.audio_extraction_started);
      addLog('Extracting audio track & normalizing audio parameters…', 'info');
    },
    audio_extracted: (data) => {
      console.log("[ProcessPage] event: audio_extracted", data);
      setProgress(SSE_PROGRESS_MAP.audio_extracted);
      setCurrentStage('transcription');
      const c = data?.chunks_count ?? 0;
      setChunksCount(c);
      const est = Math.max(c * 4 + 8, 12);
      setEstCompletionTime(est);
      addLog(`Audio extraction complete (${c} chunk segment(s)).`, 'success');
      addLog(`Estimated processing time remaining: ~${est}s.`, 'info');
    },
    transcribing: (data) => {
      console.log("[ProcessPage] event: transcribing", data);
      setProgress(data?.progress ?? SSE_PROGRESS_MAP.transcribing);
      const msg = data?.chunk
        ? `Transcribing segment ${data.chunk} of ${data.total_chunks} [Gemini STT]…`
        : 'Running Gemini speech-to-text pipeline…';
      addLog(msg, 'info');
    },
    transcription_completed: (data) => {
      console.log("[ProcessPage] event: transcription_completed", data);
      setProgress(SSE_PROGRESS_MAP.transcription_completed);
      setCurrentStage('summarization');
      addLog('Speech transcription complete. Transcript compiled.', 'success');
    },
    generating_title: (data) => {
      console.log("[ProcessPage] event: generating_title", data);
      setProgress(SSE_PROGRESS_MAP.generating_title);
      addLog('Generating descriptive meeting title…', 'info');
    },
    generating_summary: (data) => {
      console.log("[ProcessPage] event: generating_summary", data);
      setProgress(SSE_PROGRESS_MAP.generating_summary);
      addLog('Generating executive meeting summary…', 'info');
    },
    extracting_action_items: (data) => {
      console.log("[ProcessPage] event: extracting_action_items", data);
      setProgress(SSE_PROGRESS_MAP.extracting_action_items);
      setCurrentStage('extraction');
      addLog('Extracting actionable tasks, owners, and deadlines…', 'info');
    },
    extracting_decisions: (data) => {
      console.log("[ProcessPage] event: extracting_decisions", data);
      setProgress(SSE_PROGRESS_MAP.extracting_decisions);
      addLog('Parsing key decisions and explicit commitments…', 'info');
    },
    extracting_questions: (data) => {
      console.log("[ProcessPage] event: extracting_questions", data);
      setProgress(SSE_PROGRESS_MAP.extracting_questions);
      addLog('Scanning unresolved topics and open questions…', 'info');
    },
    building_rag: (data) => {
      console.log("[ProcessPage] event: building_rag", data);
      setProgress(SSE_PROGRESS_MAP.building_rag);
      setCurrentStage('rag');
      addLog('Building vector index embeddings in vector database…', 'info');
    },
    job_failed: (data) => {
      console.error("[ProcessPage] event: job_failed", data);
      const message = data?.message || 'Unknown pipeline execution failure';
      setPipelineError(message);
      addLog(`Job execution failed: ${message}`, 'error');
    },
  }), [addLog]);

  const onComplete = useCallback((data) => {
    console.log("[ProcessPage] event: completed", data);
    setProgress(100);
    setEstCompletionTime(0);
    addLog('Analysis finished successfully. Loading workspace dashboard…', 'success');

    const completedJob = {
      id: jobIdRef.current,
      source: selectedFileRef.current?.name || 'Uploaded Media File',
      language: languageRef.current,
      result: data,
      transcript: data?.transcript || '',
      timestamp: new Date().toISOString(),
    };

    addJobToHistory(completedJob);
    setActiveJob(completedJob);

    setTimeout(() => navigate('/results', { state: { job: completedJob } }), 1200);
  }, [addJobToHistory, setActiveJob, navigate, addLog]);

  const { status: sseStatus } = useSSE(
    jobId ? `${api.baseUrl}/stream/${jobId}` : null,
    { eventListeners, onComplete }
  );

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logs]);

  useEffect(() => {
    if (!jobId || progress >= 100 || pipelineError) return undefined;
    const elapsedTimer = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(elapsedTimer);
  }, [jobId, progress, pipelineError]);

  useEffect(() => {
    if (!jobId || progress >= 100 || pipelineError || estCompletionTime <= 0) return undefined;
    const countdownTimer = setInterval(() => {
      setEstCompletionTime((t) => Math.max(t - 1, 1));
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [jobId, progress, pipelineError, estCompletionTime]);

  const handleFileSelection = (file) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setValidationError(`Unsupported format .${ext}. Allowed formats: ${ALLOWED_EXT.join(', ').toUpperCase()}`);
      return;
    }
    if (file.size < MIN_BYTES) {
      setValidationError('File size too small. Please select a file between 1MB and 300MB.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError('File exceeds 300MB limit. Please select a file under 300MB.');
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
  };

  const handleStartProcess = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);
    setPipelineError(null);
    setLogs([]);
    setProgress(0);
    setChunksCount(0);
    setTimeElapsed(0);
    setEstCompletionTime(0);
    setCurrentStage('pending');

    try {
      addLog(`Uploading file: ${selectedFile.name} (${FORMAT_BYTES(selectedFile.size)})…`, 'info');
      const response = await api.processVideo(
        selectedFile,
        language,
        (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(pct);
          if (pct === 100) addLog('File upload finished. Initializing background pipeline…', 'info');
        }
      );
      setIsUploading(false);
      addLog(`Job submitted successfully. Job ID: ${response.job_id}`, 'success');
      setJobId(response.job_id);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Server connection failed';
      setPipelineError(msg);
      addLog(`Submission failed: ${msg}`, 'error');
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const getMilestoneStatus = (milestone) => {
    if (pipelineError) return currentStage === milestone.key ? 'failed' : 'pending';
    const [min, max] = milestone.range;
    if (progress >= max) return 'completed';
    if (progress >= min || currentStage === milestone.key) return 'active';
    return 'pending';
  };

  const connectionStatus = backendStatus === 'WAKING_UP'
    ? 'WAKING_UP'
    : sseStatus === 'CONNECTING' || sseStatus === 'ERROR'
      ? sseStatus
      : 'CONNECTED';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!jobId ? (
            <motion.div
              key="submission"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="saas-card p-6 sm:p-8"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Analyze Meeting Recording
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                  Upload an audio or video file to extract transcripts, action items, key decisions, and build an interactive RAG knowledge base.
                </p>
              </div>

              <form onSubmit={handleStartProcess} className="space-y-6">
                <div>
                  <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Media File
                  </label>

                  {!selectedFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleFileSelection(f);
                      }}
                      onClick={() => document.getElementById('file-input').click()}
                      className={`relative flex flex-col items-center justify-center p-8 border border-dashed rounded-xl cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/80 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}
                    >
                      <input
                        id="file-input"
                        type="file"
                        className="sr-only"
                        accept=".mp4,.mp3,.wav,.mov,.m4a,.aac"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelection(f);
                        }}
                      />
                      <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
                        Click to upload or drag &amp; drop file
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center font-mono">
                        MP4, MP3, WAV, MOV, M4A up to 300MB
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                        {ALLOWED_EXT.map((ext) => (
                          <span
                            key={ext}
                            className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-indigo-600 text-white flex-shrink-0">
                          {isVideoFile(selectedFile.name) ? <Video className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {FORMAT_BYTES(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Remove selected file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {validationError && (
                    <div className="mt-2.5 text-xs text-rose-500 font-medium flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {validationError}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="language-select" className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Primary Language Model Mode
                  </label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <option value="english">English (automatic Gemini translation)</option>
                    <option value="hinglish">Hinglish / Code-Switched (direct multi-lingual)</option>
                  </select>
                </div>

                {isUploading && (
                  <div className="p-3.5 rounded-lg border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading media file…
                      </span>
                      <span className="font-mono text-slate-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isUploading ? 'Uploading file…' : 'Starting pipeline…'}</span>
                    </>
                  ) : (
                    <>
                      <span>Start Pipeline Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              {/* Header card */}
              <div className="p-4 saas-card flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    JOB ID: {jobId}
                  </span>
                  <h2 className="text-sm font-semibold mt-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Live Meeting Pipeline Monitor
                  </h2>
                </div>
                <ConnectionStatusBadge status={connectionStatus} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 saas-card flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Elapsed Time</p>
                    <p className="font-mono text-xs font-semibold mt-0.5 text-slate-900 dark:text-slate-100">{timeElapsed}s</p>
                  </div>
                </div>

                <div className="p-4 saas-card flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Est. Remaining</p>
                    <p className="font-mono text-xs font-semibold mt-0.5 text-slate-900 dark:text-slate-100">
                      {progress === 100 ? 'Done' : estCompletionTime > 0 ? `~${estCompletionTime}s` : 'Calculating…'}
                    </p>
                  </div>
                </div>

                <div className="p-4 saas-card flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Audio Segments</p>
                    <p className="font-mono text-xs font-semibold mt-0.5 text-slate-900 dark:text-slate-100">
                      {chunksCount > 0 ? `${chunksCount} segment(s)` : 'Analyzing…'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress & Stages */}
              <div className="p-6 saas-card space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className={`flex items-center gap-2 ${pipelineError ? 'text-rose-500' : progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {progress < 100 && !pipelineError && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {progress === 100 && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {pipelineError && <AlertTriangle className="w-3.5 h-3.5" />}
                      {pipelineError ? 'Pipeline Execution Failed' : progress === 100 ? 'Pipeline Execution Complete' : 'Processing Execution Stages'}
                    </span>
                    <span className="font-mono text-slate-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        pipelineError ? 'bg-rose-500' : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Pipeline Timeline */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                  <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-5">
                    Pipeline Stages
                  </h3>
                  <ol className="relative pl-6 space-y-5 border-l border-slate-200 dark:border-slate-800 ml-2.5">
                    {STAGES.map((m) => {
                      const s = getMilestoneStatus(m);
                      return (
                        <li key={m.key} className="relative">
                          <div className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border bg-white dark:bg-[#111827] text-xs transition-all ${
                            s === 'completed' ? 'border-emerald-500 text-emerald-500' :
                            s === 'active' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20' :
                            s === 'failed' ? 'border-rose-500 text-rose-500' :
                            'border-slate-300 dark:border-slate-700 text-slate-400'
                          }`}>
                            {s === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {s === 'active' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {s === 'pending' && <Clock className="w-2.5 h-2.5" />}
                            {s === 'failed' && <AlertTriangle className="w-3 h-3" />}
                          </div>
                          <div className="pl-2">
                            <h4 className={`text-xs font-semibold ${
                              s === 'active' ? 'text-indigo-600 dark:text-indigo-400' :
                              s === 'completed' ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                            }`}>{m.label}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {m.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>

              {/* Logs terminal */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-semibold tracking-wider flex items-center gap-2 text-slate-400">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Pipeline Execution Log
                  </span>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Live SSE
                  </span>
                </div>
                <div className="p-3.5 font-mono text-[11px] h-48 overflow-y-auto space-y-2 select-text">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2.5 leading-relaxed items-start">
                      <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
                      <span className={
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'error' ? 'text-rose-400' : 'text-slate-300'
                      }>{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-slate-600 italic">Initializing execution stream…</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {pipelineError && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    Pipeline Job Terminated
                  </div>
                  <p className="text-xs font-mono leading-relaxed bg-slate-950 text-slate-300 p-3 rounded-lg border border-slate-800">
                    {pipelineError}
                  </p>
                  <button
                    onClick={() => setJobId(null)}
                    className="w-fit px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  >
                    Start New Job
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

