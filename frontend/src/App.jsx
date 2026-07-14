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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Navbar />

      {backendStatus === 'WAKING_UP' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 py-2.5 px-4 text-xs sm:text-sm font-medium text-center flex items-center justify-center gap-2 z-50">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500" />
          </span>
          <span>Backend is starting up. Render free-tier wake-up can take up to 60 seconds.</span>
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 py-2.5 px-4 text-xs sm:text-sm font-medium text-center flex items-center justify-center gap-2 z-50">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Backend connected. Ready to process.</span>
        </div>
      )}

      <div className="flex-1">{children}</div>
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
