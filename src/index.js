import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  console.warn('REACT_APP_CLERK_PUBLISHABLE_KEY is missing. Sign-in and protected routes will not work.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const app = <App />;
root.render(
  <React.StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey}>
        {app}
      </ClerkProvider>
    ) : (
      app
    )}
  </React.StrictMode>
); 