import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuth } from '../auth';

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = getAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'CLIENTE') return <Navigate to="/" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TRABAJADOR') return <Navigate to="/worker/dashboard" replace />;
  }

  return children;
}
