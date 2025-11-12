import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role?.nom === 'client') {
    return <Navigate to="/home" replace />;
  }

  // Admin and organizer go to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default RoleBasedRedirect;
