import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import { getLocalizedUrl } from '../utils/languageUtils';
import './DashboardOrders.css';

function getApiBase() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(parseFloat(value || 0));
}

function formatDate(dateStr, locale) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'nl' ? 'nl-NL' : locale === 'de' ? 'de-DE' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Order status: 20 = confirmed (groen), 25 = cancelled (rood), rest = waiting (grijs). */
function getOrderStatusClass(status) {
  const n = status != null ? Number(status) : NaN;
  if (Number(n) === 20) return 'orders-status--confirmed';
  if (Number(n) === 25) return 'orders-status--canceled';
  return 'orders-status--waiting';
}

/** Vertaald label voor order status (20=Confirmed, 25=Cancelled, rest=Waiting). */
function getOrderStatusLabel(status, t) {
  const n = status != null ? Number(status) : NaN;
  if (Number(n) === 20) return t('orderStatusConfirmed');
  if (Number(n) === 25) return t('orderStatusCanceled');
  return t('orderStatusWaiting');
}

/** Finance status: 80 = settled, 50 = paid, 30 = invoice accepted (groen); rest neutraal. */
function getFinanceStatusClass(status) {
  const n = status != null ? Number(status) : NaN;
  if (n === 80 || n === 50 || n === 30) return 'finance-status--ok';
  return '';
}

/** Vertaald label voor finance status (80=Settled, 50=Paid, 30=Invoice accepted). */
function getFinanceStatusLabel(status, t) {
  const n = status != null ? Number(status) : NaN;
  if (n === 80) return t('financeStatusSettled');
  if (n === 50) return t('financeStatusPaid');
  if (n === 30) return t('financeStatusInvoiceAccepted');
  return status != null && status !== '' ? String(status) : '–';
}

/** Haal eerste productafbeelding uit order (verschillende API-veldnamen). */
function getOrderImageUrl(order) {
  const raw =
    order.product_image
    || order.image_url
    || order.thumbnail_url
    || order.image
    || (order.items && order.items[0] && (order.items[0].image_url || order.items[0].product_image || order.items[0].thumbnail_url || order.items[0].image));
  if (!raw) return null;
  return typeof raw === 'string' ? raw : (raw.url || raw.src) || null;
}

