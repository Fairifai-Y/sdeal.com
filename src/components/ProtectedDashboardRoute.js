import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Protects /dashboard: only signed-in users with role !== 'admin' can access.
 * Admins are redirected to /admin; unauthenticated users to sign-in.
 */
export default function ProtectedDashboardRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  const role = user?.publicMetadata?.role;
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
