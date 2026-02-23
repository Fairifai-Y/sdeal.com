import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import './DashboardOverview.css';

function getApiBase() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(value || 0));
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function DashboardOverview({ sellerInfo, balanceSummary, sellerLoading, sellerError }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const [ordersData, setOrdersData] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!sellerInfo?.supplierId) {
      setOrdersLoading(false);
      return;
    }
    async function fetchOrders() {
      setOrdersLoading(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(`${getApiBase()}/api/dashboard/orders?page=1&pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.data) setOrdersData(json.data);
        else setOrdersData(null);
      } catch (_) {
        if (!cancelled) setOrdersData(null);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [getToken, sellerInfo?.supplierId]);

  const t = (key) => getTranslation(currentLanguage, key);

  const items = ordersData?.items || [];
  const totalOrders = ordersData?.total_count ?? ordersData?.totalCount ?? items.length;
  const totalRevenueSum = items.reduce((acc, o) => acc + parseFloat(o.order_amount_org ?? o.order_amount ?? 0), 0);
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyItems = items.filter((o) => {
    const d = o.created_at ? new Date(o.created_at) : null;
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthlyOrders = monthlyItems.length;
  const monthlyRevenueSum = monthlyItems.reduce((acc, o) => acc + parseFloat(o.order_amount_org ?? o.order_amount ?? 0), 0);

  const productsLive = 0;
  const productsAdvertised = 0;
  const preferredPct = 100;

  const revenueChangePct = 14;
  const monthlyChangePct = -7;

  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    nl: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  };
  const months = monthNames[currentLanguage] || monthNames.en;

  const revenueByMonth = months.map((_, i) => {
    const monthIdx = (thisMonth - 11 + i + 12) % 12;
    const year = thisMonth - 11 + i < 0 ? thisYear - 1 : thisYear;
    const sum = items.filter((o) => {
      const d = o.created_at ? new Date(o.created_at) : null;
      return d && d.getMonth() === monthIdx && d.getFullYear() === year;
    }).reduce((acc, o) => acc + parseFloat(o.order_amount_org ?? o.order_amount ?? 0), 0);
    return { label: months[monthIdx], value: sum };
  });
  const maxRevenue = Math.max(1, ...revenueByMonth.map((r) => r.value));

  const revenueByCountry = [{ country: 'Netherlands', value: totalRevenueSum }];
  const maxCountryRevenue = Math.max(1, ...revenueByCountry.map((r) => r.value));

  const toProducts = () => { navigate(getLocalizedUrl('/dashboard', currentLanguage)); };
  const toPreferredSeller = () => { navigate(getLocalizedUrl('/dashboard', currentLanguage)); };

  if (sellerLoading) {
    return (
      <div className="dashboard-overview">
        <h1 className="dashboard-overview-title">{t('dashboard')}</h1>
        <p className="dashboard-overview-loading">{t('financeLoading')}</p>
      </div>
    );
  }

  if (sellerError) {
    return (
      <div className="dashboard-overview">
        <h1 className="dashboard-overview-title">{t('dashboard')}</h1>
        <div className="dashboard-overview-error">{sellerError}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <h1 className="dashboard-overview-title">{t('dashboard')}</h1>

      <div className="dashboard-overview-cards">
        <div className="dashboard-overview-card">
          <div className="dashboard-overview-card-value">{ordersLoading ? '…' : productsLive}</div>
          <button type="button" className="dashboard-overview-btn dashboard-overview-btn--primary" onClick={toProducts}>
            {t('dashboardToProducts')}
          </button>
          <div className="dashboard-overview-card-label">{t('dashboardTotalProductsLive')}</div>
        </div>
        <div className="dashboard-overview-card">
          <div className="dashboard-overview-card-value">{ordersLoading ? '…' : productsAdvertised}</div>
          <div className="dashboard-overview-status dashboard-overview-status--good">
            <span className="dashboard-overview-smiley" role="img" aria-label="good">😊</span> {t('dashboardGood')}
          </div>
          <div className="dashboard-overview-card-label">{t('dashboardTotalProductsAdvertised')}</div>
        </div>
        <div className="dashboard-overview-card dashboard-overview-card--chart">
          <div className="dashboard-overview-donut-wrap">
            <div className="dashboard-overview-donut" style={{ '--pct': preferredPct }}>
              <span className="dashboard-overview-donut-inner">{preferredPct}%</span>
            </div>
            <div className="dashboard-overview-donut-legend">
              <span className="dashboard-overview-dot dashboard-overview-dot--blue" /> {t('dashboardPreferredSeller').split(' (')[0]} {preferredPct}%
              <br />
              <span className="dashboard-overview-dot dashboard-overview-dot--grey" /> {t('dashboardNotPreferred')} 0%
            </div>
          </div>
          <button type="button" className="dashboard-overview-btn dashboard-overview-btn--primary" onClick={toPreferredSeller}>
            {t('dashboardToPreferredSeller')}
          </button>
          <div className="dashboard-overview-card-label">{t('dashboardPreferredSeller')}</div>
        </div>
      </div>

      <div className="dashboard-overview-revenue-row">
        <div className="dashboard-overview-card dashboard-overview-card--revenue">
          <div className="dashboard-overview-revenue-main">
            <span className="dashboard-overview-revenue-amount">{ordersLoading ? '…' : formatEuro(totalRevenueSum)}</span>
            <span className="dashboard-overview-revenue-change dashboard-overview-revenue-change--up">
              {revenueChangePct}% <i className="fa-solid fa-arrow-trend-up" />
            </span>
          </div>
          <div className="dashboard-overview-revenue-sub">{totalOrders} {t('dashboardOrdersLabel')}</div>
          <div className="dashboard-overview-card-label">{t('dashboardTotalRevenue')}</div>
        </div>
        <div className="dashboard-overview-card dashboard-overview-card--revenue">
          <div className="dashboard-overview-revenue-main">
            <span className="dashboard-overview-revenue-amount">{ordersLoading ? '…' : formatEuro(monthlyRevenueSum)}</span>
            <span className="dashboard-overview-revenue-change dashboard-overview-revenue-change--down">
              {Math.abs(monthlyChangePct)}% <i className="fa-solid fa-arrow-trend-down" />
            </span>
          </div>
          <div className="dashboard-overview-revenue-sub">{monthlyOrders} {t('dashboardOrdersLabel')}</div>
          <div className="dashboard-overview-card-label">{t('dashboardMonthlyRevenue')}</div>
        </div>
      </div>

      <div className="dashboard-overview-charts">
        <div className="dashboard-overview-chart-card">
          <div className="dashboard-overview-chart-header">
            <h2 className="dashboard-overview-chart-title">{t('dashboardRevenue')}</h2>
            <select className="dashboard-overview-chart-select" defaultValue="12" aria-label={t('dashboardLast12Months')}>
              <option value="12">{t('dashboardLast12Months')}</option>
            </select>
          </div>
          <div className="dashboard-overview-bar-chart" role="img" aria-label={t('dashboardRevenue')}>
            {revenueByMonth.map((r, i) => (
              <div key={i} className="dashboard-overview-bar-wrap">
                <div className="dashboard-overview-bar" style={{ height: `${(r.value / maxRevenue) * 100}%` }} />
                <span className="dashboard-overview-bar-label">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-overview-chart-card">
          <div className="dashboard-overview-chart-header">
            <h2 className="dashboard-overview-chart-title">{t('dashboardRevenuePerCountry')}</h2>
            <select className="dashboard-overview-chart-select" defaultValue="12" aria-label={t('dashboardLast12Months')}>
              <option value="12">{t('dashboardLast12Months')}</option>
            </select>
          </div>
          <div className="dashboard-overview-bar-chart dashboard-overview-bar-chart--country" role="img" aria-label={t('dashboardRevenuePerCountry')}>
            {revenueByCountry.map((r, i) => (
              <div key={i} className="dashboard-overview-bar-wrap">
                <div className="dashboard-overview-bar" style={{ height: `${(r.value / maxCountryRevenue) * 100}%` }} />
                <span className="dashboard-overview-bar-label">{r.country}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