export default function DashboardOrders() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    async function fetchOrders() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(
          `${getApiBase()}/api/dashboard/orders?page=${page}&pageSize=${pageSize}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || 'Kon orders niet laden.');
          return;
        }
        setData(json.data);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Fout bij ophalen orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [getToken, page, pageSize]);

  const t = (key) => getTranslation(currentLanguage, key);
  const rawItems = data?.items || [];
  const getOrderDate = (order) => {
    const raw = order.created_at ?? order.createdAt ?? order.order_date ?? order.date;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const getOrderIdNum = (order) => {
    const id = order.id ?? order.order_id;
    if (id == null) return 0;
    const n = Number(id);
    return Number.isNaN(n) ? 0 : n;
  };
  const items = [...rawItems].sort((a, b) => {
    const dateA = getOrderDate(a);
    const dateB = getOrderDate(b);
    if (dateA || dateB) return dateB - dateA; // nieuwste eerst
    return getOrderIdNum(b) - getOrderIdNum(a); // fallback: hogere id eerst
  });
  const totalCount = data?.total_count ?? data?.totalCount ?? rawItems.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const completed = items.filter((o) => Number(o.order_status) === 20).length;
  const waiting = items.filter((o) => Number(o.order_status) !== 20 && Number(o.order_status) !== 25).length;
  const canceled = items.filter((o) => Number(o.order_status) === 25).length;
  const total = items.length;
  const pctCompleted = total > 0 ? (completed / total * 100).toFixed(2) : '0';
  const pctWaiting = total > 0 ? (waiting / total * 100).toFixed(2) : '0';
  const pctCanceled = total > 0 ? (canceled / total * 100).toFixed(2) : '0';

  const localeMap = { en: 'en-GB', nl: 'nl-NL', de: 'de-DE', fr: 'fr-FR' };
  const locale = localeMap[currentLanguage] || 'nl-NL';

  return (
    <div className="dashboard-orders">
      <h1 className="dashboard-orders-title">{t('ordersTitle')}</h1>

      {loading && <p className="dashboard-orders-loading">{t('financeLoading')}</p>}
      {error && <div className="dashboard-orders-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="dashboard-orders-top">
            <div className="dashboard-orders-status-block">
              <h2 className="dashboard-orders-status-title">
                {t('ordersStatus')}
                <span className="dashboard-orders-status-help" title={t('ordersStatus')}>?</span>
              </h2>
              <div className="dashboard-orders-status-bar">
                <span className="dashboard-orders-status-seg dashboard-orders-status-seg--completed" style={{ width: `${pctCompleted}%` }} />
                <span className="dashboard-orders-status-seg dashboard-orders-status-seg--waiting" style={{ width: `${pctWaiting}%` }} />
                <span className="dashboard-orders-status-seg dashboard-orders-status-seg--canceled" style={{ width: `${pctCanceled}%` }} />
              </div>
              <div className="dashboard-orders-status-labels">
                <span><span className="dot dot--blue" /> {pctCompleted}% {t('ordersCompleted')}</span>
                <span><span className="dot dot--grey" /> {pctWaiting}% {t('ordersWaiting')}</span>
                <span><span className="dot dot--red" /> {pctCanceled}% {t('ordersCanceled')}</span>
              </div>
            </div>
            <div className="dashboard-orders-downloads">
              <span className="dashboard-orders-download-links">{t('downloadPdf')} | {t('downloadCsv')}</span>
              <button type="button" className="dashboard-orders-download-btn">{t('orderDownloadList')}</button>
            </div>
          </div>

          <div className="dashboard-orders-toolbar">
            <span className="dashboard-orders-records">{totalCount.toLocaleString(locale)} {t('recordsFound')}</span>
            <div className="dashboard-orders-toolbar-right">
              <button type="button" className="dashboard-orders-tool-btn">{t('ordersFilters')} <i className="fa-solid fa-filter" /></button>
              <button type="button" className="dashboard-orders-tool-btn">{t('ordersColumns')} <i className="fa-solid fa-gear" /></button>
              <select
                className="dashboard-orders-perpage"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10 {t('perPage')}</option>
                <option value={20}>20 {t('perPage')}</option>
                <option value={50}>50 {t('perPage')}</option>
                <option value={100}>100 {t('perPage')}</option>
              </select>
              <span className="dashboard-orders-pagination">
                <button type="button" className="dashboard-orders-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                <span>{page} {t('ofPages')} {totalPages}</span>
                <button type="button" className="dashboard-orders-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </span>
            </div>
          </div>

          <div className="dashboard-orders-table-wrap">
            <table className="dashboard-orders-table">
              <thead>
                <tr>
                  <th>{t('ordersColProduct')}</th>
                  <th>{t('ordersColOrderId')}</th>
                  <th>{t('ordersColTotalCustomer')}</th>
                  <th>{t('ordersColOrderAmount')}</th>
                  <th>{t('ordersColCustomer')}</th>
                  <th>{t('ordersColCustomerOrderId')}</th>
                  <th>{t('ordersColOrderStatus')}</th>
                  <th>{t('ordersColCommission')}</th>
                  <th>{t('ordersColCreatedDate')}</th>
                  <th>{t('ordersColInternalStatus')}</th>
                  <th>{t('ordersColFinanceStatus')}</th>
                  <th>{t('ordersColPaypalDisputes')}</th>
                  <th>{t('ordersColView')}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={13} className="dashboard-orders-empty">{t('ordersEmpty')}</td></tr>
                ) : (
                  items.map((order) => (
                    <tr key={order.id || order.order_id || Math.random()}>
                      <td>
                        <div className="dashboard-orders-product-cell">
                          {getOrderImageUrl(order) ? (
                            <img src={getOrderImageUrl(order)} alt="" className="dashboard-orders-product-img" />
                          ) : (
                            <span className="dashboard-orders-product-placeholder" aria-hidden><i className="fa-solid fa-box" /></span>
                          )}
                          <span className="dashboard-orders-product-name">
                            {order.product_name || (order.items && order.items.length > 1 ? `${order.items.length} products` : order.items?.[0]?.name) || '–'}
                          </span>
                        </div>
                      </td>
                      <td>{order.order_id ?? order.id ?? '–'}</td>
                      <td>{formatEuro(order.total_amount_customer ?? order.order_amount_customer)}</td>
                      <td>{formatEuro(order.order_amount_org ?? order.order_amount)}</td>
                      <td>{order.customer_name ?? order.customer ?? '–'}</td>
                      <td>{order.customer_order_id ?? order.increment_id ?? '–'}</td>
                      <td>
                        <span className={`dashboard-orders-status-pill ${getOrderStatusClass(order.order_status)}`}>
                          {getOrderStatusLabel(order.order_status, t)}
                        </span>
                      </td>
                      <td>{formatEuro(order.commission)}</td>
                      <td>{formatDate(order.created_at, currentLanguage)}</td>
                      <td>{order.internal_status ?? '–'}</td>
                      <td>
                        <span className={`dashboard-orders-status-pill ${getFinanceStatusClass(order.finance_status)}`}>
                          {getFinanceStatusLabel(order.finance_status, t)}
                        </span>
                      </td>
                      <td>{order.paypal_disputes ?? t('noDispute')}</td>
                      <td>
                        <button
                          type="button"
                          className="dashboard-orders-view-btn"
                          aria-label={t('ordersColView')}
                          onClick={() => navigate(getLocalizedUrl(`/dashboard/orders/${order.order_id ?? order.id}`, currentLanguage))}
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
