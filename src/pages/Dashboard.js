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
        <header className="admin-header-top">
          <Link to="/" className="admin-logo-link">
            <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="admin-logo" />
          </Link>
          <div className="dashboard-user">
            <span className="dashboard-user-name">{user?.firstName || 'Gebruiker'}</span>
            <UserButton afterSignOutUrl="/" />
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
