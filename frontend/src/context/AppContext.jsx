import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

// Health check cadence. Aggressive while WAKING_UP (Render free tier cold starts
// can take 30–60s), relaxed once ONLINE so we don't hammer the server.
const PING_INTERVAL_MS = 4000;
const PING_INTERVAL_RELAXED_MS = 30000;

const AppContext = createContext(null);

const readSavedTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage unavailable — fall through */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readSavedHistory = () => {
  try {
    const raw = localStorage.getItem('job_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const AppProvider = ({ children }) => {
  // 'WAKING_UP' | 'CONNECTED' | 'ERROR'
  const [backendStatus, setBackendStatus] = useState('WAKING_UP');
  const [theme, setTheme] = useState(readSavedTheme);

  // jobHistory is the canonical persisted store. activeJobHistory is the
  // working set — jobs surfaced on the dashboard / sidebar for the current
  // session. Kept as a separate field so the brief's required shape is
  // preserved even though the two arrays share members in practice.
  const [jobHistory, setJobHistory] = useState(readSavedHistory);
  const [activeJobHistory, setActiveJobHistory] = useState(() => readSavedHistory().slice(0, 10));
  const [activeJob, setActiveJob] = useState(null);

  const intervalRef = useRef(null);

  // Theme → DOM + storage.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  // Persist history whenever it changes.
  useEffect(() => {
    try { localStorage.setItem('job_history', JSON.stringify(jobHistory)); } catch { /* ignore */ }
  }, [jobHistory]);

  // Keep activeJobHistory in sync — most recent 10.
  useEffect(() => {
    setActiveJobHistory(jobHistory.slice(0, 10));
  }, [jobHistory]);

  // Health check loop. Short interval while WAKING_UP, long once ONLINE.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        await api.getRoot();
        if (cancelled) return;
        setBackendStatus((prev) => (prev === 'CONNECTED' ? prev : 'CONNECTED'));
        scheduleNext(PING_INTERVAL_RELAXED_MS);
      } catch {
        if (cancelled) return;
        setBackendStatus('WAKING_UP');
        scheduleNext(PING_INTERVAL_MS);
      }
    };

    const scheduleNext = (delay) => {
      if (cancelled) return;
      if (intervalRef.current) clearTimeout(intervalRef.current);
      intervalRef.current = setTimeout(tick, delay);
    };

    // First ping immediately.
    tick();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearTimeout(intervalRef.current);
      intervalRef.current = null;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addJobToHistory = useCallback((job) => {
    setJobHistory((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev;
      return [job, ...prev];
    });
  }, []);

  const removeJobFromHistory = useCallback((jobId) => {
    setJobHistory((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const clearHistory = useCallback(() => {
    setJobHistory([]);
    setActiveJobHistory([]);
    setActiveJob(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        backendStatus,
        jobHistory,
        activeJobHistory,
        activeJob,
        setActiveJob,
        addJobToHistory,
        removeJobFromHistory,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
