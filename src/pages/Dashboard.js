import React, { useState, useEffect } from 'react';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardLanguageSwitcher from '../components/DashboardLanguageSwitcher';
import DashboardFinance from './DashboardFinance';
import DashboardOrders from './DashboardOrders';
import DashboardOrderDetail from './DashboardOrderDetail';
import DashboardOverview from './DashboardOverview';
import './Dashboard.css';

function getApiBase() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const { orderId } = useParams();
  const pathname = location.pathname || '';
  const isFinance = pathname.includes('/finance');
  const isOrders = pathname.includes('/orders');
  const isOrderDetail = Boolean(orderId);
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
          <DashboardSidebar activeSection={isFinance ? 'finance' : isOrders ? 'orders' : 'dashboard'} />
          <main className="dashboard-main">
            {isOrderDetail ? (
              <DashboardOrderDetail />
            ) : isFinance ? (
              <DashboardFinance />
            ) : isOrders ? (
              <DashboardOrders />
            ) : (
              <DashboardOverview
                sellerInfo={sellerInfo}
                balanceSummary={balanceSummary}
                sellerLoading={sellerLoading}
                sellerError={sellerError}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
