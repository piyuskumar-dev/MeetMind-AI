import React from 'react';
import { Github, Code, Cpu } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border-light dark:border-border-dark bg-white dark:bg-[#0a0a0f] py-6 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Author / Repository */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Code className="w-4 h-4 text-accent" />
          <span>Built with React 19, FastAPI, LangChain, and Whisper.</span>
        </div>

        {/* Brand */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} AI Video Assistant. Open Source under MIT License.
        </div>

        {/* Social / Dev links */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/piyuskumar-dev/MeetMind AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};
