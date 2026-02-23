import React, { useState, useEffect } from 'react';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import SEOHead from '../components/SEOHead';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardLanguageSwitcher from '../components/DashboardLanguageSwitcher';
import DashboardFinance from './DashboardFinance';
import './Dashboard.css';

function getApiBase() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const isFinance = (location.pathname || '').includes('/finance');
  const [sellerInfo, setSellerInfo] = useState(null);
  const [sellerError, setSellerError] = useState(null);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setSellerLoading(true);
    setSellerError(null);
    async function fetchSellerData() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const base = getApiBase();
        const res = await fetch(`${base}/api/dashboard/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let json;
        try {
          json = await res.json();
        } catch (_) {
          if (!cancelled) setSellerError(`Antwoord was geen JSON (status ${res.status}). Controleer of de API bereikbaar is op ${base}/api/dashboard/me`);
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          setSellerError(json.error || `Fout ${res.status}: Kon sellergegevens niet laden.`);
          return;
        }
        setSellerInfo(json.data);
        setSellerError(null);
        if (json.data?.supplierId) {
          const balRes = await fetch(`${base}/api/dashboard/balance`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const balJson = await balRes.json();
          if (!cancelled && balRes.ok && balJson.data?.items?.length) {
            const first = balJson.data.items[0];
            setBalanceSummary({
              total: first.balance_total,
              pending: first.balance_pending,
              available: first.balance_available,
            });
          }
        }
      } catch (e) {
        if (!cancelled) setSellerError(e.message || 'Fout bij ophalen gegevens (netwerk of CORS?).');
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    }
    fetchSellerData();
    return () => { cancelled = true; };
  }, [getToken]);

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
            <DashboardLanguageSwitcher />
            <span className="dashboard-user-name">{user?.firstName || 'Gebruiker'}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div className="dashboard-body">
          <DashboardSidebar activeSection={isFinance ? 'finance' : 'dashboard'} />
          <main className="dashboard-main">
            {isFinance ? (
              <DashboardFinance />
            ) : (
              <>
            <h1>{getTranslation(currentLanguage, 'dashboard')}</h1>
            <p className="dashboard-welcome">
              Welkom, {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'gebruiker'}.
            </p>

            {sellerLoading && (
              <div className="dashboard-seller-box dashboard-seller-box--loading">
                <p><strong>Sellergegevens</strong></p>
                <p>Laden…</p>
              </div>
            )}

            {!sellerLoading && sellerError && (
              <div className="dashboard-seller-box dashboard-seller-box--error">
                <p><strong>Sellergegevens</strong></p>
                <p>{sellerError}</p>
                <p className="dashboard-seller-hint">Controleer of je Clerk-account in de database gekoppeld is aan seller ID 173 (kolom clerkUserId in PackageSelection). Gebruik dezelfde Clerk user ID als in het Clerk Dashboard.</p>
              </div>
            )}

            {!sellerLoading && sellerInfo && !sellerError && (
              <div className="dashboard-seller-box">
                <p><strong>Jouw seller</strong></p>
                <p>Seller ID: <strong>{sellerInfo.supplierId}</strong></p>
                {sellerInfo.sellerEmail && <p>E-mail: {sellerInfo.sellerEmail}</p>}
                {sellerInfo.package && <p>Package: {sellerInfo.package}</p>}
                {balanceSummary && (
                  <div className="dashboard-balance-summary">
                    <p><strong>Saldo (overzicht)</strong></p>
                    <p>Totaal: €{parseFloat(balanceSummary.total || 0).toFixed(2)}</p>
                    <p>Pending: €{parseFloat(balanceSummary.pending || 0).toFixed(2)}</p>
                    <p>Beschikbaar: €{parseFloat(balanceSummary.available || 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            <p>Dit is je persoonlijke dashboard. Hier kun je later je verkopen, orders en instellingen beheren.</p>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
