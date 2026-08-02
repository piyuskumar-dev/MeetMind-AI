import React from 'react';
import { Github, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] py-5 px-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Built with React 19, FastAPI, LangGraph, LangChain &amp; Gemini.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <span>© {new Date().getFullYear()} MeetMind AI</span>
          <span>·</span>
          <a
            href="https://github.com/piyuskumar-dev/MeetMind-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

