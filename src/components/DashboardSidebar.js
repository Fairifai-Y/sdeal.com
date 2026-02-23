import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './DashboardSidebar.css';

const MENU_ITEMS = [
  { key: 'dashboard', translationKey: 'dashboard', icon: 'fa-house', path: '/dashboard' },
  { key: 'products', translationKey: 'dashboardProducts', icon: 'fa-box', path: '/dashboard' },
  { key: 'orders', translationKey: 'dashboardOrders', icon: 'fa-cart-shopping', path: '/dashboard' },
  { key: 'disputes', translationKey: 'dashboardDisputes', icon: 'fa-shield-halved', path: '/dashboard' },
  { key: 'returns', translationKey: 'dashboardReturns', icon: 'fa-rotate-left', path: '/dashboard' },
  { key: 'performance', translationKey: 'dashboardPerformance', icon: 'fa-chart-pie', path: '/dashboard' },
  { key: 'finance', translationKey: 'dashboardFinance', icon: 'fa-wallet', path: '/dashboard' },
  { key: 'payout', translationKey: 'dashboardPayout', icon: 'fa-money-bill-transfer', path: '/dashboard' },
  { key: 'invoice', translationKey: 'dashboardInvoice', icon: 'fa-file-invoice', path: '/dashboard' },
  { key: 'settings', translationKey: 'dashboardSettings', icon: 'fa-gear', path: '/dashboard' },
  { key: 'feed', translationKey: 'dashboardFeed', icon: 'fa-rss', path: '/dashboard' },
  { key: 'faq', translationKey: 'dashboardFaq', icon: 'fa-circle-question', path: '/dashboard' },
  { key: 'news', translationKey: 'dashboardNews', icon: 'fa-newspaper', path: '/dashboard' },
];

export default function DashboardSidebar({ activeSection = 'dashboard' }) {
  const { currentLanguage } = useLanguage();

  return (
    <nav className="dashboard-sidebar">
      <h2 className="dashboard-sidebar-title">
        {getTranslation(currentLanguage, 'menuLabel')}
      </h2>
      <ul className="dashboard-sidebar-list">
        {MENU_ITEMS.map((item) => {
          const isActive =
            (item.key === 'dashboard' && activeSection === 'dashboard') ||
            activeSection === item.key;
          return (
            <li key={item.key}>
              <NavLink
                to={item.path}
                className={`dashboard-sidebar-item ${isActive ? 'dashboard-sidebar-item--active' : ''}`}
                end
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
