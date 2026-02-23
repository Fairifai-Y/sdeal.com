import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './DashboardOrderDetail.css';

function getApiBase() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(parseFloat(value || 0));
}

function formatDateTime(dateStr, locale) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  const loc = locale === 'en' ? 'en-GB' : locale === 'nl' ? 'nl-NL' : locale === 'de' ? 'de-DE' : 'fr-FR';
  return d.toLocaleString(loc, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateOnly(dateStr, locale) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  const loc = locale === 'en' ? 'en-GB' : locale === 'nl' ? 'nl-NL' : locale === 'de' ? 'de-DE' : 'fr-FR';
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getOrderStatusClass(status) {
  const n = status != null ? Number(status) : NaN;
  if (Number(n) === 20) return 'orders-status--confirmed';
  if (Number(n) === 25) return 'orders-status--canceled';
  return 'orders-status--waiting';
}

function getOrderStatusLabel(status, t) {
  const n = status != null ? Number(status) : NaN;
  if (Number(n) === 20) return t('orderStatusConfirmed');
  if (Number(n) === 25) return t('orderStatusCanceled');
  return t('orderStatusWaiting');
}

function getFinanceStatusClass(status) {
  const n = status != null ? Number(status) : NaN;
  if (n === 80 || n === 50 || n === 30) return 'finance-status--ok';
  return '';
}

function getFinanceStatusLabel(status, t) {
  const n = status != null ? Number(status) : NaN;
  if (n === 80) return t('financeStatusSettled');
  if (n === 50) return t('financeStatusPaid');
  if (n === 30) return t('financeStatusInvoiceAccepted');
  return status != null && status !== '' ? String(status) : '–';
}

/** Pick first defined from order (supports multiple API field names). */
function get(order, ...keys) {
  for (const k of keys) {
    const v = order[k];
    if (v != null && v !== '') return v;
  }
  return null;
}

function formatOrderNumber(id) {
  if (id == null) return '–';
  const s = String(id);
  return s.length <= 6 ? s.padStart(6, '0') : s;
}

export default function DashboardOrderDetail() {
  const { getToken } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(`${getApiBase()}/api/dashboard/order?orderId=${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || `Error ${res.status}`);
          setOrder(null);
          return;
        }
        setOrder(json.data);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load order.');
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrder();
    return () => { cancelled = true; };
  }, [getToken, orderId]);

  const t = (key) => getTranslation(currentLanguage, key);

  const goBack = () => {
    const langPrefix = currentLanguage === 'nl' ? '/nl' : currentLanguage === 'de' ? '/de' : currentLanguage === 'fr' ? '/fr' : '';
    navigate(`${langPrefix}/dashboard/orders`);
  };

  if (!orderId) {
    return (
      <div className="dashboard-order-detail">
        <p>{t('ordersEmpty')}</p>
        <button type="button" className="dashboard-order-detail-back" onClick={goBack}>← {t('backToOrders')}</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-order-detail">
        <p className="dashboard-order-detail-loading">{t('financeLoading')}</p>
        <button type="button" className="dashboard-order-detail-back" onClick={goBack}>← {t('backToOrders')}</button>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="dashboard-order-detail">
        <p className="dashboard-order-detail-error">{error || 'Order not found.'}</p>
        <button type="button" className="dashboard-order-detail-back" onClick={goBack}>← {t('backToOrders')}</button>
      </div>
    );
  }

  const orderStatusClass = getOrderStatusClass(get(order, 'order_status', 'orderStatus'));
  const financeStatusClass = getFinanceStatusClass(get(order, 'finance_status', 'financeStatus'));
  const isCanceled = Number(get(order, 'order_status', 'orderStatus')) === 25;

  const orderNumber = get(order, 'increment_id', 'order_id', 'id') || orderId;
  const orderDate = get(order, 'created_at', 'order_date', 'createdAt');
  const expectedArrival = get(order, 'expected_arrival_date', 'expected_arrival', 'expectedArrivalDate');
  const customerOrderId = get(order, 'customer_order_id', 'increment_id', 'customer_order_number');
  const totalCustomer = get(order, 'total_amount_customer', 'order_amount_customer', 'grand_total');
  const shippingName = get(order, 'shipping_name', 'shipping_name_customer', 'customer_name');
  const shippingAddress = [
    get(order, 'shipping_street', 'shipping_address'),
    [get(order, 'shipping_postcode'), get(order, 'shipping_city')].filter(Boolean).join(', '),
    get(order, 'shipping_country'),
  ].filter(Boolean);
  const billingName = get(order, 'billing_name', 'billing_name_customer') || shippingName;
  const billingAddress = [
    get(order, 'billing_street', 'billing_address'),
    [get(order, 'billing_postcode'), get(order, 'billing_city')].filter(Boolean).join(', '),
    get(order, 'billing_country', 'billing_country_id'),
  ].filter(Boolean);
  const costPrice = get(order, 'cost_price', 'order_amount_org', 'order_amount');
  const deliveryCost = get(order, 'delivery_cost', 'shipping_amount');
  const payout = get(order, 'payout', 'order_amount_org', 'order_amount');
  const paymentScheduled = get(order, 'payment_scheduled_on', 'payment_scheduled', 'payout_date');
  const commission = get(order, 'commission');
  const contactPhone = get(order, 'customer_phone', 'shipping_telephone', 'telephone');
  const contactEmail = get(order, 'customer_email', 'customer_email', 'email');
  const orderStore = get(order, 'order_store', 'store_name', 'store_id');

  return (
    <div className="dashboard-order-detail">
      <header className="dashboard-order-detail-header">
        <div className="dashboard-order-detail-header-left">
          <button type="button" className="dashboard-order-detail-back" onClick={goBack} aria-label={t('backToOrders')}>
            ← {t('orderDetailTitle')} #{formatOrderNumber(orderNumber)}
          </button>
        </div>
        <div className="dashboard-order-detail-header-statuses">
          <span className="dashboard-order-detail-status-line">
            {t('orderStatusLabel')}: <span className={`dashboard-order-detail-dot dashboard-order-detail-dot--${orderStatusClass.includes('canceled') ? 'red' : orderStatusClass.includes('confirmed') ? 'green' : 'grey'}`} /> {getOrderStatusLabel(get(order, 'order_status', 'orderStatus'), t)}
          </span>
          <span className="dashboard-order-detail-status-line">
            {t('financeStatusLabel')}: <span className={`dashboard-order-detail-dot dashboard-order-detail-dot--${financeStatusClass ? 'green' : 'grey'}`} /> {getFinanceStatusLabel(get(order, 'finance_status', 'financeStatus'), t)}
          </span>
        </div>
        <div className="dashboard-order-detail-header-actions">
          <button type="button" className="dashboard-order-detail-link">{t('orderDetailDownload')}</button>
          <span className="dashboard-order-detail-link-sep">|</span>
          <button type="button" className="dashboard-order-detail-link">{t('orderDetailCsv')}</button>
          <span className="dashboard-order-detail-link-sep">|</span>
          <button type="button" className="dashboard-order-detail-link">{t('orderDetailPrintPacking')}</button>
          {isCanceled && (
            <span className="dashboard-order-detail-canceled-btn">{t('orderCanceledBtn')}</span>
          )}
        </div>
      </header>

      <div className="dashboard-order-detail-grid">
        <div className="dashboard-order-detail-column">
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-regular fa-calendar" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('orderDate')}</div>
              <div className="dashboard-order-detail-field-value">{orderDate ? formatDateTime(orderDate, currentLanguage) : '–'}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-solid fa-truck" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('expectedArrivalDate')}</div>
              <div className="dashboard-order-detail-field-value">{expectedArrival ? formatDateOnly(expectedArrival, currentLanguage) : t('orderDetailN/A')}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-regular fa-user" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('orderIdCustomer')}</div>
              <div className="dashboard-order-detail-field-value">{customerOrderId || '–'}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('totalAmountCustomer')}</div>
            <div className="dashboard-order-detail-field-value">{totalCustomer != null ? formatEuro(totalCustomer) : '–'}</div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('shippingName')}</div>
            <div className="dashboard-order-detail-field-value">{shippingName || '–'}</div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('shippingAddress')}</div>
            <div className="dashboard-order-detail-field-value">
              {shippingAddress.length ? shippingAddress.map((line, i) => <div key={i}>{line}</div>) : '–'}
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('billingName')}</div>
            <div className="dashboard-order-detail-field-value">{billingName || '–'}</div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('billingAddress')}</div>
            <div className="dashboard-order-detail-field-value">
              {billingAddress.length ? billingAddress.map((line, i) => <div key={i}>{line}</div>) : '–'}
            </div>
          </div>
        </div>

        <div className="dashboard-order-detail-column">
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-regular fa-file-lines" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('costPrice')}</div>
              <div className="dashboard-order-detail-field-value">{costPrice != null ? formatEuro(-Math.abs(parseFloat(costPrice))) : '–'}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-solid fa-truck" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('deliveryCost')}</div>
              <div className="dashboard-order-detail-field-value">{deliveryCost != null ? formatEuro(deliveryCost) : '€0.00'}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <span className="dashboard-order-detail-field-icon"><i className="fa-regular fa-file-lines" /></span>
            <div>
              <div className="dashboard-order-detail-field-label">{t('payout')}</div>
              <div className="dashboard-order-detail-field-value">{payout != null ? formatEuro(-Math.abs(parseFloat(payout))) : '–'}</div>
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('paymentScheduledOn')}</div>
            <div className="dashboard-order-detail-field-value">{paymentScheduled ? formatDateOnly(paymentScheduled, currentLanguage) : '–'}</div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('commission')}</div>
            <div className="dashboard-order-detail-field-value">{commission != null ? formatEuro(commission) : '–'}</div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('contactCustomer')}</div>
            <div className="dashboard-order-detail-field-value">
              {[contactPhone && `T: ${contactPhone}`, contactEmail && `E: ${contactEmail}`].filter(Boolean).length
                ? [contactPhone && `T: ${contactPhone}`, contactEmail && `E: ${contactEmail}`].filter(Boolean).map((line, i) => <div key={i}>{line}</div>)
                : '–'}
            </div>
          </div>
          <div className="dashboard-order-detail-field">
            <div className="dashboard-order-detail-field-label">{t('orderStore')}</div>
            <div className="dashboard-order-detail-field-value">{orderStore || '–'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
