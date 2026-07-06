import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Film, Info, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { theme, toggleTheme } = useApp();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border-light dark:border-border-dark bg-white/70 dark:bg-[#0a0a0f]/70 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-syne text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-cyan">
              <Film className="w-6 h-6 text-accent animate-pulse-slow" />
              <span>AI Video Assistant</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium transition-colors relative py-1 ${isActive('/') ? 'text-accent dark:text-accent-glow font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent-glow'}`}>
              Home
              {isActive('/') && (
                <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </Link>
            <Link to="/process" className={`text-sm font-medium transition-colors relative py-1 ${isActive('/process') ? 'text-accent dark:text-accent-glow font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent-glow'}`}>
              Analyze Video
              {isActive('/process') && (
                <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </Link>
            <Link to="/about" className={`text-sm font-medium transition-colors relative py-1 ${isActive('/about') ? 'text-accent dark:text-accent-glow font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent-glow'}`}>
              About
              {isActive('/about') && (
                <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </Link>
          </div>

          {/* Right Section (Theme Toggle + CTA) */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-surface-dark2 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-opacity-80 transition-colors"
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <Link to="/process" className="hidden sm:inline-flex items-center gap-1 px-4 h-10 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-accent to-purple-700 hover:shadow-lg hover:shadow-accent/20 transition-all active:scale-95 duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
