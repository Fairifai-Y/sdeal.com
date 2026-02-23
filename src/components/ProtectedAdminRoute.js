import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Protects /admin: only users with publicMetadata.role === 'admin' can access.
 * Others are redirected to sign-in (if not signed in) or /dashboard (if signed in as regular user).
 */
export default function ProtectedAdminRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  const role = user?.publicMetadata?.role;
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
