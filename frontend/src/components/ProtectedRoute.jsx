import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Authentication status check pannitu irukku
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Loading Farm2Market...</h2>
          <p>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  // Login pannala na login page-ku redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role access panna dashboard-ku redirect
  if (role && user.role !== role) {
    return (
      <Navigate
        to={`/${user.role.toLowerCase()}/dashboard`}
        replace
      />
    );
  }

  // Correct user + correct role
  return children;
}