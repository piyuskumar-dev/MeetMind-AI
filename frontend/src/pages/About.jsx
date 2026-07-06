import React from 'react';
import { ShieldCheck, Cpu, MessageSquare, Database, RefreshCw, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const About = () => {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Banner Title */}
        <div className="text-center">
          <h1 className="font-syne text-3xl sm:text-5xl font-extrabold mb-4">About AI Video Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
            A production-grade meeting minutes compiler that uses neural audio transcription and vector-index searches.
          </p>
        </div>

        {/* Core Architectural Narrative */}
        <section className="premium-card p-6 sm:p-8 space-y-6">
          <h2 className="font-syne text-xl font-bold border-b border-border-light dark:border-border-dark pb-3 text-gray-900 dark:text-white">
            The Problem & Our Solution
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
            Modern video conferences and presentations contain high concentrations of strategic deliverables, decisions, and knowledge. However, referencing past meeting specifics usually requires manual transcript scanning, which is time-consuming and error-prone.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
            <strong>AI Video Assistant</strong> addresses this by using automatic audio splitting, Gemini-powered speech-to-text, and modular retrieval systems. It streams progress events via Server-Sent Events (SSE) so users receive intermediate processing steps without waiting for long LLM chains to finish.
          </p>
        </section>

        {/* Tech Stack Cards */}
        <section className="space-y-6">
          <h2 className="font-syne text-lg font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
            System Technical Highlights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backend stack */}
            <div className="premium-card p-6 space-y-4">
              <h3 className="font-syne font-bold text-md text-accent flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                FastAPI Backend Services
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-700 dark:text-gray-400 font-sans">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>Gemini Audio STT:</strong> Transcribes audio with high fidelity directly using Gemini models.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>Chroma Database:</strong> Embeds split document collections for context matching.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>LangChain:</strong> Connects LLM prompts to output parsers for summary extraction.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>SSE Streaming:</strong> Asynchronous thread loops emit live task statuses.</span>
                </li>
              </ul>
            </div>

            {/* Frontend stack */}
            <div className="premium-card p-6 space-y-4">
              <h3 className="font-syne font-bold text-md text-accent-cyan flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Vite + React 19 Frontend
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-700 dark:text-gray-400 font-sans">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>Tailwind CSS:</strong> Standard styling config with support for dark/light themes.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>Framer Motion:</strong> Drives spring animations, sliders, and timeline progressions.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>EventSource API:</strong> Standardized hook monitors API streaming progress logs.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-success flex-shrink-0" />
                  <span><strong>Custom PDF Compiler:</strong> Generates beautiful layout formats on the client side.</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

// Helper for local checklist rendering
const CheckCircle2 = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default About;
