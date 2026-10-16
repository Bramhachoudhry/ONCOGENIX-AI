import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('oncogenix_token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
