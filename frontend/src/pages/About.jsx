import React from 'react';
import { ShieldCheck, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = {
  backend: [
    ['Gemini Audio STT', 'Transcribes audio with high fidelity directly using Gemini models.'],
    ['Chroma Database', 'Embeds split document collections for context matching.'],
    ['LangChain', 'Connects LLM prompts to output parsers for summary extraction.'],
    ['SSE Streaming', 'Asynchronous worker loops emit live task statuses.'],
  ],
  frontend: [
    ['Tailwind CSS', 'Standard styling config with dark/light theme tokens.'],
    ['Framer Motion', 'Drives spring animations, sliders, and timeline progressions.'],
    ['EventSource API', 'Standardized hook monitors API streaming progress.'],
    ['Client-side PDF', 'Generates print-ready layout from the browser.'],
  ],
};

export const About = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-32 w-[420px] h-[420px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl" />
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <div className="text-center">
          <h1 className="font-syne text-3xl sm:text-5xl font-extrabold mb-4 text-zinc-900 dark:text-white">About MeetMind AI</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
            A production-grade meeting minutes compiler that uses neural audio transcription and vector-index search.
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md space-y-5"
        >
          <h2 className="font-syne text-xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-3 text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            The problem and our solution
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Video conferences and presentations contain high concentrations of strategic deliverables, decisions, and knowledge. Referencing past meeting specifics usually requires manual transcript scanning, which is slow and error-prone.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <strong className="text-zinc-900 dark:text-white">MeetMind AI</strong> addresses this with automatic audio splitting, Gemini-powered speech-to-text, and modular retrieval. It streams progress events via Server-Sent Events so users see intermediate processing steps without waiting for the full LLM chain to finish.
          </p>
        </motion.section>

        <section className="space-y-6">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 text-center">System technical highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md space-y-4">
              <h3 className="font-syne font-bold text-base text-violet-600 dark:text-violet-300 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                FastAPI Backend
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                {features.backend.map(([t, d]) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900 dark:text-white">{t}:</strong> {d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md space-y-4">
              <h3 className="font-syne font-bold text-base text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                React 19 + Vite Frontend
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                {features.frontend.map(([t, d]) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900 dark:text-white">{t}:</strong> {d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
