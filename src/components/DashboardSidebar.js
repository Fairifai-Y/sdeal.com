import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import './DashboardSidebar.css';

function getFinancePath(lang) {
  return getLocalizedUrl('/dashboard/finance', lang);
}
function getOrdersPath(lang) {
  return getLocalizedUrl('/dashboard/orders', lang);
}

const MENU_ITEMS = [
  { key: 'dashboard', translationKey: 'dashboard', icon: 'fa-house', path: '/dashboard', pathFn: null },
  { key: 'products', translationKey: 'dashboardProducts', icon: 'fa-box', path: '/dashboard', pathFn: null },
  { key: 'orders', translationKey: 'dashboardOrders', icon: 'fa-cart-shopping', path: '/dashboard/orders', pathFn: getOrdersPath },
  { key: 'disputes', translationKey: 'dashboardDisputes', icon: 'fa-shield-halved', path: '/dashboard', pathFn: null },
  { key: 'returns', translationKey: 'dashboardReturns', icon: 'fa-rotate-left', path: '/dashboard', pathFn: null },
  { key: 'performance', translationKey: 'dashboardPerformance', icon: 'fa-chart-pie', path: '/dashboard', pathFn: null },
  { key: 'finance', translationKey: 'dashboardFinance', icon: 'fa-wallet', path: '/dashboard/finance', pathFn: getFinancePath },
  { key: 'payout', translationKey: 'dashboardPayout', icon: 'fa-money-bill-transfer', path: '/dashboard', pathFn: null },
  { key: 'invoice', translationKey: 'dashboardInvoice', icon: 'fa-file-invoice', path: '/dashboard', pathFn: null },
  { key: 'settings', translationKey: 'dashboardSettings', icon: 'fa-gear', path: '/dashboard', pathFn: null },
  { key: 'feed', translationKey: 'dashboardFeed', icon: 'fa-rss', path: '/dashboard', pathFn: null },
  { key: 'faq', translationKey: 'dashboardFaq', icon: 'fa-circle-question', path: '/dashboard', pathFn: null },
  { key: 'news', translationKey: 'dashboardNews', icon: 'fa-newspaper', path: '/dashboard', pathFn: null },
];

export default function DashboardSidebar({ activeSection = 'dashboard' }) {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname || '';

  return (
    <nav className="dashboard-sidebar">
      <h2 className="dashboard-sidebar-title">
        {getTranslation(currentLanguage, 'menuLabel')}
      </h2>
      <ul className="dashboard-sidebar-list">
        {MENU_ITEMS.map((item) => {
          const isActive =
            (item.key === 'dashboard' && activeSection === 'dashboard' && !pathname.includes('/finance') && !pathname.includes('/orders')) ||
            (item.key === 'finance' && pathname.includes('/finance')) ||
            (item.key === 'orders' && pathname.includes('/orders')) ||
            (activeSection === item.key && !['dashboard', 'finance', 'orders'].includes(item.key));
          const to = item.pathFn ? item.pathFn(currentLanguage) : getLocalizedUrl(item.path, currentLanguage);
          const end = item.key === 'dashboard' && !item.pathFn;
          return (
            <li key={item.key}>
              <NavLink
                to={to}
                className={`dashboard-sidebar-item ${isActive ? 'dashboard-sidebar-item--active' : ''}`}
                end={end}
              >
                <span className="dashboard-sidebar-icon">
                  <i className={`fa-solid ${item.icon}`} aria-hidden />
                </span>
                <span className="dashboard-sidebar-label">
                  {getTranslation(currentLanguage, item.translationKey)}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
