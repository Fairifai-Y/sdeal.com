import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useUser();

  return (
    <>
      <SEOHead
        title="Dashboard - SDeal"
        description="Your SDeal dashboard"
      />
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <Link to="/" className="dashboard-logo">SDeal</Link>
            <div className="dashboard-user">
              <span className="dashboard-email">{user?.primaryEmailAddress?.emailAddress}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <h1>Dashboard</h1>
          <p className="dashboard-welcome">
            Welkom, {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'gebruiker'}.
          </p>
          <p>Dit is je persoonlijke dashboard. Hier kun je later je verkopen, orders en instellingen beheren.</p>
        </main>
      </div>
    </>
  );
}
