import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProcessPage } from './pages/ProcessPage';
import { ResultsDashboard } from './pages/ResultsDashboard';
import { ChatPage } from './pages/ChatPage';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

// Layout wrapper to conditional render Footer based on route
const Layout = ({ children }) => {
  const location = useLocation();
  // Hide footer on dashboard pages to maximize display space
  const hideFooterRoutes = ['/results', '/chat'];
  const showFooter = !hideFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />
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
