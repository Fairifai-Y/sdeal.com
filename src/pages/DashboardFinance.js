import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './DashboardFinance.css';

function getApiBase() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(parseFloat(value || 0));
}

export default function DashboardFinance() {
  const { getToken } = useAuth();
  const { currentLanguage } = useLanguage();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchBalance() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(`${getApiBase()}/api/dashboard/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || 'Kon saldo niet laden.');
          return;
        }
        setBalance(json.data);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Fout bij ophalen saldo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBalance();
    return () => { cancelled = true; };
  }, [getToken]);

  const item = balance?.items?.[0];
  const t = (key) => getTranslation(currentLanguage, key);

  return (
    <div className="dashboard-finance">
      <h1 className="dashboard-finance-title">{t('financeTitle')}</h1>

      {loading && <p className="dashboard-finance-loading">{t('financeLoading')}</p>}
      {error && <div className="dashboard-finance-error">{error}</div>}

      {!loading && !error && (
        <div className="dashboard-finance-grid">
          <div className="dashboard-finance-left">
            <ul className="dashboard-finance-balance-list">
              <li className="dashboard-finance-balance-row">
                <span>{t('balancePendingLabel')}</span>
                <span className="dashboard-finance-amount">{formatEuro(item?.balance_pending)}</span>
              </li>
              <li className="dashboard-finance-balance-row">
                <span>{t('balanceConfirmedLabel')}</span>
                <span className="dashboard-finance-amount">{formatEuro(item?.balance_total)}</span>
              </li>
              <li className="dashboard-finance-balance-row">
                <span>{t('balanceAvailableLabel')}</span>
                <span className="dashboard-finance-amount">{formatEuro(item?.balance_available)}</span>
              </li>
              <li className="dashboard-finance-balance-row">
                <span>{t('balanceRefundLabel')}</span>
                <span className="dashboard-finance-amount">{formatEuro(item?.balance_refund)}</span>
              </li>
              <li className="dashboard-finance-balance-row">
                <span>{t('sellerReserveLabel')}</span>
                <span className="dashboard-finance-amount">{formatEuro(item?.balance_partner ?? item?.seller_reserve)}</span>
              </li>
            </ul>
            <div className="dashboard-finance-actions">
              <button type="button" className="dashboard-finance-btn dashboard-finance-btn--add">
                {t('addFundsButton')}
              </button>
              <button type="button" className="dashboard-finance-btn dashboard-finance-btn--auto">
                {t('automaticPaymentsButton')}
              </button>
            </div>
          </div>
          <div className="dashboard-finance-note">
            <h2 className="dashboard-finance-note-title">{t('balanceNoteTitle')}</h2>
            <ul className="dashboard-finance-note-list">
              <li>{t('balanceNotePending')}</li>
              <li>{t('balanceNoteConfirmed')}</li>
              <li>{t('balanceNoteAvailable')}</li>
              <li>{t('balanceNoteRefund')}</li>
              <li>{t('balanceNoteReserve')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
