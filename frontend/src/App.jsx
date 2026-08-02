import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProcessPage } from './pages/ProcessPage';
import { ResultsDashboard } from './pages/ResultsDashboard';
import { ChatPage } from './pages/ChatPage';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

const Layout = ({ children }) => {
  const { backendStatus } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (backendStatus === 'CONNECTED') {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 4500);
      return () => clearTimeout(t);
    }
  }, [backendStatus]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      {backendStatus === 'WAKING_UP' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 py-2 px-4 text-xs font-mono font-medium text-center flex items-center justify-center gap-2 z-50">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500" />
          </span>
          <span>Backend service starting up. Render free-tier cold start may require 30–60s.</span>
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 py-2 px-4 text-xs font-mono font-medium text-center flex items-center justify-center gap-2 z-50">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Backend service connected and operational.</span>
        </div>
      )}

      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/results" element={<ResultsDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;

