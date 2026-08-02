import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Brain, FileText, ListTodo, HelpCircle, ArrowRight, MessageSquare,
  Cpu, Sparkles, CheckCircle2
} from 'lucide-react';

export const Home = () => {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">

      {/* Hero Section */}
      <section className="pt-16 pb-16 sm:pt-24 sm:pb-20 px-4 max-w-5xl mx-auto text-center relative z-10">
        
        {/* Eyebrow badge */}
        <motion.div {...fadeIn(0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 mb-6 shadow-subtle">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Intelligent Meeting Analysis &amp; RAG System</span>
        </motion.div>

        <motion.h1
          {...fadeIn(0.1)}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-6 text-balance max-w-4xl mx-auto"
        >
          Transform long meeting recordings into actionable clarity.
        </motion.h1>

        <motion.p
          {...fadeIn(0.2)}
          className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-9 leading-relaxed text-pretty font-normal"
        >
          Upload video or audio recordings to automatically transcribe speech, extract key decisions and assigned tasks, and ask targeted questions grounded in meeting context.
        </motion.p>

        <motion.div
          {...fadeIn(0.3)}
          className="flex flex-col sm:flex-row justify-center gap-3"
        >
          <Link
            to="/process"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-subtle transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>Analyze Meeting</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            System Architecture
          </a>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 sm:py-20 px-4 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Structured analysis pipeline. Zero manual note-taking.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Every recording runs through neural speech-to-text, executive summarization, and vector indexing for instant retrieval.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* Feature 1 — Summarization */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 saas-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Executive Summarization
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white tracking-tight">
              Hierarchical summaries tailored for busy teams.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Consolidates complex discussions into clean, structured executive synopses without repetitive transcript noise or conversational filler.
            </p>
          </motion.article>

          {/* Feature 2 — Action Items */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 saas-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ListTodo className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Action Items &amp; Owners
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white tracking-tight">
              Task assignments with explicit deadlines.
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Finalize dashboard designs</strong> — Asha (Fri 18)</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Review API security specs</strong> — Diego (Mon 21)</span>
              </li>
            </ul>
          </motion.article>

          {/* Feature 3 — Key Decisions */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 saas-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <FileText className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Key Decisions Record
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white tracking-tight">
              Single source of truth for team choices.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts explicit assertions and agreed-upon direction directly linked to timestamps and meeting context.
            </p>
          </motion.article>

          {/* Feature 4 — RAG Q&A Chat */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 saas-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <HelpCircle className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contextual RAG Chat
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white tracking-tight">
              Interactive Q&amp;A over transcript vectors.
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-slate-500">Q: When is the target release date?</div>
              <div className="text-slate-900 dark:text-slate-100 font-sans font-medium">Aug 28 — confirmed by team lead (chunk #4).</div>
            </div>
          </motion.article>
        </motion.div>
      </section>

      {/* SSE Architecture Section */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              Real-time pipeline progression via Server-Sent Events.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Track intermediate execution milestones as workers process media, generate STT output, extract insights, and index vector embeddings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            
            {/* Steps list */}
            <ol className="lg:col-span-2 space-y-6">
              {[
                { step: '01', title: 'File Upload', desc: 'Media file posts to /process endpoint; worker thread issues job identifier.' },
                { step: '02', title: 'SSE Connection', desc: 'Client opens EventSource stream to track stage progression in real time.' },
                { step: '03', title: 'Neural Pipeline', desc: 'Audio extraction, Gemini speech transcription, and LLM extraction execute.' },
                { step: '04', title: 'Vector Workspace', desc: 'Embeddings persist in Chroma vector store for RAG follow-up queries.' }
              ].map((s) => (
                <li key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-mono text-xs font-semibold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Architecture SVG diagram */}
            <div className="lg:col-span-3 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-subtle">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Execution Sequence Diagram
                </h3>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  SSE STREAM
                </span>
              </div>

              <svg
                viewBox="0 0 520 270"
                className="w-full h-auto font-mono text-[9px]"
                role="img"
                aria-label="Architecture diagram"
              >
                <g fill="currentColor" className="text-slate-500 dark:text-slate-400 font-semibold">
                  <text x="60" y="14" textAnchor="middle">React Client</text>
                  <text x="260" y="14" textAnchor="middle">FastAPI Engine</text>
                  <text x="460" y="14" textAnchor="middle">Worker Loop</text>
                </g>

                <g stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800">
                  <line x1="60" y1="24" x2="60" y2="250" />
                  <line x1="260" y1="24" x2="260" y2="250" />
                  <line x1="460" y1="24" x2="460" y2="250" />
                </g>

                <defs>
                  <marker id="arrow-indigo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4F46E5" />
                  </marker>
                  <marker id="arrow-emerald" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                  </marker>
                </defs>

                <g>
                  {/* POST /process */}
                  <line x1="60" y1="56" x2="258" y2="56" stroke="#4F46E5" strokeWidth="1.5" markerEnd="url(#arrow-indigo)" />
                  <text x="159" y="50" fill="#4F46E5" textAnchor="middle" className="font-medium">1. POST /process (media file)</text>

                  {/* Return job_id */}
                  <line x1="260" y1="86" x2="62" y2="86" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <text x="159" y="80" fill="currentColor" textAnchor="middle" className="text-slate-500">2. return job_id</text>

                  {/* Dispatch worker */}
                  <line x1="260" y1="116" x2="458" y2="116" stroke="#0284C7" strokeWidth="1.5" />
                  <text x="359" y="110" fill="#0284C7" textAnchor="middle">3. dispatch async worker</text>

                  {/* SSE events */}
                  <line x1="460" y1="180" x2="62" y2="180" stroke="#10B981" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
                  <text x="261" y="174" fill="#10B981" textAnchor="middle">4. SSE: live progress stream</text>

                  {/* Results complete */}
                  <line x1="260" y1="220" x2="62" y2="220" stroke="#4F46E5" strokeWidth="1.5" markerEnd="url(#arrow-indigo)" />
                  <text x="159" y="214" fill="#4F46E5" textAnchor="middle">5. complete payload</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 px-4 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Ready to process your meeting?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Upload audio or video files in MP4, MP3, WAV, or MOV format.
        </p>
        <Link
          to="/process"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span>Start Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};

export default Home;

