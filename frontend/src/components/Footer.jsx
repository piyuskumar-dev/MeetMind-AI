import React from 'react';
import { Github, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Code className="w-4 h-4 text-violet-500" />
          <span>Built with React 19, FastAPI, LangChain, and Gemini.</span>
        </div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">
          © {new Date().getFullYear()} MeetMind AI · Open source under MIT License.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/piyuskumar-dev/MeetMind-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 dark:text-zinc-400 hover:text-violet-500 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
