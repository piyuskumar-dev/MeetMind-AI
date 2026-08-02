import React from 'react';
import { Cpu, Layers, CheckCircle2, FileText, Code2, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const features = {
  backend: [
    ['Gemini Neural Audio STT', 'Transcribes spoken audio directly into text using Google Gemini models.'],
    ['LangGraph DAG Architecture', 'Orchestrates deterministic state machine execution and audio chunking.'],
    ['LangSmith Observability', 'Provides deep tracing, performance monitoring, and run metadata tagging.'],
    ['Vector Store & RAG Index', 'Embeds audio chunks into vector representations for cosine similarity retrieval.'],
    ['Server-Sent Events (SSE)', 'Streams live background pipeline stage events to the frontend client.'],
  ],
  frontend: [
    ['Tailwind CSS Design System', 'Clean neutral slate design tokens with subtle elevation and typography.'],
    ['Framer Motion', 'Provides spring transitions for timeline progress and card accordions.'],
    ['EventSource API Integration', 'Subscribes to SSE execution events and streams live logs.'],
    ['Print-Ready PDF & Markdown Export', 'Generates clean markdown and PDF documentation client-side.'],
  ],
};

export const About = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            MeetMind AI Platform Architecture
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            An enterprise-grade meeting intelligence system built on neural speech transcription, DAG workflow orchestration, and vector retrieval.
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="saas-card p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              System Overview &amp; Capabilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Unstructured video and audio recordings hold critical decisions, task assignments, and strategic direction. MeetMind AI converts these media files into structured executive summaries, categorized action items, and an interactive knowledge index.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            By streaming progress events over Server-Sent Events (SSE), users monitor live speech extraction, chunking, and vector indexing step-by-step.
          </p>
        </motion.section>

        <section className="space-y-4">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
            Technical Stack &amp; Implementation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="saas-card p-6 space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                FastAPI &amp; Python Core
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                {features.backend.map(([t, d]) => (
                  <li key={t} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-white font-medium">{t}:</strong> {d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="saas-card p-6 space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                React 19 &amp; Vite Frontend
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                {features.frontend.map(([t, d]) => (
                  <li key={t} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-slate-900 dark:text-white font-medium">{t}:</strong> {d}</span>
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

