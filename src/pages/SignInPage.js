import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import './SignInPage.css';

export default function SignInPage() {
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  return (
    <div className="sign-in-page">
      <div className="sign-in-container">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl={from}
          redirectUrl={from}
        />
      </div>
    </div>
  );
}
