import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProcessPage } from './pages/ProcessPage';
import { ResultsDashboard } from './pages/ResultsDashboard';
import { ChatPage } from './pages/ChatPage';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

// Layout wrapper to conditional render Footer and handle backend alerts
const Layout = ({ children }) => {
  const { backendStatus } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (backendStatus === 'ONLINE') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [backendStatus]);

  // Hide footer on dashboard pages to maximize display space
  const hideFooterRoutes = ['/results', '/chat'];
  const showFooter = !hideFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      {/* Backend Wake-up Alert Banners */}
      {backendStatus === 'WAKING_UP' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 py-2.5 px-4 text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2 animate-pulse z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>Backend is starting up... Please wait (Render free tier wake-up can take up to 60 seconds)</span>
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 py-2.5 px-4 text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2 transition-opacity duration-500 z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Backend connected successfully! Ready to process.</span>
        </div>
      )}

      <div className="flex-grow">
        {children}
      </div>
      {showFooter && <Footer />}
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
