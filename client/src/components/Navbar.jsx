import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import useSearchStore from '../stores/searchStore';

const Navbar = () => {
  const { user, isAuthenticated, logout, setIsAuthModalOpen, setAuthMode } = useAuthStore();
  const { resetSearch } = useSearchStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    resetSearch();
    setMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex-shrink-0 flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl md:text-2xl font-bold text-primary-600">HomeStay</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">Welcome, {user?.name?.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLoginClick}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Login
                </button>
                <button
                  onClick={handleSignupClick}
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="text-gray-700 text-sm py-2 border-b border-gray-100">
                  Welcome, {user?.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-full py-2 text-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-gray-600 hover:text-gray-900 font-medium w-full py-2 text-left text-sm"
                >
                  Login
                </button>
                <button
                  onClick={handleSignupClick}
                  className="btn-primary w-full py-2 text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;