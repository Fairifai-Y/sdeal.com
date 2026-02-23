import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shown when REACT_APP_CLERK_PUBLISHABLE_KEY is not set (e.g. missing in Vercel env).
 * Prevents white screen; auth routes show this instead of crashing.
 */
export default function ClerkNotConfigured() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: 24,
      textAlign: 'center',
    }}>
      <p style={{ marginBottom: 16 }}>Inloggen is op dit moment niet beschikbaar.</p>
      <Link to="/">Terug naar home</Link>
    </div>
  );
}
