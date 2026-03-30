import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthModal from './components/AuthModal';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminPage && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      {!isAdminPage && <Footer />}
      <AuthModal />
    </div>
  );
}

function App() {
  const initAuth = useAuthStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <AppContent />
    </Router>
  );
}

export default App;