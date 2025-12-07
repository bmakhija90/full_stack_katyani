import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;