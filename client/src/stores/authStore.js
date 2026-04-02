import { create } from 'zustand';
import { authAPI } from '../utils/api';

const useAuthStore = create((set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,
  
  // UI state
  isAuthModalOpen: false,
  authMode: 'login', // 'login' or 'signup'
  
  // Loading states
  isLoading: false,
  loginLoading: false,
  signupLoading: false,
  wishlistLoading: false,
  
  // Wishlist
  wishlist: [],
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setIsAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoginLoading: (loading) => set({ loginLoading: loading }),
  setSignupLoading: (loading) => set({ signupLoading: loading }),
  
  // Auth actions
  login: async (email, password) => {
    set({ loginLoading: true });
    try {
      const response = await authAPI.login({ email, password });
      const { _id, name, email: userEmail, role, wishlist, token } = response.data;
      
      const user = { id: _id, name, email: userEmail, role };
      
      set({ user, isAuthenticated: true, token, wishlist: wishlist || [] });
      localStorage.setItem('token', token);
      set({ isAuthModalOpen: false });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    } finally {
      set({ loginLoading: false });
    }
  },
  
  signup: async (name, email, password) => {
    set({ signupLoading: true });
    try {
      const response = await authAPI.register({ name, email, password });
      const { _id, name: resName, email: userEmail, role, wishlist, token } = response.data;
      
      const user = { id: _id, name: resName, email: userEmail, role };
      
      set({ user, isAuthenticated: true, token, wishlist: wishlist || [] });
      localStorage.setItem('token', token);
      set({ isAuthModalOpen: false });
      return { success: true };
    } catch (error) {
      console.error('Registration/Signup error:', error.response || error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    } finally {
      set({ signupLoading: false });
    }
  },
  
  logout: () => {
    set({ 
      user: null, 
      isAuthenticated: false, 
      token: null,
      isAuthModalOpen: false
    });
    localStorage.removeItem('token');
  },
  
  // Initialize auth from localStorage
  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isLoading: true });
      try {
        const response = await authAPI.getProfile();
        const { _id, name, email, role, wishlist } = response.data;
        const user = { id: _id, name, email, role };
        set({ user, isAuthenticated: true, isLoading: false, wishlist: wishlist || [] });
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          token: null,
          isLoading: false 
        });
      }
    }
  },

  // Toggle wishlist
  toggleWishlist: async (propertyId) => {
    if (!get().isAuthenticated) return { success: false, error: 'Please login first' };
    
    set({ wishlistLoading: true });
    try {
      const response = await authAPI.toggleWishlist(propertyId);
      set({ wishlist: response.data.wishlist });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update wishlist' 
      };
    } finally {
      set({ wishlistLoading: false });
    }
  },

  // Fetch populated wishlist properties
  fetchWishlist: async () => {
    if (!get().isAuthenticated) return [];
    
    set({ isLoading: true });
    try {
      const response = await authAPI.getWishlist();
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch populated wishlist:', error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useAuthStore;