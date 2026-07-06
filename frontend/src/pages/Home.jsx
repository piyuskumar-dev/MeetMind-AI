import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, Brain, FileText, ListTodo, HelpCircle, ArrowRight, CheckCircle2,
  Tv, Cpu, Database, Server, RefreshCw
} from 'lucide-react';

export const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Grid Pattern BG */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-70" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent dark:text-accent-glow text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Zap className="w-3 h-3" />
          <span>Real-time SSE Powered Pipeline</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="font-syne text-4xl sm:text-6xl font-extrabold tracking-tight leading-none mb-6"
        >
          Analyze Meetings & Videos <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-accent-glow to-accent-cyan">
            Instantly with Agentic AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-sans"
        >
          Extract structured transcripts, comprehensive summaries, action items, core decisions, and chat with your files using local Whisper transcribing and a vector database RAG pipeline.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex justify-center gap-4"
        >
          <Link
            to="/process"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-accent to-purple-700 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            Start Analyzing
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            Learn More
          </a>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative py-16 px-4 max-w-7xl mx-auto z-10 border-t border-border-light dark:border-border-dark">
        <div className="text-center mb-12">
          <h2 className="font-syne text-3xl font-bold tracking-tight mb-3">Core Features</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Powered by modern models and architectural pipelines to structure your meeting minutes.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              icon: <Brain className="w-6 h-6 text-accent" />,
              title: "AI Summarization",
              desc: "Hierarchical chunk mapping yields bulletproof, high-quality professional summaries."
            },
            {
              icon: <ListTodo className="w-6 h-6 text-accent-cyan" />,
              title: "Action Item Extraction",
              desc: "Automatically detects deliverables, specifying tasks, assignees, and target deadlines."
            },
            {
              icon: <FileText className="w-6 h-6 text-accent-success" />,
              title: "Key Decisions",
              desc: "Tracks decision-making log milestones through context matching models."
            },
            {
              icon: <HelpCircle className="w-6 h-6 text-accent-warning" />,
              title: "RAG Knowledge Base",
              desc: "Stores chunk indices in vector DB collections for token-by-token question chat streaming."
            }
          ].map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-[#111118] hover:border-accent transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="p-3 bg-accent/5 rounded-xl w-fit mb-4 group-hover:bg-accent/10 transition-colors">
                {feat.icon}
              </div>
              <h3 className="font-syne font-bold text-lg mb-2 text-gray-900 dark:text-white">{feat.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works / SSE Flow diagram */}
      <section className="relative py-16 px-4 bg-gray-50 dark:bg-surface-dark2/20 border-y border-border-light dark:border-border-dark z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-syne text-3xl font-bold tracking-tight mb-3">SSE Architecture & Flow</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              Our real-time event pipeline eliminates wait times by streaming progress indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Steps text */}
            <div className="space-y-6">
              {[
                { step: "1", title: "Job Submission", desc: "User triggers process with YouTube URL or audio/video uploads. Backend issues a job ID." },
                { step: "2", title: "Event Subscription", desc: "React frontend creates EventSource connecting to /stream/{job_id} SSE endpoint." },
                { step: "3", title: "Live Progression", desc: "As steps (transcription, summaries) run, backend pushes JSON events to client queue." },
                { step: "4", title: "Final Deliverable", desc: "Completed results load into dashboard cache and RAG vector search becomes active." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-md text-gray-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture SVG diagram */}
            <div className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-[#111118] shadow-inner">
              <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                Live Sequence Architecture
              </h3>
              
              {/* Premium SVG Diagram */}
              <svg viewBox="0 0 500 280" className="w-full h-auto text-gray-600 dark:text-gray-300">
                {/* Nodes */}
                <rect x="20" y="20" width="80" height="40" rx="6" fill="#7c3aed" fillOpacity="0.1" stroke="#7c3aed" strokeWidth="1.5" />
                <text x="60" y="45" fill="currentColor" fontSize="10" fontWeight="bold" textAnchor="middle">React UI</text>

                <rect x="210" y="20" width="80" height="40" rx="6" fill="#06b6d4" fillOpacity="0.1" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="250" y="45" fill="currentColor" fontSize="10" fontWeight="bold" textAnchor="middle">FastAPI</text>

                <rect x="400" y="20" width="80" height="40" rx="6" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1.5" />
                <text x="440" y="45" fill="currentColor" fontSize="10" fontWeight="bold" textAnchor="middle">RAG / LLM</text>

                {/* Vertical Lines */}
                <line x1="60" y1="60" x2="60" y2="250" stroke="#4b5563" strokeDasharray="3" />
                <line x1="250" y1="60" x2="250" y2="250" stroke="#4b5563" strokeDasharray="3" />
                <line x1="440" y1="60" x2="440" y2="250" stroke="#4b5563" strokeDasharray="3" />

                {/* Flows */}
                {/* 1. POST /process */}
                <path d="M 60 90 L 242 90" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x="155" y="83" fill="#7c3aed" fontSize="8" fontWeight="bold" textAnchor="middle">1. POST /process</text>

                {/* 2. Job ID returned */}
                <path d="M 250 115 L 68 115" stroke="#4b5563" strokeWidth="1.2" strokeDasharray="3" markerEnd="url(#arrow)" />
                <text x="155" y="109" fill="currentColor" fontSize="8" textAnchor="middle">2. Returns Job ID</text>

                {/* 3. GET /stream */}
                <path d="M 60 145 L 242 145" stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x="155" y="138" fill="#06b6d4" fontSize="8" fontWeight="bold" textAnchor="middle">{"3. GET /stream/{job_id}"}</text>

                {/* 4. Background tasks start */}
                <path d="M 250 160 H 300 V 180 H 252" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#arrow)" />
                <text x="310" y="174" fill="currentColor" fontSize="7" textAnchor="start">Trigger thread</text>

                {/* 5. Live SSE progress */}
                <path d="M 250 205 L 68 205" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x="155" y="199" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">4. SSE: transcribing, summary...</text>

                {/* 6. Completed payload */}
                <path d="M 250 235 L 68 235" stroke="#7c3aed" strokeWidth="1.8" markerEnd="url(#arrow)" />
                <text x="155" y="229" fill="#7c3aed" fontSize="8" fontWeight="bold" textAnchor="middle">5. SSE: Completed (payload)</text>

                {/* Definitions for Markers */}
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 px-4 text-center z-10 max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl border border-border-light dark:border-border-dark bg-white dark:bg-[#111118] relative overflow-hidden shadow-xl">
          <div className="absolute -right-24 -bottom-24 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -top-24 w-48 h-48 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />
          
          <h2 className="font-syne text-3xl font-bold tracking-tight mb-4">Ready to unlock meeting intelligence?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Stop manually scripting summaries. Paste the audio file or Youtube link and watch AI structure it in real-time.
          </p>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-accent to-purple-700 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            Launch Assistant
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
export default Home;
