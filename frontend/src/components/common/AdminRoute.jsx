import React from 'react';
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute adminOnly={true}>
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute;