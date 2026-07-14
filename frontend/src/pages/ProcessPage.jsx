import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useSSE, SSE_PROGRESS_MAP } from '../hooks/useSSE';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import {
  FileAudio, Loader2, CheckCircle2,
  Clock, AlertTriangle, Terminal,
  Timer, BarChart3, Database, Upload, X, Video, Sparkles,
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
  { key: 'audio', label: 'Audio Processing', description: 'Extracting and transcoding media into mono WAV streams', range: [5, 25] },
  { key: 'transcription', label: 'Gemini Transcription', description: 'Running neural speech-to-text decoding via Gemini API', range: [30, 50] },
  { key: 'summarization', label: 'AI Title & Summaries', description: 'Creating executive summaries using hierarchical LLM maps', range: [60, 70] },
  { key: 'extraction', label: 'Insight Extraction', description: 'Parsing tasks, responsibilities, deadlines, and core decisions', range: [80, 90] },
  { key: 'rag', label: 'RAG Indexing', description: 'Generating vector embeddings and writing collections to Chroma DB', range: [95, 100] },
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

  // --- SSE event listeners ---------------------------------------------------
  // Handlers close over the *current* jobId + selectedFile via ref so the
  // listener map is stable across re-renders and the SSE hook can keep using
  // its own callback ref pattern.
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
      addLog('🎬 Pipeline process initialized. Creating background execution context…', 'info');
    },
    audio_extraction_started: (data) => {
      console.log("[ProcessPage] event: audio_extraction_started", data);
      setProgress(SSE_PROGRESS_MAP.audio_extraction_started);
      addLog('🔊 Extracting audio stream and normalising parameters…', 'info');
    },
    audio_extracted: (data) => {
      console.log("[ProcessPage] event: audio_extracted", data);
      setProgress(SSE_PROGRESS_MAP.audio_extracted);
      setCurrentStage('transcription');
      const c = data?.chunks_count ?? 0;
      setChunksCount(c);
      const est = Math.max(c * 4 + 8, 12);
      setEstCompletionTime(est);
      addLog(`✅ Audio extraction complete. Partitioned media into ${c} chunk(s) for decoding.`, 'success');
      addLog(`⏳ Estimated completion countdown: ~${est}s remaining.`, 'info');
    },
    transcribing: (data) => {
      console.log("[ProcessPage] event: transcribing", data);
      setProgress(data?.progress ?? SSE_PROGRESS_MAP.transcribing);
      const msg = data?.chunk
        ? `Decoding audio segment ${data.chunk} of ${data.total_chunks} [Gemini STT]…`
        : 'Spawning Gemini STT process…';
      addLog(`📝 ${msg}`, 'info');
    },
    transcription_completed: (data) => {
      console.log("[ProcessPage] event: transcription_completed", data);
      setProgress(SSE_PROGRESS_MAP.transcription_completed);
      setCurrentStage('summarization');
      addLog('✅ Gemini transcription complete. Transcript compiled successfully.', 'success');
    },
    generating_title: (data) => {
      console.log("[ProcessPage] event: generating_title", data);
      setProgress(SSE_PROGRESS_MAP.generating_title);
      addLog('🏷️ Title extractor running — querying title representations…', 'info');
    },
    generating_summary: (data) => {
      console.log("[ProcessPage] event: generating_summary", data);
      setProgress(SSE_PROGRESS_MAP.generating_summary);
      addLog('📋 Running consolidated AI meeting analysis…', 'info');
    },
    extracting_action_items: (data) => {
      console.log("[ProcessPage] event: extracting_action_items", data);
      setProgress(SSE_PROGRESS_MAP.extracting_action_items);
      setCurrentStage('extraction');
      addLog('🔎 Parsing meeting contexts for actionable items, owners, and dates…', 'info');
    },
    extracting_decisions: (data) => {
      console.log("[ProcessPage] event: extracting_decisions", data);
      setProgress(SSE_PROGRESS_MAP.extracting_decisions);
      addLog('🔑 Parsing contexts for finalized assertions and core decisions…', 'info');
    },
    extracting_questions: (data) => {
      console.log("[ProcessPage] event: extracting_questions", data);
      setProgress(SSE_PROGRESS_MAP.extracting_questions);
      addLog('❓ Scanning open threads and follow-up queries…', 'info');
    },
    building_rag: (data) => {
      console.log("[ProcessPage] event: building_rag", data);
      setProgress(SSE_PROGRESS_MAP.building_rag);
      setCurrentStage('rag');
      addLog('🧠 Computing sentence embeddings and building indexing structures in Chroma DB…', 'info');
    },
    job_failed: (data) => {
      console.error("[ProcessPage] event: job_failed", data);
      const message = data?.message || 'Unknown pipeline error';
      setPipelineError(message);
      addLog(`❌ Job execution failed: ${message}`, 'error');
    },
  }), [addLog]);

  // onComplete fires from the hook once it sees a `completed` event; the
  // hook itself has already closed the EventSource. We persist + navigate.
  const onComplete = useCallback((data) => {
    console.log("[ProcessPage] event: completed", data);
    setProgress(100);
    setEstCompletionTime(0);
    addLog('🎉 Pipeline analysis successfully finished! Saving results to local cache…', 'success');

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

    setTimeout(() => navigate('/results', { state: { job: completedJob } }), 1500);
  }, [addJobToHistory, setActiveJob, navigate, addLog]);

  const { status: sseStatus } = useSSE(
    jobId ? `${api.baseUrl}/stream/${jobId}` : null,
    { eventListeners, onComplete }
  );

  // Auto-scroll logs terminal.
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logs]);

  // Elapsed + countdown timers.
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

  // File selection.
  const handleFileSelection = (file) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setValidationError(`Unsupported format .${ext}. Allowed: ${ALLOWED_EXT.join(', ').toUpperCase()}`);
      return;
    }
    if (file.size < MIN_BYTES) {
      setValidationError('File is too small. Please upload a file between 1MB and 300MB.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError('File exceeds 300MB. Please upload a file between 1MB and 300MB.');
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
  };

  // Submit.
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
      addLog(`Initializing file upload: ${selectedFile.name} (${FORMAT_BYTES(selectedFile.size)})…`, 'info');
      const response = await api.processVideo(
        selectedFile,
        language,
        (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(pct);
          if (pct === 100) addLog('Upload finished. Awaiting server pipeline initialization…', 'info');
        }
      );
      setIsUploading(false);
      addLog('Upload completed. File saved to server.', 'success');
      addLog(`Analysis job queued. ID: ${response.job_id}`, 'success');
      setJobId(response.job_id);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Server connection timed out';
      setPipelineError(msg);
      addLog(`Error submitting request: ${msg}`, 'error');
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

  // Connection badge maps our two health surfaces.
  const connectionStatus = backendStatus === 'WAKING_UP'
    ? 'WAKING_UP'
    : sseStatus === 'CONNECTING' || sseStatus === 'ERROR'
      ? sseStatus
      : 'CONNECTED';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-[360px] h-[360px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/15 blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!jobId ? (
            <motion.div
              key="submission"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm"
            >
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <h1 className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Start Analysis Pipeline
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
                  Upload a meeting recording to extract transcripts, summaries, action items, and build a RAG knowledge base.
                </p>
              </div>

              <form onSubmit={handleStartProcess} className="space-y-6">
                {/* Drag and drop */}
                <div>
                  <label className="block text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-2.5">
                    Meeting Recording File
                  </label>

                  {!selectedFile ? (
                    <motion.div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleFileSelection(f);
                      }}
                      onClick={() => document.getElementById('file-input').click()}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      animate={{ scale: isDragging ? 1.01 : 1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-violet-500 bg-violet-500/5'
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-violet-500 bg-white dark:bg-zinc-900/40'
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
                      <motion.div
                        animate={{ y: isDragging ? -4 : 0 }}
                        className="p-4 rounded-full bg-violet-500/10 text-violet-500 mb-4"
                      >
                        <Upload className="w-8 h-8" />
                      </motion.div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center font-syne">
                        Drag &amp; drop your meeting recording here
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 text-center font-mono">
                        or click to browse local files
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5 mt-5">
                        {ALLOWED_EXT.map((ext) => (
                          <span
                            key={ext}
                            className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400"
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="relative p-5 border border-violet-500/60 bg-violet-500/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-500 flex-shrink-0">
                          {isVideoFile(selectedFile.name) ? <Video className="w-6 h-6" /> : <FileAudio className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate font-syne">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {FORMAT_BYTES(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        aria-label="Remove selected file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {validationError && (
                    <div className="mt-3 text-xs text-rose-500 font-semibold flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-4 h-4" />
                      {validationError}
                    </div>
                  )}
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language-select" className="block text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-2.5">
                    Target Language
                  </label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:border-violet-500 outline-none font-mono transition-colors"
                  >
                    <option value="english">English (automatic Gemini translation)</option>
                    <option value="hinglish">Hinglish / Code-Switched (direct multi-lingual)</option>
                  </select>
                </div>

                {/* Upload progress */}
                {isUploading && (
                  <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-2 text-violet-600 dark:text-violet-300 font-syne">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading media file…
                      </span>
                      <span className="font-mono text-xs text-zinc-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 hover:shadow-[0_10px_30px_rgba(124,58,237,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow font-syne"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isUploading ? 'UPLOADING RECORDING…' : 'PROCESSING MEETING…'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      PROCESS MEETING
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Header card */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                    ID: {jobId}
                  </span>
                  <h2 className="font-syne text-base font-bold mt-1.5 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Database className="w-4 h-4 text-violet-500" />
                    Live Job Pipeline Tracker
                  </h2>
                </div>
                <ConnectionStatusBadge status={connectionStatus} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">Elapsed Time</p>
                    <p className="font-mono text-sm font-semibold mt-0.5 text-zinc-900 dark:text-zinc-100">{timeElapsed}s</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">Est. Completion</p>
                    <p className="font-mono text-sm font-semibold mt-0.5 text-zinc-900 dark:text-zinc-100">
                      {progress === 100 ? 'Done' : estCompletionTime > 0 ? `~${estCompletionTime}s remaining` : 'Calculating…'}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">Audio Chunks</p>
                    <p className="font-mono text-sm font-semibold mt-0.5 text-zinc-900 dark:text-zinc-100">
                      {chunksCount > 0 ? `${chunksCount} segment(s)` : 'Analyzing…'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress + timeline */}
              <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md space-y-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-[0.12em]">
                    <span className={`flex items-center gap-2 ${pipelineError ? 'text-rose-500' : progress === 100 ? 'text-emerald-500' : 'text-violet-500'}`}>
                      {progress < 100 && !pipelineError && <Loader2 className="w-4 h-4 animate-spin" />}
                      {progress === 100 && <CheckCircle2 className="w-4 h-4" />}
                      {pipelineError && <AlertTriangle className="w-4 h-4" />}
                      {pipelineError ? 'JOB TERMINATED' : progress === 100 ? 'PIPELINE COMPLETE' : 'EXECUTING PIPELINE'}
                    </span>
                    <span className="font-mono text-sm text-zinc-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        pipelineError
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                          : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-6 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    PIPELINE STAGES
                  </h3>
                  <ol className="relative pl-6 space-y-6 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 ml-3">
                    {STAGES.map((m) => {
                      const s = getMilestoneStatus(m);
                      return (
                        <li key={m.key} className="relative">
                          <div className={`absolute -left-[37px] top-0 w-6 h-6 rounded-full flex items-center justify-center border bg-white dark:bg-zinc-900 transition-all ${
                            s === 'completed' ? 'border-emerald-500 text-emerald-500' :
                            s === 'active' ? 'border-violet-500 text-violet-500 shadow-md shadow-violet-500/30 scale-110' :
                            s === 'failed' ? 'border-rose-500 text-rose-500' :
                            'border-zinc-300 dark:border-zinc-700 text-zinc-400'
                          }`}>
                            {s === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                            {s === 'active' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {s === 'pending' && <Clock className="w-3 h-3" />}
                            {s === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                          </div>
                          <div className="pl-3">
                            <h4 className={`text-sm font-semibold ${
                              s === 'active' ? 'text-violet-600 dark:text-violet-300 font-bold' :
                              s === 'completed' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                            }`}>{m.label}</h4>
                            <p className={`text-[11px] mt-0.5 font-medium leading-relaxed ${
                              s === 'active' ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400'
                            }`}>{m.description}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>

              {/* Terminal */}
              <div className="rounded-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
                <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-[0.12em] flex items-center gap-2 text-zinc-400">
                    <Terminal className="w-3.5 h-3.5 text-violet-400" />
                    Live System Logs
                  </span>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    streaming
                  </span>
                </div>
                <div className="p-4 text-zinc-300 font-mono text-[11px] h-52 overflow-y-auto space-y-2.5 select-text">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2.5 leading-relaxed items-start">
                      <span className="text-zinc-600 flex-shrink-0">[{log.timestamp}]</span>
                      <span className={
                        log.type === 'success' ? 'text-emerald-400 font-semibold' :
                        log.type === 'error' ? 'text-rose-400 font-semibold' : 'text-zinc-300'
                      }>{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-zinc-600 italic">Connecting and initializing process streams…</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {pipelineError && (
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-rose-500 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    Pipeline Job Terminated
                  </div>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                    {pipelineError}
                  </p>
                  <button
                    onClick={() => setJobId(null)}
                    className="w-fit mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors active:scale-95 flex items-center gap-1.5"
                  >
                    Configure New Job
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
