import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      const profile = await authService.getProfile();
      setUser(profile);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      toast.error(error.error || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      const profile = await authService.getProfile();
      setUser(profile);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      toast.error(error.error || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = (profileData) => {
    setUser(prev => ({ ...prev, ...profileData }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};