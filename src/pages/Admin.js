import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [customersData, setCustomersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false);
  const [sellerInfoError, setSellerInfoError] = useState(null);

  // Check if user is already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchSectionData = async (section) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/${section}`);
      const result = await response.json();
      
      if (result.success) {
        if (section === 'overview') {
          setOverviewData(result.data);
        } else if (section === 'finance') {
          setFinanceData(result.data);
        } else if (section === 'customers') {
          setCustomersData(result.data);
        }
      } else {
        console.error('Error fetching data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/search-customers?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.data);
      } else {
        console.error('Error searching customers:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch data when section changes
  useEffect(() => {
    if (isAuthenticated && activeSection) {
      if (activeSection === 'customers' && searchQuery.trim() !== '') {
        // Don't fetch default data if searching
        return;
      }
      fetchSectionData(activeSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeSection]);

  // Search customers
  useEffect(() => {
    if (isAuthenticated && activeSection === 'customers') {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim() !== '') {
          searchCustomers(searchQuery);
        } else {
          setSearchResults(null);
          // Reload default customers data
          if (!customersData) {
            fetchSectionData('customers');
          }
        }
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isAuthenticated, activeSection]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple password check - you can change this password
    const adminPassword = 'SDeal2024!'; // Change this to your desired password
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPassword('');
    setSearchQuery('');
    setSearchResults(null);
    setSelectedSeller(null);
    setSellerInfo(null);
  };

  const fetchSellerInfo = async (sellerId) => {
    if (!sellerId) return;
    
    setLoadingSellerInfo(true);
    setSellerInfoError(null);
    setSelectedSeller(sellerId);
    
    try {
      console.log(`[Admin] Fetching seller info for ID: ${sellerId}`);
      // Fetch all seller info in parallel
      // Note: These endpoints automatically use the proxy if PROXY_BASE_URL is configured
      const [balanceRes, ordersRes, deliveryRes] = await Promise.allSettled([
        fetch(`/api/seller-admin/balance?supplierId=${sellerId}`),
        fetch(`/api/seller-admin/orders?supplierId=${sellerId}&page=1&pageSize=10`),
        fetch(`/api/seller-admin/delivery-info?supplierId=${sellerId}`)
      ]);

      const sellerData = {
        sellerId: sellerId,
        balance: null,
        orders: null,
        deliveryInfo: null,
        errors: {}
      };

      // Process balance
      if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
        const balanceData = await balanceRes.value.json();
        if (balanceData.success) {
          sellerData.balance = balanceData.data;
        } else {
          sellerData.errors.balance = balanceData.error || 'Failed to fetch balance';
        }
      } else {
        sellerData.errors.balance = 'Failed to fetch balance';
      }

      // Process orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        if (ordersData.success) {
          // Sort orders by created_at date (newest first)
          if (ordersData.data && ordersData.data.items && Array.isArray(ordersData.data.items)) {
            ordersData.data.items.sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA; // Newest first (descending)
            });
          }
          sellerData.orders = ordersData.data;
        } else {
          sellerData.errors.orders = ordersData.error || 'Failed to fetch orders';
        }
      } else {
        sellerData.errors.orders = 'Failed to fetch orders';
      }

      // Process delivery info
      if (deliveryRes.status === 'fulfilled' && deliveryRes.value.ok) {
        const deliveryData = await deliveryRes.value.json();
        if (deliveryData.success) {
          sellerData.deliveryInfo = deliveryData.data;
        } else {
          sellerData.errors.deliveryInfo = deliveryData.error || 'Failed to fetch delivery info';
        }
      } else {
        sellerData.errors.deliveryInfo = 'Failed to fetch delivery info';
      }

      setSellerInfo(sellerData);
    } catch (error) {
      console.error('Error fetching seller info:', error);
      setSellerInfoError('Failed to fetch seller information');
    } finally {
      setLoadingSellerInfo(false);
    }
  };

  const closeSellerModal = () => {
    setSelectedSeller(null);
    setSellerInfo(null);
    setSellerInfoError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="admin-header-top">
          <Link to="/" className="admin-logo-link">
            <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="admin-logo" />
          </Link>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
          <div className="admin-login">
            <h1>Admin Login</h1>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="login-button">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    if (loading) {
      return <div className="admin-loading">Loading...</div>;
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="admin-section-content">
            <h2>Overzicht</h2>
            {overviewData && (
              <div className="admin-stats-grid">
                <div className="stat-card highlight">
                  <h3>Totaal Balance Sellers</h3>
                  <p className="stat-number">{overviewData.totalBalanceSellers || 0}</p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Sellers met balance record</p>
                </div>
                <div className="stat-card highlight">
                  <h3>Sellers met Orders</h3>
                  <p className="stat-number">{overviewData.sellersWithOrders || 0}</p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Sellers die een order hebben gehad
                    {overviewData.totalOrdersCount && (
                      <span style={{ display: 'block', marginTop: '3px' }}>
                        (uit {overviewData.totalOrdersCount.toLocaleString('nl-NL')} orders)
                      </span>
                    )}
                  </p>
                </div>
                <div className="stat-card highlight">
                  <h3>New Model Sellers</h3>
                  <p className="stat-number">{overviewData.newModelCustomers || 0}</p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Sellers uit database</p>
                </div>
                <div className="stat-card">
                  <h3>Nieuwe Klanten</h3>
                  <p className="stat-number">{overviewData.newCustomers}</p>
                </div>
                <div className="stat-card">
                  <h3>Bestaande Klanten</h3>
                  <p className="stat-number">{overviewData.existingCustomers}</p>
                </div>
                <div className="stat-card">
                  <h3>Met Recurring Payment</h3>
                  <p className="stat-number">{overviewData.withRecurring}</p>
                </div>
                <div className="stat-card">
                  <h3>Registraties (7 dagen)</h3>
                  <p className="stat-number">{overviewData.recentRegistrations}</p>
                </div>
                <div className="stat-card">
                  <h3>Pakket A</h3>
                  <p className="stat-number">{overviewData.statsByPackage?.A || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Pakket B</h3>
                  <p className="stat-number">{overviewData.statsByPackage?.B || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Pakket C</h3>
                  <p className="stat-number">{overviewData.statsByPackage?.C || 0}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'finance':
        return (
          <div className="admin-section-content">
            <h2>Finance</h2>
            {financeData && (
              <div>
                <div className="admin-stats-grid">
                  <div className="stat-card highlight">
                    <h3>Klanten met Recurring Payment</h3>
                    <p className="stat-number">{financeData.totalWithRecurring}</p>
                  </div>
                  <div className="stat-card highlight">
                    <h3>Geschatte Maandelijkse Omzet</h3>
                    <p className="stat-number">€{financeData.totalMonthlyRevenue}</p>
                  </div>
                </div>
                
                <div className="admin-stats-grid" style={{ marginTop: '20px' }}>
                  <div className="stat-card">
                    <h3>Pakket A (Recurring)</h3>
                    <p className="stat-number">{financeData.statsByPackage?.A || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Pakket B (Recurring)</h3>
                    <p className="stat-number">{financeData.statsByPackage?.B || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Pakket C (Recurring)</h3>
                    <p className="stat-number">{financeData.statsByPackage?.C || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Maandelijks</h3>
                    <p className="stat-number">{financeData.statsByBilling?.monthly || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Jaarlijks</h3>
                    <p className="stat-number">{financeData.statsByBilling?.yearly || 0}</p>
                  </div>
                </div>

                {financeData.customers && financeData.customers.length > 0 && (
                  <div style={{ marginTop: '30px' }}>
                    <h3>Klanten met Recurring Payments</h3>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Seller ID</th>
                            <th>Email</th>
                            <th>Bedrijf</th>
                            <th>Pakket</th>
                            <th>Billing</th>
                            <th>Mollie Customer ID</th>
                            <th>Mandate ID</th>
                            <th>Datum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financeData.customers.map((customer) => (
                            <tr key={customer.id}>
                              <td>{customer.sellerId}</td>
                              <td>{customer.sellerEmail || '-'}</td>
                              <td>{customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-'}</td>
                              <td>{customer.package}</td>
                              <td>{customer.billingPeriod || '-'}</td>
                              <td>{customer.mollieCustomerId || '-'}</td>
                              <td>{customer.mollieMandateId || '-'}</td>
                              <td>{new Date(customer.createdAt).toLocaleDateString('nl-NL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'customers':
        const displayCustomers = searchResults !== null ? searchResults : (customersData?.customers || []);
        const isSearchMode = searchQuery.trim() !== '';
        
        return (
          <div className="admin-section-content">
            <h2>Klanten</h2>
            
            {/* Search Bar */}
            <div className="admin-search-container">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Zoek in alle velden (ID, email, naam, bedrijf, KVK, BTW, IBAN, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <span className="admin-search-loading">Zoeken...</span>}
              {isSearchMode && !isSearching && (
                <span className="admin-search-count">
                  {displayCustomers.length} resultaat{displayCustomers.length !== 1 ? 'en' : ''}
                </span>
              )}
            </div>

            {!isSearchMode && customersData && (
              <div className="admin-stats-grid" style={{ marginTop: '20px' }}>
                <div className="stat-card">
                  <h3>New Model Klanten</h3>
                  <p className="stat-number">{customersData.totalCustomers}</p>
                </div>
                <div className="stat-card">
                  <h3>Nieuwe Klanten</h3>
                  <p className="stat-number">{customersData.newCustomers}</p>
                </div>
                <div className="stat-card">
                  <h3>Bestaande Klanten</h3>
                  <p className="stat-number">{customersData.existingCustomers}</p>
                </div>
                <div className="stat-card">
                  <h3>Met Recurring</h3>
                  <p className="stat-number">{customersData.withRecurring}</p>
                </div>
              </div>
            )}

            {displayCustomers.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3>{isSearchMode ? 'Zoekresultaten' : 'New Model Klanten'}</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Seller ID</th>
                        <th>Email</th>
                        <th>Bedrijf</th>
                        <th>Naam</th>
                        <th>Adres</th>
                        <th>KVK</th>
                        <th>BTW</th>
                        <th>IBAN</th>
                        <th>Type</th>
                        <th>Pakket</th>
                        <th>Billing</th>
                        <th>Recurring</th>
                        <th>Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCustomers.map((customer) => (
                        <tr 
                          key={customer.id}
                          onClick={() => customer.sellerId && fetchSellerInfo(customer.sellerId)}
                          style={{ 
                            cursor: customer.sellerId ? 'pointer' : 'default',
                            backgroundColor: selectedSeller === customer.sellerId ? '#e3f2fd' : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (customer.sellerId) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedSeller !== customer.sellerId) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            } else {
                              e.currentTarget.style.backgroundColor = '#e3f2fd';
                            }
                          }}
                        >
                          <td>{customer.sellerId || '-'}</td>
                          <td>{customer.sellerEmail || '-'}</td>
                          <td>{customer.companyName || '-'}</td>
                          <td>
                            {customer.firstName || customer.lastName 
                              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                              : '-'
                            }
                          </td>
                          <td>
                            {customer.street || customer.city || customer.postalCode
                              ? `${customer.street || ''}${customer.street && (customer.city || customer.postalCode) ? ', ' : ''}${customer.postalCode || ''} ${customer.city || ''}`.trim()
                              : '-'
                            }
                          </td>
                          <td>{customer.kvkNumber || '-'}</td>
                          <td>{customer.vatNumber || '-'}</td>
                          <td>{customer.iban || '-'}</td>
                          <td>{customer.isNewCustomer ? 'Nieuw' : 'Bestaand'}</td>
                          <td>{customer.package || '-'}</td>
                          <td>{customer.billingPeriod || '-'}</td>
                          <td>{customer.mollieMandateId ? '✓' : '-'}</td>
                          <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('nl-NL') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isSearchMode && displayCustomers.length === 0 && !isSearching && (
              <div style={{ marginTop: '30px', padding: '20px', textAlign: 'center', color: '#666' }}>
                Geen resultaten gevonden voor "{searchQuery}"
              </div>
            )}

            {!isSearchMode && customersData && (!customersData.customers || customersData.customers.length === 0) && (
              <div style={{ marginTop: '30px', padding: '20px', textAlign: 'center', color: '#666' }}>
                Geen klanten gevonden
              </div>
            )}
          </div>
        );

      default:
        return <div>Selecteer een sectie</div>;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header-top">
        <Link to="/" className="admin-logo-link">
          <img src="/images/logo_sdeal_navbar.svg" alt="SDeal Logo" className="admin-logo" />
        </Link>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h1>Admin Panel</h1>
        </div>
        
        <div className="admin-navigation">
          <button 
            className={`admin-nav-button ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            Overzicht
          </button>
          <button 
            className={`admin-nav-button ${activeSection === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveSection('finance')}
          >
            Finance
          </button>
          <button 
            className={`admin-nav-button ${activeSection === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveSection('customers')}
          >
            Klanten
          </button>
        </div>
        
        <div className="admin-content">
          {renderSectionContent()}
        </div>
      </div>

      {/* Seller Info Modal */}
      {(selectedSeller || sellerInfo) && (
        <div className="seller-modal-overlay" onClick={closeSellerModal}>
          <div className="seller-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="seller-modal-header">
              <h2>Seller Informatie - ID: {selectedSeller}</h2>
              <button className="seller-modal-close" onClick={closeSellerModal}>×</button>
            </div>
            
            <div className="seller-modal-body">
              {loadingSellerInfo ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="admin-loading">Laden...</div>
                </div>
              ) : sellerInfoError ? (
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                  {sellerInfoError}
                </div>
              ) : sellerInfo ? (
                <div className="seller-info-sections">
                  {/* Balance Info */}
                  <div className="seller-info-section">
                    <h3>Balance</h3>
                    {sellerInfo.errors.balance ? (
                      <div style={{ color: 'red' }}>Error: {sellerInfo.errors.balance}</div>
                    ) : sellerInfo.balance && sellerInfo.balance.items && sellerInfo.balance.items.length > 0 ? (
                      <div className="seller-info-grid">
                        {sellerInfo.balance.items.map((item, idx) => (
                          <div key={idx} className="seller-info-card">
                            <div className="seller-info-row">
                              <strong>Supplier:</strong> {item.supplier_name || '-'}
                            </div>
                            <div className="seller-info-row">
                              <strong>Balance Totaal:</strong> €{parseFloat(item.balance_total || 0).toFixed(2)}
                            </div>
                            <div className="seller-info-row">
                              <strong>Balance Pending:</strong> €{parseFloat(item.balance_pending || 0).toFixed(2)}
                            </div>
                            <div className="seller-info-row">
                              <strong>Balance Available:</strong> €{parseFloat(item.balance_available || 0).toFixed(2)}
                            </div>
                            <div className="seller-info-row">
                              <strong>Balance Partner:</strong> €{parseFloat(item.balance_partner || 0).toFixed(2)}
                            </div>
                            <div className="seller-info-row">
                              <strong>Datum:</strong> {item.date ? new Date(item.date).toLocaleDateString('nl-NL') : '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>Geen balance data beschikbaar</div>
                    )}
                  </div>

                  {/* Orders Info */}
                  <div className="seller-info-section">
                    <h3>Orders (Laatste 10)</h3>
                    {sellerInfo.errors.orders ? (
                      <div style={{ color: 'red' }}>Error: {sellerInfo.errors.orders}</div>
                    ) : sellerInfo.orders && sellerInfo.orders.items && sellerInfo.orders.items.length > 0 ? (
                      <div className="seller-orders-table">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Status</th>
                              <th>Finance Status</th>
                              <th>Bedrag</th>
                              <th>Datum</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellerInfo.orders.items.map((order) => (
                              <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.order_status}</td>
                                <td>{order.finance_status}</td>
                                <td>€{parseFloat(order.order_amount_org || 0).toFixed(2)}</td>
                                <td>{order.created_at ? new Date(order.created_at).toLocaleDateString('nl-NL') : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div>Geen orders gevonden</div>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="seller-info-section">
                    <h3>Delivery Informatie</h3>
                    {sellerInfo.errors.deliveryInfo ? (
                      <div style={{ color: 'red' }}>Error: {sellerInfo.errors.deliveryInfo}</div>
                    ) : sellerInfo.deliveryInfo && sellerInfo.deliveryInfo.length > 0 ? (
                      <div className="seller-info-grid">
                        {sellerInfo.deliveryInfo.map((info, idx) => (
                          <div key={idx} className="seller-info-card">
                            <div className="seller-info-row">
                              <strong>Delivery Reliability:</strong> {info.delivery_reliability || 0}%
                            </div>
                            <div className="seller-info-row">
                              <strong>Delivery Reliability (90 dagen):</strong> {info.delivery_reliability_90_days || 0}%
                            </div>
                            <div className="seller-info-row">
                              <strong>Total Emails Sent:</strong> {info.total_email_sent || 0}
                            </div>
                            <div className="seller-info-row">
                              <strong>Answered:</strong> {info.answered || 0}
                            </div>
                            <div className="seller-info-row">
                              <strong>Not Answered:</strong> {info.not_answered || 0}
                            </div>
                            <div className="seller-info-row">
                              <strong>Received:</strong> {info.received || 0}
                            </div>
                            <div className="seller-info-row">
                              <strong>Not Received:</strong> {info.not_received || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>Geen delivery data beschikbaar</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

