import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Brain, FileText, ListTodo, HelpCircle, ArrowRight, MessageSquare,
  Cpu
} from 'lucide-react';

export const Home = () => {
  const prefersReducedMotion = useReducedMotion();

  // Single fade-in. Stagger used only on the feature grid below.
  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: prefersReducedMotion ? 0 : 0.12 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 relative overflow-hidden">

      {/* Subtle grid pattern — ambient, low contrast. Decorative, not structural. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(167,139,250,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0"
      />

      {/* Ambient violet + cyan glows. Only on this page. */}
      <div className="pointer-events-none absolute top-20 -left-32 w-[420px] h-[420px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl z-0" />
      <div className="pointer-events-none absolute top-72 -right-40 w-[420px] h-[420px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/15 blur-3xl z-0" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-24 px-4 max-w-5xl mx-auto text-center z-10">
        <motion.h1
          {...fadeIn(0)}
          className="font-syne text-4xl sm:text-6xl font-extrabold leading-[1.05] mb-6 text-balance"
          style={{ letterSpacing: '-0.03em' }}
        >
          Analyze meetings &amp; videos.{' '}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 dark:from-violet-400 dark:via-fuchsia-400 dark:to-cyan-300 bg-clip-text text-transparent">
            Decisions, action items, and a chat.
          </span>
        </motion.h1>

        <motion.p
          {...fadeIn(0.15)}
          className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-sans text-pretty"
        >
          Drop a recording. MeetMind transcribes, summarizes, extracts what was decided and who owns what, then lets the team ask follow-up questions of that specific meeting.
        </motion.p>

        <motion.div
          {...fadeIn(0.3)}
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
        >
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
            <Link
              to="/process"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 hover:shadow-[0_10px_30px_rgba(124,58,237,0.35)] dark:shadow-[0_10px_30px_rgba(124,58,237,0.45)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            >
              Start Analyzing
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            >
              How it works
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Grid — non-identical card grid. */}
      <section className="relative py-16 sm:py-20 px-4 max-w-6xl mx-auto z-10 border-t border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2 className="font-syne text-2xl sm:text-3xl font-bold mb-3 text-balance text-zinc-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
            Four passes over one recording. Each one earns its place.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
            No manual notes, no second-tab summary, no re-listening to find who said what.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
        >
          {/* Card 1 — AI Summarization. Elaborative: headline + 3-line body. */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_8px_24px_rgba(124,58,237,0.18)] transition-[border-color,transform,box-shadow] duration-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Brain className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                01 — Summarization
              </span>
            </div>
            <h3 className="font-syne text-lg sm:text-xl font-bold mb-2 text-zinc-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
              An executive summary, not a transcript dump.
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Hierarchical chunking keeps the summary at the level a working team actually needs: what was discussed, what was concluded, what was deferred. No 'in this meeting we will…' filler.
            </p>
          </motion.article>

          {/* Card 2 — Action Items. Artifact: shows an actual item. */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_8px_24px_rgba(124,58,237,0.18)] transition-[border-color,transform,box-shadow] duration-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <ListTodo className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                02 — Action items
              </span>
            </div>
            <h3 className="font-syne text-lg sm:text-xl font-bold mb-4 text-zinc-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
              Owned, dated, and traceable to the line that introduced them.
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" aria-hidden="true" />
                <span><span className="font-medium text-zinc-900 dark:text-white">Ship analytics dashboard</span> — Asha — by Fri 18</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" aria-hidden="true" />
                <span><span className="font-medium text-zinc-900 dark:text-white">Confirm vendor contract terms</span> — Diego — by Mon 21</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" aria-hidden="true" />
                <span><span className="font-medium text-zinc-900 dark:text-white">Send recap to absent reviewers</span> — Priya — by Wed 23</span>
              </li>
            </ul>
          </motion.article>

          {/* Card 3 — Key Decisions. Terse: one declarative line. */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_8px_24px_rgba(124,58,237,0.18)] transition-[border-color,transform,box-shadow] duration-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                03 — Key decisions
              </span>
            </div>
            <h3 className="font-syne text-lg sm:text-xl font-bold mb-3 text-zinc-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
              The decisions, captured at the moment they were made.
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Each decision links back to the transcript position and the speaker. No more “I thought we agreed…” in next week’s standup.
            </p>
          </motion.article>

          {/* Card 4 — Chat. RAG case: question + answer shape. */}
          <motion.article
            variants={itemVariants}
            className="p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_8px_24px_rgba(124,58,237,0.18)] transition-[border-color,transform,box-shadow] duration-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HelpCircle className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                04 — Follow-up chat
              </span>
            </div>
            <h3 className="font-syne text-lg sm:text-xl font-bold mb-4 text-zinc-900 dark:text-white" style={{ letterSpacing: '-0.01em' }}>
              Ask this meeting. Not every meeting.
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400">›</span>{' '}
                <span>What did we decide about the Q3 launch date?</span>
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 pl-4 border-l-2 border-violet-500/40 leading-relaxed">
                Pushed from Aug 14 to Aug 28, contingent on the security review Diego is running. Source: chunk 12.
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Isolated per meeting. No cross-talk.</span>
            </div>
          </motion.article>
        </motion.div>
      </section>

      {/* SSE Architecture & Flow — the one place where the order of steps carries information. */}
      <section
        id="how-it-works"
        className="relative py-16 sm:py-20 px-4 bg-zinc-100/60 dark:bg-zinc-900/30 border-y border-zinc-200 dark:border-zinc-800 z-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <h2 className="font-syne text-2xl sm:text-3xl font-bold mb-3 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Each step streams as it finishes. No spinner, no wait, no surprise.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
              Server-Sent Events push the actual pipeline status to the browser as each stage completes. The progress bar is honest because the events are real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

            {/* Steps — 4 numbered steps. The order matters; this is a real sequence. */}
            <ol className="lg:col-span-2 space-y-5 sm:space-y-6">
              {[
                { step: '1', title: 'Job submission', desc: 'Recording uploads to /process. Backend issues a job ID and starts a worker thread.' },
                { step: '2', title: 'Event subscription', desc: 'Browser opens an EventSource to /stream/{job_id} over SSE.' },
                { step: '3', title: 'Live progression', desc: 'As each pipeline stage completes (extract, transcribe, summarize, index), the backend pushes the event.' },
                { step: '4', title: 'Results land', desc: 'Summary, action items, decisions, and chat become available. Transcript is searchable.' }
              ].map((step) => (
                <li key={step.step} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center justify-center font-syne font-bold text-sm"
                    aria-hidden="true"
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-base text-zinc-900 dark:text-white mb-1" style={{ letterSpacing: '-0.01em' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Architecture diagram — semantic SVG with title/desc. */}
            <div className="lg:col-span-3 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-500" aria-hidden="true" />
                  Live sequence
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  SSE
                </span>
              </div>

              <svg
                viewBox="0 0 520 280"
                className="w-full h-auto"
                role="img"
                aria-labelledby="arch-title arch-desc"
              >
                <title id="arch-title">MeetMind SSE pipeline diagram</title>
                <desc id="arch-desc">
                  A sequence showing the React client submitting a recording to the FastAPI backend, the backend streaming progress events back over Server-Sent Events, and the final result payload arriving with the transcript.
                </desc>

                {/* Lane labels */}
                <g fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="9" fontWeight="500" fill="currentColor" className="text-zinc-500 dark:text-zinc-400">
                  <text x="60" y="14" textAnchor="middle">React</text>
                  <text x="260" y="14" textAnchor="middle">FastAPI</text>
                  <text x="460" y="14" textAnchor="middle">Workers</text>
                </g>

                {/* Lifelines */}
                <g stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" className="text-zinc-300 dark:text-zinc-600">
                  <line x1="60" y1="24" x2="60" y2="262" />
                  <line x1="260" y1="24" x2="260" y2="262" />
                  <line x1="460" y1="24" x2="460" y2="262" />
                </g>

                {/* Arrows. flow → → */}
                <defs>
                  <marker id="arrow-violet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                  </marker>
                  <marker id="arrow-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                </defs>

                <g fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="9" fontWeight="500">
                  {/* 1. POST /process */}
                  <line x1="60" y1="56" x2="258" y2="56" stroke="#7c3aed" strokeWidth="1.25" markerEnd="url(#arrow-violet)" />
                  <text x="159" y="50" fill="#7c3aed" textAnchor="middle">1 — POST /process (file)</text>

                  {/* 2. Returns job_id */}
                  <line x1="260" y1="86" x2="62" y2="86" stroke="currentColor" strokeWidth="1" className="text-zinc-500 dark:text-zinc-400" />
                  <text x="159" y="80" fill="currentColor" textAnchor="middle" className="text-zinc-500 dark:text-zinc-400">2 — job_id</text>

                  {/* 3. Worker dispatched */}
                  <line x1="260" y1="116" x2="458" y2="116" stroke="#06b6d4" strokeWidth="1.25" markerEnd="url(#arrow-cyan)" />
                  <text x="359" y="110" fill="#06b6d4" textAnchor="middle">3 — worker thread</text>

                  {/* 4. Worker progress (small loop arrow) */}
                  <path d="M 460 142 Q 488 152 460 162" fill="none" stroke="#06b6d4" strokeWidth="1" />
                  <text x="494" y="156" fill="#06b6d4" textAnchor="middle" fontSize="8">stages</text>

                  {/* 5. SSE events streaming back */}
                  <line x1="460" y1="196" x2="62" y2="196" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
                  <text x="261" y="190" fill="#10b981" textAnchor="middle">4 — SSE: progress events</text>

                  {/* 6. Completed payload */}
                  <line x1="260" y1="232" x2="62" y2="232" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />
                  <text x="159" y="226" fill="#7c3aed" textAnchor="middle">5 — completed (transcript + summary)</text>
                </g>
              </svg>

              {/* Diagram legend */}
              <dl className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" aria-hidden="true" />
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">request</dt>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" aria-hidden="true" />
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">worker</dt>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">stream</dt>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA — single ghost link. No card, no glow, no second CTA-Gradient. */}
      <section className="py-16 sm:py-20 px-4 text-center z-10 max-w-2xl mx-auto">
        <h2 className="font-syne text-xl sm:text-2xl font-bold mb-3 text-balance" style={{ letterSpacing: '-0.02em' }}>
          The meeting is over. The work isn’t.
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 text-pretty">
          Drop a recording. Get a transcript, summary, action items, and a chat. The meeting closes in another tab.
        </p>
        <Link
          to="/process"
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300 hover:text-violet-500 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 rounded-md px-1 py-0.5"
        >
          Open the uploader
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      </section>
    </div>
  );
};

export default Home;
