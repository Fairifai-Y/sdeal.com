import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import './SignInPage.css';

export default function SignUpPage() {
  return (
    <div className="sign-in-page">
      <div className="sign-in-container">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
