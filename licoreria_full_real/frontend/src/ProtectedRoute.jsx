import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuth } from './auth';

export default function ProtectedRoute({ children, roles = [] }) {
  const location = useLocation();
  const { user, token } = getAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
