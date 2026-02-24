import React from 'react';
import './AdminSidebar.css';

const MENU_ITEMS = [
  { key: 'overview', label: 'Overzicht', icon: 'fa-chart-pie' },
  { key: 'finance', label: 'Finance', icon: 'fa-wallet' },
  { key: 'customers', label: 'Klanten', icon: 'fa-users' },
  { key: 'sellers', label: 'Sellers', icon: 'fa-store' },
  { key: 'mailing', label: 'Mailing', icon: 'fa-envelope' },
  { key: 'ldg', label: 'LDG', icon: 'fa-tag' },
];

export default function AdminSidebar({ activeSection, onSelectSection }) {
  return (
    <nav className="admin-sidebar">
      <h2 className="admin-sidebar-title">MENU</h2>
      <ul className="admin-sidebar-list">
        {MENU_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={`admin-sidebar-item ${activeSection === item.key ? 'admin-sidebar-item--active' : ''}`}
              onClick={() => onSelectSection(item.key)}
            >
              <span className="admin-sidebar-icon">
                <i className={`fa-solid ${item.icon}`} aria-hidden />
              </span>
              <span className="admin-sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
