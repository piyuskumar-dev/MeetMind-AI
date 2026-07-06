import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // History of completed jobs
  const [jobHistory, setJobHistory] = useState(() => {
    const saved = localStorage.getItem('job_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Active analysis job
  const [activeJob, setActiveJob] = useState(null);

  // Sync theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync job history to localStorage
  useEffect(() => {
    localStorage.setItem('job_history', JSON.stringify(jobHistory));
  }, [jobHistory]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addJobToHistory = (job) => {
    setJobHistory(prev => {
      // Avoid duplicates
      const exists = prev.some(item => item.id === job.id);
      if (exists) return prev;
      return [job, ...prev];
    });
  };

  const removeJobFromHistory = (jobId) => {
    setJobHistory(prev => prev.filter(job => job.id !== jobId));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        jobHistory,
        setJobHistory,
        addJobToHistory,
        removeJobFromHistory,
        activeJob,
        setActiveJob
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
