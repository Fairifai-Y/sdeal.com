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
  
  // Mailing section state
  const [mailingSubsection, setMailingSubsection] = useState('consumers');
  const [mailingData, setMailingData] = useState({
    consumers: null,
    templates: null,
    workflows: null,
    campaigns: null,
    bounces: null,
    lists: null
  });
  const [mailingLoading, setMailingLoading] = useState(false);
  
  // Workflow editor state
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    triggerType: 'consumer_created',
    triggerConditions: {},
    isActive: true,
    steps: []
  });
  const [workflowLoading, setWorkflowLoading] = useState(false);
  
  // Lists state
  const [editingList, setEditingList] = useState(null);
  const [listForm, setListForm] = useState({
    name: '',
    description: '',
    isPublic: false,
    doubleOptIn: true
  });
  const [listLoading, setListLoading] = useState(false);
  
  // List members management state
  const [viewingListMembers, setViewingListMembers] = useState(null);
  const [listMembers, setListMembers] = useState(null);
  const [listMembersLoading, setListMembersLoading] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState(new Set());
  const [bulkAddToListId, setBulkAddToListId] = useState(null);
  
  // Consumer editor state
  const [editingConsumer, setEditingConsumer] = useState(null);
  const [consumerForm, setConsumerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    store: 'NL',
    country: '',
    phone: '',
    source: 'manual',
    sourceUrl: ''
  });
  const [consumerLoading, setConsumerLoading] = useState(false);
  const [consumerSearchQuery, setConsumerSearchQuery] = useState('');
  const [consumerSearchTimeout, setConsumerSearchTimeout] = useState(null);
  const [consumerStoreFilter, setConsumerStoreFilter] = useState('');
  const [consumerCountryFilter, setConsumerCountryFilter] = useState('');
  
  // Campaign editor state
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    templateId: '',
    listId: '',
    scheduledAt: '',
    status: 'draft'
  });
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignPreview, setCampaignPreview] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  
  // Sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncPolling, setSyncPolling] = useState(false);
  
  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: '',
    isActive: true,
    availableVariables: []
  });
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templatePreview, setTemplatePreview] = useState('');
  
  // Available variables for templates
  const availableVariables = [
    { name: 'firstName', label: 'Voornaam', description: 'Voornaam van de consument', example: 'Jan' },
    { name: 'lastName', label: 'Achternaam', description: 'Achternaam van de consument', example: 'Jansen' },
    { name: 'email', label: 'Email', description: 'Email adres van de consument', example: 'jan@example.com' },
    { name: 'store', label: 'Store', description: 'Store code (NL, DE, BE, FR)', example: 'NL' },
    { name: 'country', label: 'Land', description: 'Land code', example: 'NL' },
    { name: 'unsubscribeLink', label: 'Uitschrijflink', description: 'Link om uit te schrijven', example: 'https://...' },
    { name: 'unsubscribeToken', label: 'Uitschrijftoken', description: 'Unieke token voor uitschrijven', example: 'abc123...' }
  ];

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Helper function to make authenticated requests
  const authenticatedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // If token is invalid/expired, logout user
    if (response.status === 401) {
      handleLogout();
      throw new Error('Authentication required');
    }
    
    return response;
  };

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token is still valid
      authenticatedFetch('/api/admin/auth', {
        method: 'GET'
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.valid) {
            setIsAuthenticated(true);
          } else {
            // Token invalid, remove it
            localStorage.removeItem('adminToken');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // Error checking token, assume invalid
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSectionData = async (section) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/admin/${section}`);
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

  const fetchMailingData = async (subsection, searchQuery = '', storeFilter = '', countryFilter = '') => {
    setMailingLoading(true);
    try {
      let endpoint = `/api/admin/mailing/${subsection}`;
      
      // Add search and filter parameters for consumers
      if (subsection === 'consumers') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (storeFilter) params.append('store', storeFilter);
        if (countryFilter) params.append('country', countryFilter);
        
        const queryString = params.toString();
        if (queryString) {
          endpoint += `?${queryString}`;
        }
      }
      
      const response = await authenticatedFetch(endpoint);
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Error fetching mailing data (${response.status}):`, text);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error fetching mailing data: Response is not JSON:', text.substring(0, 200));
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMailingData(prev => ({
          ...prev,
          [subsection]: result.data
        }));
      } else {
        console.error('Error fetching mailing data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching mailing data:', error);
    } finally {
      setMailingLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/mailing/sync-customers');
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Error fetching sync status (${response.status}):`, text);
        setSyncPolling(false);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error fetching sync status: Response is not JSON:', text.substring(0, 200));
        setSyncPolling(false);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(result.data);
        
        // Continue polling if sync is running
        if (result.data.isRunning) {
          if (!syncPolling) {
            setSyncPolling(true);
          }
        } else {
          setSyncPolling(false);
          // Refresh consumers data when sync completes
          if (mailingSubsection === 'consumers') {
            fetchMailingData('consumers', consumerSearchQuery, consumerStoreFilter, consumerCountryFilter);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setSyncPolling(false);
    }
  };

  const startSync = async (testMode = false) => {
    setSyncLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/mailing/sync-customers', {
        method: 'POST',
        body: JSON.stringify({
          pageSize: 500,
          startPage: 1,
          maxPages: testMode ? 1 : null, // Test mode: 1 page (500 orders)
          fullSync: false, // Resume from checkpoint if available
          resume: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Start polling for status
        setSyncPolling(true);
        fetchSyncStatus();
        if (testMode) {
          alert('Test import gestart! Maximaal 500 orders worden geïmporteerd.');
        } else {
          alert('Sync gestart! De sync loopt op de achtergrond en kan worden hervat als deze wordt gestopt.');
        }
      } else {
        alert('Error starting sync: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      alert('Error starting sync: ' + error.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const stopSync = async () => {
    if (!window.confirm('Weet je zeker dat je de sync wilt stoppen? De sync kan later worden hervat vanaf waar deze is gestopt.')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch('/api/admin/mailing/sync-customers', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Stop aangevraagd. De sync stopt na de huidige pagina.');
        fetchSyncStatus();
      } else {
        alert('Error stopping sync: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error stopping sync:', error);
      alert('Error stopping sync: ' + error.message);
    }
  };

  // Poll sync status when sync is running
  useEffect(() => {
    if (syncPolling) {
      const interval = setInterval(() => {
        fetchSyncStatus();
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncPolling]);

  const searchCustomers = async (query) => {
    setIsSearching(true);
    try {
      const response = await authenticatedFetch(`/api/admin/search-customers?q=${encodeURIComponent(query)}`);
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
      if (activeSection === 'mailing') {
        // Always fetch mailing data for current subsection when section is active
        if (mailingSubsection === 'consumers') {
          fetchMailingData('consumers', consumerSearchQuery, consumerStoreFilter, consumerCountryFilter);
        } else {
          fetchMailingData(mailingSubsection);
        }
        // Also fetch sync status if on consumers subsection
        if (mailingSubsection === 'consumers') {
          fetchSyncStatus();
        }
        // Fetch lists if needed for bulk add
        if (bulkAddToListId && !mailingData.lists) {
          fetchMailingData('lists');
        }
      } else {
        fetchSectionData(activeSection);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeSection, mailingSubsection]);

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

  // Auto-update template preview when content changes
  useEffect(() => {
    if (editingTemplate) {
      const generatePreview = () => {
        let preview = templateForm.htmlContent || '';
        // Replace variables with example values
        availableVariables.forEach(variable => {
          const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
          preview = preview.replace(regex, variable.example);
        });
        setTemplatePreview(preview);
      };
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateForm.htmlContent, templateForm.subject, editingTemplate]);

  // Auto-update campaign preview when content changes
  useEffect(() => {
    if (editingCampaign) {
      const updateCampaignPreview = () => {
        const selectedTemplate = mailingData.templates?.find(t => t.id === campaignForm.templateId);
        if (selectedTemplate) {
          let preview = selectedTemplate.htmlContent || '';
          // Replace variables with example values
          availableVariables.forEach(variable => {
            const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
            preview = preview.replace(regex, variable.example);
          });
          setCampaignPreview(preview);
        } else {
          setCampaignPreview('');
        }

        // Calculate recipient count
        if (campaignForm.listId) {
          const selectedList = mailingData.lists?.find(l => l.id === campaignForm.listId);
          if (selectedList) {
            setRecipientCount(selectedList.totalConsumers || selectedList._count?.listMembers || 0);
          } else {
            setRecipientCount(0);
          }
        } else {
          // Count all active consumers
          const consumers = mailingData.consumers?.consumers || [];
          setRecipientCount(consumers.length);
        }
      };
      updateCampaignPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignForm.templateId, campaignForm.listId, mailingData.templates, mailingData.lists]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      
      // Check if response is OK and is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        setError(`Server error: ${response.status} ${response.statusText}. Please check the logs.`);
        setPassword('');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.token) {
        // Store token in localStorage (more persistent than sessionStorage)
        localStorage.setItem('adminToken', result.data.token);
        setIsAuthenticated(true);
        setError('');
        setPassword('');
      } else {
        setError(result.error || 'Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(`Login failed: ${error.message}. Please try again.`);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
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
                  <p style={{ fontSize: '12px', color: 'white', marginTop: '5px', opacity: 0.9 }}>Sellers met balance record</p>
                </div>
                <div className="stat-card highlight">
                  <h3>Sellers met Orders</h3>
                  <p className="stat-number">{overviewData.sellersWithOrders || 0}</p>
                  <p style={{ fontSize: '12px', color: 'white', marginTop: '5px', opacity: 0.9 }}>
                    Sellers die een order hebben gehad
                    {overviewData.fetchedOrdersCount && (
                      <span style={{ display: 'block', marginTop: '3px' }}>
                        (uit {overviewData.fetchedOrdersCount.toLocaleString('nl-NL')} opgehaalde orders)
                      </span>
                    )}
                  </p>
                </div>
                <div className="stat-card highlight">
                  <h3>New Model Sellers</h3>
                  <p className="stat-number">{overviewData.newModelCustomers || 0}</p>
                  <p style={{ fontSize: '12px', color: 'white', marginTop: '5px', opacity: 0.9 }}>Sellers uit database</p>
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

      case 'mailing':
        return renderMailingContent();

      default:
        return <div>Selecteer een sectie</div>;
    }
  };

  const renderMailingContent = () => {
    if (mailingLoading) {
      return <div className="admin-loading">Loading...</div>;
    }

    return (
      <div className="admin-section-content">
        <h2>Mailing</h2>
        
        {/* Mailing Submenu */}
        <div className="admin-submenu">
          <button
            className={`admin-submenu-button ${mailingSubsection === 'consumers' ? 'active' : ''}`}
            onClick={() => setMailingSubsection('consumers')}
          >
            Consumenten
          </button>
          <button
            className={`admin-submenu-button ${mailingSubsection === 'templates' ? 'active' : ''}`}
            onClick={() => setMailingSubsection('templates')}
          >
            Templates
          </button>
          <button
            className={`admin-submenu-button ${mailingSubsection === 'workflows' ? 'active' : ''}`}
            onClick={() => setMailingSubsection('workflows')}
          >
            Workflows
          </button>
          <button
            className={`admin-submenu-button ${mailingSubsection === 'lists' ? 'active' : ''}`}
            onClick={() => {
              setMailingSubsection('lists');
              setBulkAddToListId(null);
              setSelectedConsumers(new Set());
            }}
          >
            Maillijsten
          </button>
          <button
            className={`admin-submenu-button ${mailingSubsection === 'campaigns' ? 'active' : ''}`}
            onClick={() => setMailingSubsection('campaigns')}
          >
            Campagnes
          </button>
          <button
            className={`admin-submenu-button ${mailingSubsection === 'bounces' ? 'active' : ''}`}
            onClick={() => setMailingSubsection('bounces')}
          >
            Bounces
          </button>
        </div>

        {/* Mailing Subsection Content */}
        {mailingSubsection === 'consumers' && renderConsumersContent()}
        {mailingSubsection === 'templates' && renderTemplatesContent()}
        {mailingSubsection === 'workflows' && renderWorkflowsContent()}
        {mailingSubsection === 'lists' && renderListsContent()}
        {mailingSubsection === 'campaigns' && renderCampaignsContent()}
        {mailingSubsection === 'bounces' && renderBouncesContent()}
      </div>
    );
  };

  // Consumer management functions
  const openConsumerEditor = (consumer = null) => {
    if (consumer) {
      setConsumerForm({
        firstName: consumer.firstName || '',
        lastName: consumer.lastName || '',
        email: consumer.email || '',
        store: consumer.store || 'NL',
        country: consumer.country || '',
        phone: consumer.phone || '',
        source: consumer.source || 'manual',
        sourceUrl: consumer.sourceUrl || ''
      });
      setEditingConsumer(consumer.id);
    } else {
      setConsumerForm({
        firstName: '',
        lastName: '',
        email: '',
        store: 'NL',
        country: '',
        phone: '',
        source: 'manual',
        sourceUrl: ''
      });
      setEditingConsumer('new');
    }
  };

  const closeConsumerEditor = () => {
    setEditingConsumer(null);
    setConsumerForm({
      firstName: '',
      lastName: '',
      email: '',
      store: 'NL',
      country: '',
      phone: '',
      source: 'manual',
      sourceUrl: ''
    });
  };

  const saveConsumer = async () => {
    if (!consumerForm.firstName || !consumerForm.lastName || !consumerForm.email || !consumerForm.store) {
      alert('Voornaam, achternaam, email en store zijn verplicht');
      return;
    }

    setConsumerLoading(true);
    try {
      const url = '/api/admin/mailing/consumers';
      const method = editingConsumer === 'new' ? 'POST' : 'PUT';
      const body = editingConsumer === 'new' 
        ? consumerForm 
        : { ...consumerForm, id: editingConsumer };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(editingConsumer === 'new' ? 'Consument aangemaakt!' : 'Consument bijgewerkt!');
        closeConsumerEditor();
        fetchMailingData('consumers', consumerSearchQuery, consumerStoreFilter, consumerCountryFilter);
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving consumer:', error);
      alert('Error saving consumer: ' + error.message);
    } finally {
      setConsumerLoading(false);
    }
  };

  // Handle search with debounce
  const handleConsumerSearch = (query) => {
    setConsumerSearchQuery(query);
    
    // Clear existing timeout
    if (consumerSearchTimeout) {
      clearTimeout(consumerSearchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchMailingData('consumers', query, consumerStoreFilter, consumerCountryFilter);
    }, 500); // 500ms debounce
    
    setConsumerSearchTimeout(timeout);
  };

  // Handle store filter change
  const handleStoreFilterChange = (store) => {
    setConsumerStoreFilter(store);
    fetchMailingData('consumers', consumerSearchQuery, store, consumerCountryFilter);
  };

  // Handle country filter change
  const handleCountryFilterChange = (country) => {
    setConsumerCountryFilter(country);
    fetchMailingData('consumers', consumerSearchQuery, consumerStoreFilter, country);
  };

  // Clear all filters
  const clearConsumerFilters = () => {
    setConsumerSearchQuery('');
    setConsumerStoreFilter('');
    setConsumerCountryFilter('');
    fetchMailingData('consumers');
  };

  const renderConsumersContent = () => {
    const consumers = mailingData.consumers?.consumers || [];
    const pagination = mailingData.consumers?.pagination;

    // If editing, show editor
    if (editingConsumer) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingConsumer === 'new' ? 'Nieuwe Consument' : 'Consument Bewerken'}</h3>
            <button 
              className="admin-button-secondary"
              onClick={closeConsumerEditor}
            >
              Annuleren
            </button>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Voornaam *
                </label>
                <input
                  type="text"
                  value={consumerForm.firstName}
                  onChange={(e) => setConsumerForm({ ...consumerForm, firstName: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Jan"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Achternaam *
                </label>
                <input
                  type="text"
                  value={consumerForm.lastName}
                  onChange={(e) => setConsumerForm({ ...consumerForm, lastName: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Jansen"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                value={consumerForm.email}
                onChange={(e) => setConsumerForm({ ...consumerForm, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="jan.jansen@example.com"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Store *
                </label>
                <select
                  value={consumerForm.store}
                  onChange={(e) => setConsumerForm({ ...consumerForm, store: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="NL">NL</option>
                  <option value="DE">DE</option>
                  <option value="BE">BE</option>
                  <option value="FR">FR</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Land
                </label>
                <input
                  type="text"
                  value={consumerForm.country}
                  onChange={(e) => setConsumerForm({ ...consumerForm, country: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Nederland"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Telefoon
                </label>
                <input
                  type="tel"
                  value={consumerForm.phone}
                  onChange={(e) => setConsumerForm({ ...consumerForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="+31 6 12345678"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Bron
                </label>
                <select
                  value={consumerForm.source}
                  onChange={(e) => setConsumerForm({ ...consumerForm, source: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="manual">Handmatig</option>
                  <option value="magento_sync">Magento Sync</option>
                  <option value="import">Import</option>
                  <option value="api">API</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Bron URL
              </label>
              <input
                type="text"
                value={consumerForm.sourceUrl}
                onChange={(e) => setConsumerForm({ ...consumerForm, sourceUrl: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="https://..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="admin-button-primary"
                onClick={saveConsumer}
                disabled={consumerLoading}
              >
                {consumerLoading ? 'Opslaan...' : editingConsumer === 'new' ? 'Consument Aanmaken' : 'Consument Opslaan'}
              </button>
              <button
                className="admin-button-secondary"
                onClick={closeConsumerEditor}
                disabled={consumerLoading}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Consumenten</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {syncStatus?.isRunning ? (
              <button 
                className="admin-button-secondary"
                onClick={stopSync}
                style={{ backgroundColor: '#f44336', color: 'white' }}
              >
                ⏹️ Stop Sync
              </button>
            ) : (
              <>
                <button 
                  className="admin-button-secondary"
                  onClick={() => startSync(false)}
                  disabled={syncLoading}
                >
                  {syncLoading ? 'Starten...' : '🔄 Start Sync'}
                </button>
                <button 
                  className="admin-button-secondary"
                  onClick={() => startSync(true)}
                  disabled={syncLoading}
                  style={{ backgroundColor: '#ff9800', color: 'white' }}
                  title="Test import: maximaal 500 orders (1 pagina)"
                >
                  {syncLoading ? 'Testen...' : '🧪 Test Import'}
                </button>
              </>
            )}
            <button 
              className="admin-button-primary"
              onClick={() => openConsumerEditor()}
            >
              + Nieuwe Consument
            </button>
          </div>
        </div>

        {/* Sync Status */}
        {(syncStatus && (syncStatus.isRunning || syncStatus.progress?.totalProcessed > 0 || syncStatus.checkpoint)) && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            backgroundColor: syncStatus.isRunning ? '#e3f2fd' : '#e8f5e9',
            borderRadius: '8px',
            border: `2px solid ${syncStatus.isRunning ? '#2196f3' : '#4caf50'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '18px' }}>
                {syncStatus.isRunning ? '🔄 Sync Loopt...' : syncStatus.checkpoint ? '⏸️ Sync Gepauzeerd' : '✅ Sync Voltooid'}
              </h4>
              {syncStatus.startedAt && (
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Gestart: {new Date(syncStatus.startedAt).toLocaleString('nl-NL')}
                  {syncStatus.duration && (
                    <> • Duur: {Math.round(syncStatus.duration / 1000 / 60)} min</>
                  )}
                </span>
              )}
            </div>
            
            {syncStatus.progress && (
              <div>
                {/* Progress Info */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span><strong>Verwerkt:</strong> {(syncStatus.progress.totalProcessed || syncStatus.progress.processed || 0).toLocaleString('nl-NL')} orders</span>
                    <span><strong>Huidige pagina:</strong> {syncStatus.progress.currentPage || 0}</span>
                  </div>
                  {syncStatus.checkpoint && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      📍 Checkpoint: Laatste entity_id {syncStatus.checkpoint.lastEntityId} (pagina {syncStatus.checkpoint.lastPage})
                    </div>
                  )}
                </div>
                
                {/* Statistics Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '15px', 
                  fontSize: '14px',
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '6px'
                }}>
                  <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                      {(syncStatus.progress.totalCreated || syncStatus.progress.created || 0).toLocaleString('nl-NL')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>✅ Aangemaakt</div>
                  </div>
                  <div style={{ color: '#ff9800', fontWeight: 'bold' }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                      {(syncStatus.progress.totalSkipped || 0).toLocaleString('nl-NL')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>⏭️ Geskipt (duplicaten)</div>
                  </div>
                  {(syncStatus.progress.totalErrors || syncStatus.progress.errors || 0) > 0 && (
                    <div style={{ color: '#f44336', fontWeight: 'bold' }}>
                      <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                        {(syncStatus.progress.totalErrors || syncStatus.progress.errors || 0).toLocaleString('nl-NL')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>❌ Fouten</div>
                    </div>
                  )}
                  {syncStatus.progress.lastEntityId > 0 && (
                    <div style={{ color: '#2196f3', fontWeight: 'bold' }}>
                      <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                        {syncStatus.progress.lastEntityId.toLocaleString('nl-NL')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>📍 Laatste Entity ID</div>
                    </div>
                  )}
                </div>
                
                {syncStatus.checkpoint && !syncStatus.isRunning && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#856404'
                  }}>
                    💡 <strong>Tip:</strong> De sync kan worden hervat vanaf pagina {syncStatus.checkpoint.lastPage + 1} door opnieuw op "Start Sync" te klikken.
                  </div>
                )}

                {syncStatus.completedAt && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    Voltooid: {new Date(syncStatus.completedAt).toLocaleString('nl-NL')}
                    {syncStatus.duration && (
                      <span> (Duur: {Math.round(syncStatus.duration / 1000 / 60)} minuten)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search and filters */}
        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={consumerSearchQuery}
            onChange={(e) => handleConsumerSearch(e.target.value)}
            placeholder="Zoeken op naam of email..."
            style={{
              flex: '1',
              minWidth: '200px',
              maxWidth: '400px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          
          <select
            value={consumerStoreFilter}
            onChange={(e) => handleStoreFilterChange(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Alle Stores</option>
            <option value="NL">NL</option>
            <option value="DE">DE</option>
            <option value="BE">BE</option>
            <option value="FR">FR</option>
          </select>
          
          <select
            value={consumerCountryFilter}
            onChange={(e) => handleCountryFilterChange(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Alle Landen</option>
            <option value="NL">Nederland</option>
            <option value="DE">Duitsland</option>
            <option value="BE">België</option>
            <option value="FR">Frankrijk</option>
          </select>
          
          {(consumerSearchQuery || consumerStoreFilter || consumerCountryFilter) && (
            <button
              onClick={clearConsumerFilters}
              style={{
                padding: '10px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Filters Wissen
            </button>
          )}
        </div>

        {/* Show active filters */}
        {(consumerSearchQuery || consumerStoreFilter || consumerCountryFilter) && (
          <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
            Actieve filters:
            {consumerSearchQuery && <span style={{ marginLeft: '5px', padding: '2px 8px', backgroundColor: '#e3f2fd', borderRadius: '3px' }}>Zoek: "{consumerSearchQuery}"</span>}
            {consumerStoreFilter && <span style={{ marginLeft: '5px', padding: '2px 8px', backgroundColor: '#e3f2fd', borderRadius: '3px' }}>Store: {consumerStoreFilter}</span>}
            {consumerCountryFilter && <span style={{ marginLeft: '5px', padding: '2px 8px', backgroundColor: '#e3f2fd', borderRadius: '3px' }}>Land: {consumerCountryFilter}</span>}
          </div>
        )}

        {pagination && (
          <div style={{ marginBottom: '15px', color: '#666' }}>
            Totaal: {pagination.total} consumenten
            {consumerSearchQuery && <span> (gefilterd)</span>}
          </div>
        )}

        {/* Bulk actions toolbar */}
        {selectedConsumers.size > 0 && (
          <div style={{
            marginBottom: '15px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>{selectedConsumers.size}</strong> consument(en) geselecteerd
              {bulkAddToListId && (() => {
                const selectedList = (mailingData.lists || []).find(l => l.id === bulkAddToListId);
                return selectedList ? (
                  <span style={{ marginLeft: '10px', color: '#2196f3', fontWeight: 'bold' }}>
                    → Toevoegen aan: {selectedList.name}
                  </span>
                ) : null;
              })()}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!bulkAddToListId && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setBulkAddToListId(e.target.value);
                    }
                  }}
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Selecteer lijst...</option>
                  {(mailingData.lists || []).map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.totalConsumers || 0} leden)
                    </option>
                  ))}
                </select>
              )}
              {bulkAddToListId && (
                <>
                  <button
                    className="admin-button-primary"
                    onClick={() => {
                      addMembersToList(bulkAddToListId, selectedConsumers);
                    }}
                  >
                    ✅ Toevoegen aan Lijst
                  </button>
                  <button
                    className="admin-button-secondary"
                    onClick={() => setBulkAddToListId(null)}
                  >
                    Lijst Wijzigen
                  </button>
                </>
              )}
              {mailingData.lists && mailingData.lists.length === 0 && !bulkAddToListId && (
                <span style={{ color: '#666', fontSize: '12px' }}>
                  Geen lijsten beschikbaar. Maak eerst een lijst aan.
                </span>
              )}
              <button
                className="admin-button-secondary"
                onClick={() => {
                  setSelectedConsumers(new Set());
                  setBulkAddToListId(null);
                }}
              >
                Deselecteren
              </button>
            </div>
          </div>
        )}

        {consumers.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedConsumers.size === consumers.length && consumers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedConsumers(new Set(consumers.map(c => c.id)));
                        } else {
                          setSelectedConsumers(new Set());
                        }
                      }}
                    />
                  </th>
                  <th>Naam</th>
                  <th>Email</th>
                  <th>Store</th>
                  <th>Land</th>
                  <th>Uitgeschreven</th>
                  <th>Laatste Contact</th>
                  <th>Emails Verstuurd</th>
                  <th>Emails Geopend</th>
                  <th>Emails Geklikt</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {consumers.map((consumer) => (
                  <tr key={consumer.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedConsumers.has(consumer.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedConsumers);
                          if (e.target.checked) {
                            newSelected.add(consumer.id);
                          } else {
                            newSelected.delete(consumer.id);
                          }
                          setSelectedConsumers(newSelected);
                        }}
                      />
                    </td>
                    <td>{consumer.firstName} {consumer.lastName}</td>
                    <td>{consumer.email}</td>
                    <td>{consumer.store}</td>
                    <td>{consumer.country || '-'}</td>
                    <td>{consumer.isUnsubscribed ? '✓' : '-'}</td>
                    <td>{consumer.lastContactAt ? new Date(consumer.lastContactAt).toLocaleDateString('nl-NL') : '-'}</td>
                    <td>{consumer.totalEmailsSent}</td>
                    <td>{consumer.totalEmailsOpened}</td>
                    <td>{consumer.totalEmailsClicked}</td>
                    <td>{new Date(consumer.createdAt).toLocaleDateString('nl-NL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen consumenten gevonden
          </div>
        )}
      </div>
    );
  };

  const insertVariable = (variableName) => {
    const variable = `{{${variableName}}}`;
    const textarea = document.getElementById('htmlContent');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateForm.htmlContent;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setTemplateForm({ ...templateForm, htmlContent: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const insertVariableInSubject = (variableName) => {
    const variable = `{{${variableName}}}`;
    const textarea = document.getElementById('subject');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateForm.subject;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setTemplateForm({ ...templateForm, subject: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // Helper function to wrap content in email template (same as backend)
  const wrapEmailTemplate = (content) => {
    if (!content) return '';
    
    // Check if content already has full HTML structure
    if (content.trim().toLowerCase().startsWith('<!doctype') || 
        (content.includes('<html') && content.includes('</html>'))) {
      return content; // Already a complete HTML document
    }

    // Wrap in a responsive email template with inline styles
    return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; line-height: 1.6; color: #333333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333333;">SDeal</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px 0;">
                <strong>SDeal B.V.</strong><br>
                Osloweg 110, 9723 BX Groningen, The Netherlands<br>
                KVK: 76103080 | VAT: NL 860508468B01
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="https://www.sdeal.com" style="color: #0066cc; text-decoration: none;">www.sdeal.com</a> | 
                <a href="mailto:info@sdeal.com" style="color: #0066cc; text-decoration: none;">info@sdeal.com</a>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 11px; color: #999999;">
                Deze email is verzonden naar {{email}}. 
                <a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: underline;">Afmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generatePreview = () => {
    let preview = templateForm.htmlContent || '';
    // Replace variables with example values
    availableVariables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      preview = preview.replace(regex, variable.example);
    });
    
    // Wrap in email template
    preview = wrapEmailTemplate(preview);
    
    // Replace unsubscribe URL and email in footer
    preview = preview.replace(/\{\{unsubscribeUrl\}\}/g, '#');
    preview = preview.replace(/\{\{email\}\}/g, 'voorbeeld@email.com');
    
    // Replace subject variables too
    let subjectPreview = templateForm.subject || '';
    availableVariables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      subjectPreview = subjectPreview.replace(regex, variable.example);
    });
    setTemplatePreview(preview);
  };

  const openTemplateEditor = (template = null) => {
    if (template) {
      setTemplateForm({
        name: template.name || '',
        subject: template.subject || '',
        htmlContent: template.htmlContent || '',
        textContent: template.textContent || '',
        category: template.category || '',
        isActive: template.isActive !== undefined ? template.isActive : true,
        availableVariables: template.availableVariables || []
      });
      setEditingTemplate(template.id);
    } else {
      setTemplateForm({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        category: '',
        isActive: true,
        availableVariables: []
      });
      setEditingTemplate('new');
    }
    generatePreview();
  };

  const closeTemplateEditor = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      category: '',
      isActive: true,
      availableVariables: []
    });
    setTemplatePreview('');
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
      alert('Naam, onderwerp en HTML content zijn verplicht');
      return;
    }

    setTemplateLoading(true);
    try {
      const url = '/api/admin/mailing/templates';
      const method = editingTemplate === 'new' ? 'POST' : 'PUT';
      const body = editingTemplate === 'new' 
        ? templateForm 
        : { ...templateForm, id: editingTemplate };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingTemplate === 'new' ? 'Template aangemaakt!' : 'Template bijgewerkt!');
        closeTemplateEditor();
        fetchMailingData('templates');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template: ' + error.message);
    } finally {
      setTemplateLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Weet je zeker dat je dit template wilt verwijderen?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/mailing/templates?id=${templateId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Template verwijderd!');
        fetchMailingData('templates');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template: ' + error.message);
    }
  };

  const renderTemplatesContent = () => {
    const templates = mailingData.templates || [];

    // If editing, show editor
    if (editingTemplate) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingTemplate === 'new' ? 'Nieuw Template' : 'Template Bewerken'}</h3>
            <button 
              className="admin-button-secondary"
              onClick={closeTemplateEditor}
            >
              Annuleren
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left Column: Form */}
            <div>
              <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Beschikbare Variabelen</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.name}
                      type="button"
                      onClick={() => insertVariable(variable.name)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title={variable.description}
                    >
                      {variable.label} ({`{{${variable.name}}}`})
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  Klik op een variabele om deze in te voegen in de HTML content
                </div>
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '12px' }}>
                  <strong>💡 Links toevoegen:</strong> Gebruik <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '2px' }}>&lt;a href="https://www.sdeal.com" style="color: #0066cc; text-decoration: none;"&gt;Link tekst&lt;/a&gt;</code> voor klikbare links in je email.
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Template Naam *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Bijv: Welcome Email"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Onderwerp *
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal' }}>
                    {availableVariables.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariableInSubject(v.name)}
                        style={{
                          marginLeft: '5px',
                          padding: '2px 6px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                        title={v.description}
                      >
                        {v.name}
                      </button>
                    ))}
                  </span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => {
                    setTemplateForm({ ...templateForm, subject: e.target.value });
                    generatePreview();
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Bijv: Welkom {{firstName}}!"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontWeight: 'bold' }}>
                    HTML Content *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const basicTemplate = `<h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Welkom {{firstName}}!</h2>
<p style="color: #666666; font-size: 16px; margin: 0 0 15px 0; line-height: 1.6;">
  Bedankt voor je aanmelding bij SDeal. We zijn blij je te verwelkomen!
</p>
<p style="color: #666666; font-size: 16px; margin: 0 0 15px 0; line-height: 1.6;">
  Je kunt nu gebruik maken van alle voordelen die SDeal te bieden heeft.
</p>
<p style="color: #666666; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
  <a href="https://www.sdeal.com" style="display: inline-block; padding: 12px 24px; background-color: #2196F3; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600;">Bezoek onze website</a>
</p>
<p style="color: #666666; font-size: 16px; margin: 0; line-height: 1.6;">
  Met vriendelijke groet,<br>
  <strong>Het SDeal Team</strong>
</p>`;
                      setTemplateForm({ ...templateForm, htmlContent: basicTemplate });
                      generatePreview();
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Laad Basis Template
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '4px' }}>
                  <strong>Tips:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>Je hoeft alleen de content te schrijven. De email wordt automatisch gewrapped in een mooie template.</li>
                    <li>Gebruik inline styles voor opmaak (bijv. <code style={{ background: '#e0e0e0', padding: '2px 4px', borderRadius: '2px' }}>style="color: #333; font-size: 16px;"</code>).</li>
                    <li>Maak klikbare links met: <code style={{ background: '#e0e0e0', padding: '2px 4px', borderRadius: '2px' }}>&lt;a href="https://www.sdeal.com" style="color: #0066cc; text-decoration: none;"&gt;Link tekst&lt;/a&gt;</code></li>
                    <li>Voor buttons: <code style={{ background: '#e0e0e0', padding: '2px 4px', borderRadius: '2px' }}>&lt;a href="URL" style="display: inline-block; padding: 12px 24px; background-color: #2196F3; color: #ffffff; text-decoration: none; border-radius: 4px;"&gt;Button tekst&lt;/a&gt;</code></li>
                  </ul>
                </div>
                <textarea
                  id="htmlContent"
                  value={templateForm.htmlContent}
                  onChange={(e) => {
                    setTemplateForm({ ...templateForm, htmlContent: e.target.value });
                    generatePreview();
                  }}
                  style={{ 
                    width: '100%', 
                    minHeight: '300px', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '13px'
                  }}
                  placeholder='<h2 style="color: #333; font-size: 24px;">Welkom {{firstName}}!</h2>\n<p style="color: #666; font-size: 16px;">Je content hier...</p>'
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Text Content (Optioneel)
                </label>
                <textarea
                  value={templateForm.textContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                  style={{ 
                    width: '100%', 
                    minHeight: '150px', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '13px'
                  }}
                  placeholder="Plain text versie van de email"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Categorie
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Geen categorie</option>
                    <option value="welcome">Welcome</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="transactional">Transactioneel</option>
                    <option value="promotional">Promotie</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Status
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={templateForm.isActive}
                      onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                    />
                    <span>Actief</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-button-primary"
                  onClick={saveTemplate}
                  disabled={templateLoading}
                >
                  {templateLoading ? 'Opslaan...' : editingTemplate === 'new' ? 'Template Aanmaken' : 'Template Opslaan'}
                </button>
                <button
                  className="admin-button-secondary"
                  onClick={closeTemplateEditor}
                  disabled={templateLoading}
                >
                  Annuleren
                </button>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div>
              <h4 style={{ marginBottom: '15px' }}>Preview</h4>
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: 'white',
                minHeight: '400px'
              }}>
                <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <strong>Onderwerp:</strong> {templateForm.subject || '(geen onderwerp)'}
                </div>
                <div 
                  dangerouslySetInnerHTML={{ __html: templatePreview || '<p style="color: #999; padding: 20px;">Geen preview beschikbaar. Voeg HTML content toe om een preview te zien.</p>' }}
                  style={{ 
                    lineHeight: '1.6',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0',
                    backgroundColor: '#f4f4f4',
                    minHeight: '400px',
                    overflow: 'auto'
                  }}
                />
              </div>
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '12px' }}>
                💡 <strong>Tip:</strong> De preview toont voorbeeldwaarden voor variabelen. In echte emails worden deze vervangen door echte consument data.
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show template list
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Email Templates</h3>
          <button 
            className="admin-button-primary"
            onClick={() => openTemplateEditor()}
          >
            + Nieuw Template
          </button>
        </div>

        {templates.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Categorie</th>
                  <th>Onderwerp</th>
                  <th>Actief</th>
                  <th>Campagnes</th>
                  <th>Workflows</th>
                  <th>Datum</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{template.category || '-'}</td>
                    <td>{template.subject}</td>
                    <td>{template.isActive ? '✓' : '✗'}</td>
                    <td>{template._count?.campaigns || 0}</td>
                    <td>{template._count?.workflowSteps || 0}</td>
                    <td>{new Date(template.createdAt).toLocaleDateString('nl-NL')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="admin-button-small"
                          onClick={() => openTemplateEditor(template)}
                        >
                          Bewerken
                        </button>
                        <button 
                          className="admin-button-small"
                          onClick={() => deleteTemplate(template.id)}
                          style={{ backgroundColor: '#f44336', color: 'white' }}
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen templates gevonden. Klik op "Nieuw Template" om er een aan te maken.
          </div>
        )}
      </div>
    );
  };

  // Workflow trigger types
  const triggerTypes = [
    { value: 'consumer_created', label: 'Nieuwe Consument', description: 'Wanneer een nieuwe consument wordt aangemaakt' },
    { value: 'email_opened', label: 'Email Geopend', description: 'Wanneer een consument een email opent' },
    { value: 'email_clicked', label: 'Email Geklikt', description: 'Wanneer een consument op een link in een email klikt' },
    { value: 'payment_completed', label: 'Betaling Voltooid', description: 'Wanneer een betaling is voltooid' },
    { value: 'consumer_signup', label: 'Consument Aangemeld', description: 'Wanneer een consument zich aanmeldt' },
    { value: 'consumer_purchase', label: 'Consument Koopt', description: 'Wanneer een consument een aankoop doet' },
    { value: 'date_based', label: 'Datum Gebaseerd', description: 'Op basis van een specifieke datum' },
    { value: 'manual', label: 'Handmatig', description: 'Alleen handmatig te activeren' }
  ];

  // Workflow action types
  const actionTypes = [
    { value: 'send_email', label: 'Stuur Email', description: 'Stuur een email naar de consument', requiresTemplate: true },
    { value: 'add_to_list', label: 'Voeg Toe aan Lijst', description: 'Voeg consument toe aan een maillijst', requiresList: true },
    { value: 'remove_from_list', label: 'Verwijder uit Lijst', description: 'Verwijder consument uit een maillijst', requiresList: true },
    { value: 'update_field', label: 'Update Veld', description: 'Update een veld van de consument', requiresField: true }
  ];

  const addWorkflowStep = () => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: [...prev.steps, {
        actionType: 'send_email',
        templateId: '',
        listId: '',
        fieldName: '',
        fieldValue: '',
        delayDays: 0,
        delayHours: 0,
        delayMinutes: 0,
        conditions: {},
        isActive: true
      }]
    }));
  };

  const removeWorkflowStep = (index) => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateWorkflowStep = (index, field, value) => {
    setWorkflowForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const openWorkflowEditor = (workflow = null) => {
    if (workflow) {
      setWorkflowForm({
        name: workflow.name || '',
        description: workflow.description || '',
        triggerType: workflow.triggerType || 'consumer_created',
        triggerConditions: workflow.triggerConditions || {},
        isActive: workflow.isActive !== undefined ? workflow.isActive : true,
        steps: workflow.steps ? workflow.steps.map(step => ({
          actionType: step.actionType || 'send_email',
          templateId: step.templateId || '',
          listId: step.actionConfig?.listId || '',
          fieldName: step.actionConfig?.fieldName || '',
          fieldValue: step.actionConfig?.fieldValue || '',
          delayDays: step.delayDays || 0,
          delayHours: step.delayHours || 0,
          delayMinutes: step.delayMinutes || 0,
          conditions: step.conditions || {},
          isActive: step.isActive !== undefined ? step.isActive : true
        })) : []
      });
      setEditingWorkflow(workflow.id);
    } else {
      setWorkflowForm({
        name: '',
        description: '',
        triggerType: 'consumer_created',
        triggerConditions: {},
        isActive: true,
        steps: []
      });
      setEditingWorkflow('new');
    }
  };

  const closeWorkflowEditor = () => {
    setEditingWorkflow(null);
    setWorkflowForm({
      name: '',
      description: '',
      triggerType: 'consumer_created',
      triggerConditions: {},
      isActive: true,
      steps: []
    });
  };

  const saveWorkflow = async () => {
    if (!workflowForm.name || !workflowForm.triggerType) {
      alert('Naam en trigger type zijn verplicht');
      return;
    }

    setWorkflowLoading(true);
    try {
      const url = '/api/admin/mailing/workflows';
      const method = editingWorkflow === 'new' ? 'POST' : 'PUT';
      
      const steps = workflowForm.steps.map((step, index) => {
        const stepData = {
          stepOrder: index + 1,
          actionType: step.actionType,
          delayDays: parseInt(step.delayDays) || 0,
          delayHours: parseInt(step.delayHours) || 0,
          delayMinutes: parseInt(step.delayMinutes) || 0,
          isActive: step.isActive,
          conditions: step.conditions || {}
        };

        if (step.actionType === 'send_email' && step.templateId) {
          stepData.templateId = step.templateId;
        }

        if (step.actionType === 'add_to_list' || step.actionType === 'remove_from_list') {
          stepData.actionConfig = { listId: step.listId };
        }

        if (step.actionType === 'update_field') {
          stepData.actionConfig = {
            fieldName: step.fieldName,
            fieldValue: step.fieldValue
          };
        }

        return stepData;
      });

      const body = editingWorkflow === 'new' 
        ? { ...workflowForm, steps }
        : { ...workflowForm, id: editingWorkflow, steps };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingWorkflow === 'new' ? 'Workflow aangemaakt!' : 'Workflow bijgewerkt!');
        closeWorkflowEditor();
        fetchMailingData('workflows');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow: ' + error.message);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId) => {
    if (!window.confirm('Weet je zeker dat je deze workflow wilt verwijderen?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/mailing/workflows?id=${workflowId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Workflow verwijderd!');
        fetchMailingData('workflows');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Error deleting workflow: ' + error.message);
    }
  };

  const renderWorkflowsContent = () => {
    const workflows = mailingData.workflows || [];
    const templates = mailingData.templates || [];
    const lists = mailingData.lists || [];

    // If editing, show editor
    if (editingWorkflow) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingWorkflow === 'new' ? 'Nieuwe Workflow' : 'Workflow Bewerken'}</h3>
            <button 
              className="admin-button-secondary"
              onClick={closeWorkflowEditor}
            >
              Annuleren
            </button>
          </div>

          <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Workflow Naam *
              </label>
              <input
                type="text"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Bijv: Welcome Series"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Beschrijving
              </label>
              <textarea
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                style={{ width: '100%', minHeight: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Beschrijving van de workflow"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Trigger Type *
                </label>
                <select
                  value={workflowForm.triggerType}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, triggerType: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {triggerTypes.map(trigger => (
                    <option key={trigger.value} value={trigger.value} title={trigger.description}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {triggerTypes.find(t => t.value === workflowForm.triggerType)?.description}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={workflowForm.isActive}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, isActive: e.target.checked })}
                  />
                  <span>Actief</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4>Acties (Stappen)</h4>
              <button 
                className="admin-button-secondary"
                onClick={addWorkflowStep}
              >
                + Stap Toevoegen
              </button>
            </div>

            {workflowForm.steps.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                Geen stappen toegevoegd. Klik op "+ Stap Toevoegen" om een actie toe te voegen.
              </div>
            ) : (
              workflowForm.steps.map((step, index) => (
                <div key={index} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h5 style={{ margin: 0 }}>Stap {index + 1}</h5>
                    <button
                      className="admin-button-small"
                      onClick={() => removeWorkflowStep(index)}
                      style={{ backgroundColor: '#f44336', color: 'white' }}
                    >
                      Verwijderen
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Actie Type *
                      </label>
                      <select
                        value={step.actionType}
                        onChange={(e) => updateWorkflowStep(index, 'actionType', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        {actionTypes.map(action => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {step.actionType === 'send_email' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Template *
                        </label>
                        <select
                          value={step.templateId}
                          onChange={(e) => updateWorkflowStep(index, 'templateId', e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Selecteer template</option>
                          {templates.filter(t => t.isActive).map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(step.actionType === 'add_to_list' || step.actionType === 'remove_from_list') && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Maillijst *
                        </label>
                        <select
                          value={step.listId}
                          onChange={(e) => updateWorkflowStep(index, 'listId', e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Selecteer lijst</option>
                          {lists.map(list => (
                            <option key={list.id} value={list.id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {step.actionType === 'update_field' && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Veld Naam *
                          </label>
                          <input
                            type="text"
                            value={step.fieldName}
                            onChange={(e) => updateWorkflowStep(index, 'fieldName', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            placeholder="Bijv: store, country"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Veld Waarde *
                          </label>
                          <input
                            type="text"
                            value={step.fieldValue}
                            onChange={(e) => updateWorkflowStep(index, 'fieldValue', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            placeholder="Bijv: VIP"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Vertraging (Dagen)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={step.delayDays}
                        onChange={(e) => updateWorkflowStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Vertraging (Uren)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={step.delayHours}
                        onChange={(e) => updateWorkflowStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Vertraging (Minuten)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={step.delayMinutes}
                        onChange={(e) => updateWorkflowStep(index, 'delayMinutes', parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={step.isActive}
                        onChange={(e) => updateWorkflowStep(index, 'isActive', e.target.checked)}
                      />
                      <span>Stap is actief</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="admin-button-primary"
              onClick={saveWorkflow}
              disabled={workflowLoading}
            >
              {workflowLoading ? 'Opslaan...' : editingWorkflow === 'new' ? 'Workflow Aanmaken' : 'Workflow Opslaan'}
            </button>
            <button
              className="admin-button-secondary"
              onClick={closeWorkflowEditor}
              disabled={workflowLoading}
            >
              Annuleren
            </button>
          </div>
        </div>
      );
    }

    // Show workflow list
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Email Workflows</h3>
          <button 
            className="admin-button-primary"
            onClick={() => openWorkflowEditor()}
          >
            + Nieuwe Workflow
          </button>
        </div>

        {workflows.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Trigger Type</th>
                  <th>Stappen</th>
                  <th>Uitvoeringen</th>
                  <th>Actief</th>
                  <th>Datum</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.id}>
                    <td>{workflow.name}</td>
                    <td>{triggerTypes.find(t => t.value === workflow.triggerType)?.label || workflow.triggerType}</td>
                    <td>{workflow._count?.steps || 0}</td>
                    <td>{workflow._count?.executions || 0}</td>
                    <td>{workflow.isActive ? '✓' : '✗'}</td>
                    <td>{new Date(workflow.createdAt).toLocaleDateString('nl-NL')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="admin-button-small"
                          onClick={() => openWorkflowEditor(workflow)}
                        >
                          Bewerken
                        </button>
                        <button 
                          className="admin-button-small"
                          onClick={() => deleteWorkflow(workflow.id)}
                          style={{ backgroundColor: '#f44336', color: 'white' }}
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen workflows gevonden. Klik op "Nieuwe Workflow" om er een aan te maken.
          </div>
        )}
      </div>
    );
  };

  const openListEditor = (list = null) => {
    if (list) {
      setListForm({
        name: list.name || '',
        description: list.description || '',
        isPublic: list.isPublic !== undefined ? list.isPublic : false,
        doubleOptIn: list.doubleOptIn !== undefined ? list.doubleOptIn : true
      });
      setEditingList(list.id);
    } else {
      setListForm({
        name: '',
        description: '',
        isPublic: false,
        doubleOptIn: true
      });
      setEditingList('new');
    }
  };

  const closeListEditor = () => {
    setEditingList(null);
    setListForm({
      name: '',
      description: '',
      isPublic: false,
      doubleOptIn: true
    });
  };

  const saveList = async () => {
    if (!listForm.name) {
      alert('Naam is verplicht');
      return;
    }

    setListLoading(true);
    try {
      const url = '/api/admin/mailing/lists';
      const method = editingList === 'new' ? 'POST' : 'PUT';
      const body = editingList === 'new' 
        ? listForm 
        : { ...listForm, id: editingList };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(editingList === 'new' ? 'Maillijst aangemaakt!' : 'Maillijst bijgewerkt!');
        closeListEditor();
        fetchMailingData('lists');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving list:', error);
      alert('Error saving list: ' + error.message);
    } finally {
      setListLoading(false);
    }
  };

  const fetchListMembers = async (listId) => {
    setListMembersLoading(true);
    try {
      const response = await authenticatedFetch(`/api/admin/mailing/list-members?listId=${listId}&pageSize=100`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Error fetching list members (${response.status}):`, text);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error fetching list members: Response is not JSON:', text.substring(0, 200));
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setListMembers(result.data);
      } else {
        console.error('Error fetching list members:', result.error);
      }
    } catch (error) {
      console.error('Error fetching list members:', error);
    } finally {
      setListMembersLoading(false);
    }
  };

  const addMembersToList = async (listId, consumerIds) => {
    if (!consumerIds || consumerIds.length === 0) {
      alert('Selecteer minimaal één consument');
      return;
    }

    try {
      const response = await authenticatedFetch('/api/admin/mailing/list-members', {
        method: 'POST',
        body: JSON.stringify({
          listId: listId,
          consumerIds: Array.from(consumerIds),
          status: 'subscribed',
          source: 'manual'
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.data.added} consument(en) toegevoegd aan lijst!`);
        setSelectedConsumers(new Set());
        setBulkAddToListId(null);
        if (viewingListMembers === listId) {
          fetchListMembers(listId);
        }
        fetchMailingData('lists');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding members to list:', error);
      alert('Error adding members: ' + error.message);
    }
  };

  const removeMemberFromList = async (listId, consumerId) => {
    if (!window.confirm('Weet je zeker dat je deze consument uit de lijst wilt verwijderen?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/mailing/list-members?listId=${listId}&consumerId=${consumerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Response is not JSON: ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Consument verwijderd uit lijst!');
        fetchListMembers(listId);
        fetchMailingData('lists');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing member from list:', error);
      alert('Error removing member: ' + error.message);
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm('Weet je zeker dat je deze maillijst wilt verwijderen? Alle leden worden ook verwijderd.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/mailing/lists?id=${listId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Maillijst verwijderd!');
        fetchMailingData('lists');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Error deleting list: ' + error.message);
    }
  };

  const renderListsContent = () => {
    const lists = mailingData.lists || [];

    // If editing, show editor
    if (editingList) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingList === 'new' ? 'Nieuwe Maillijst' : 'Maillijst Bewerken'}</h3>
            <button 
              className="admin-button-secondary"
              onClick={closeListEditor}
            >
              Annuleren
            </button>
          </div>

          <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Lijst Naam *
              </label>
              <input
                type="text"
                value={listForm.name}
                onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Bijv: VIP Klanten"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Beschrijving
              </label>
              <textarea
                value={listForm.description}
                onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                style={{ width: '100%', minHeight: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Beschrijving van de maillijst"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={listForm.isPublic}
                  onChange={(e) => setListForm({ ...listForm, isPublic: e.target.checked })}
                />
                <span>Publieke lijst (consumenten kunnen zich direct aanmelden)</span>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={listForm.doubleOptIn}
                  onChange={(e) => setListForm({ ...listForm, doubleOptIn: e.target.checked })}
                />
                <span>Double Opt-In vereist (email bevestiging nodig)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="admin-button-primary"
                onClick={saveList}
                disabled={listLoading}
              >
                {listLoading ? 'Opslaan...' : editingList === 'new' ? 'Maillijst Aanmaken' : 'Maillijst Opslaan'}
              </button>
              <button
                className="admin-button-secondary"
                onClick={closeListEditor}
                disabled={listLoading}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show list members view
    if (viewingListMembers) {
      const currentList = lists.find(l => l.id === viewingListMembers);
      
      if (!currentList) {
        setViewingListMembers(null);
        return null;
      }

      // Load members if not loaded
      if (!listMembers && !listMembersLoading) {
        fetchListMembers(viewingListMembers);
      }

      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <button 
                className="admin-button-secondary"
                onClick={() => {
                  setViewingListMembers(null);
                  setListMembers(null);
                }}
                style={{ marginRight: '10px' }}
              >
                ← Terug
              </button>
              <h3 style={{ display: 'inline', marginLeft: '10px' }}>
                Leden van: {currentList.name}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="admin-button-primary"
                onClick={() => {
                  setMailingSubsection('consumers');
                  setBulkAddToListId(viewingListMembers);
                  if (!mailingData.lists) {
                    fetchMailingData('lists');
                  }
                }}
              >
                + Consumenten Toevoegen
              </button>
            </div>
          </div>

          {listMembersLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Laden...</div>
          ) : listMembers && listMembers.members && listMembers.members.length > 0 ? (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Email</th>
                    <th>Store</th>
                    <th>Status</th>
                    <th>Toegevoegd</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {listMembers.members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.consumer.firstName} {member.consumer.lastName}</td>
                      <td>{member.consumer.email}</td>
                      <td>{member.consumer.store}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: member.status === 'subscribed' ? '#4caf50' : '#ff9800',
                          color: 'white'
                        }}>
                          {member.status}
                        </span>
                      </td>
                      <td>{new Date(member.subscribedAt).toLocaleDateString('nl-NL')}</td>
                      <td>
                        <button 
                          className="admin-button-small"
                          onClick={() => removeMemberFromList(viewingListMembers, member.consumerId)}
                          style={{ backgroundColor: '#f44336', color: 'white' }}
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listMembers.pagination && listMembers.pagination.totalPages > 1 && (
                <div style={{ marginTop: '15px', textAlign: 'center', color: '#666' }}>
                  Pagina {listMembers.pagination.page} van {listMembers.pagination.totalPages} 
                  ({listMembers.pagination.total} totaal)
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Geen leden in deze lijst. Klik op "Consumenten Toevoegen" om leden toe te voegen.
            </div>
          )}
        </div>
      );
    }

    // Show lists
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Maillijsten</h3>
          <button 
            className="admin-button-primary"
            onClick={() => openListEditor()}
          >
            + Nieuwe Maillijst
          </button>
        </div>

        {lists.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Beschrijving</th>
                  <th>Leden</th>
                  <th>Publiek</th>
                  <th>Double Opt-In</th>
                  <th>Datum</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id}>
                    <td>{list.name}</td>
                    <td>{list.description || '-'}</td>
                    <td>{list.totalConsumers || list._count?.listMembers || 0}</td>
                    <td>{list.isPublic ? '✓' : '✗'}</td>
                    <td>{list.doubleOptIn ? '✓' : '✗'}</td>
                    <td>{new Date(list.createdAt).toLocaleDateString('nl-NL')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="admin-button-small"
                          onClick={() => {
                            setViewingListMembers(list.id);
                            fetchListMembers(list.id);
                          }}
                          style={{ backgroundColor: '#2196f3', color: 'white' }}
                        >
                          👥 Leden
                        </button>
                        <button 
                          className="admin-button-small"
                          onClick={() => openListEditor(list)}
                        >
                          Bewerken
                        </button>
                        <button 
                          className="admin-button-small"
                          onClick={() => deleteList(list.id)}
                          style={{ backgroundColor: '#f44336', color: 'white' }}
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen maillijsten gevonden. Klik op "Nieuwe Maillijst" om er een aan te maken.
          </div>
        )}
      </div>
    );
  };

  const openCampaignEditor = (campaign = null) => {
    if (campaign) {
      const listId = campaign.filterCriteria?.listId || '';
      setCampaignForm({
        name: campaign.name || '',
        subject: campaign.subject || '',
        templateId: campaign.templateId || '',
        listId: listId,
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
        status: campaign.status || 'draft'
      });
      setEditingCampaign(campaign.id);
    } else {
      setCampaignForm({
        name: '',
        subject: '',
        templateId: '',
        listId: '',
        scheduledAt: '',
        status: 'draft'
      });
      setEditingCampaign('new');
    }
    updateCampaignPreview();
  };

  const closeCampaignEditor = () => {
    setEditingCampaign(null);
    setCampaignForm({
      name: '',
      subject: '',
      templateId: '',
      listId: '',
      scheduledAt: '',
      status: 'draft'
    });
    setCampaignPreview('');
    setRecipientCount(0);
  };

  const updateCampaignPreview = () => {
    const selectedTemplate = mailingData.templates?.find(t => t.id === campaignForm.templateId);
    if (selectedTemplate) {
      let preview = selectedTemplate.htmlContent || '';
      // Replace variables with example values
      availableVariables.forEach(variable => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
        preview = preview.replace(regex, variable.example);
      });
      setCampaignPreview(preview);
    } else {
      setCampaignPreview('');
    }

    // Calculate recipient count
    if (campaignForm.listId) {
      const selectedList = mailingData.lists?.find(l => l.id === campaignForm.listId);
      if (selectedList) {
        setRecipientCount(selectedList.totalConsumers || selectedList._count?.listMembers || 0);
      } else {
        setRecipientCount(0);
      }
    } else {
      // Count all active consumers
      const consumers = mailingData.consumers?.consumers || [];
      setRecipientCount(consumers.length);
    }
  };

  const saveCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject) {
      alert('Naam en onderwerp zijn verplicht');
      return;
    }

    if (!campaignForm.templateId) {
      alert('Selecteer een template');
      return;
    }

    if (!campaignForm.listId) {
      alert('Selecteer een maillijst');
      return;
    }

    setCampaignLoading(true);
    try {
      const url = '/api/admin/mailing/campaigns';
      const method = editingCampaign === 'new' ? 'POST' : 'PUT';
      const body = editingCampaign === 'new' 
        ? {
            ...campaignForm,
            scheduledAt: campaignForm.scheduledAt || null
          }
        : {
            ...campaignForm,
            id: editingCampaign,
            scheduledAt: campaignForm.scheduledAt || null
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingCampaign === 'new' ? 'Campagne aangemaakt!' : 'Campagne bijgewerkt!');
        closeCampaignEditor();
        fetchMailingData('campaigns');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Error saving campaign: ' + error.message);
    } finally {
      setCampaignLoading(false);
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!window.confirm('Weet je zeker dat je deze campagne wilt versturen?')) {
      return;
    }

    setCampaignLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/mailing/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send',
          id: campaignId
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'Campagne wordt verstuurd!');
        fetchMailingData('campaigns');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Error sending campaign: ' + error.message);
    } finally {
      setCampaignLoading(false);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!window.confirm('Weet je zeker dat je deze campagne wilt verwijderen?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/mailing/campaigns?id=${campaignId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Campagne verwijderd!');
        fetchMailingData('campaigns');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign: ' + error.message);
    }
  };

  const renderCampaignsContent = () => {
    const campaigns = mailingData.campaigns?.campaigns || [];
    const pagination = mailingData.campaigns?.pagination;
    const templates = mailingData.templates || [];
    const lists = mailingData.lists || [];

    // If editing, show editor
    if (editingCampaign) {
      const selectedTemplate = templates.find(t => t.id === campaignForm.templateId);
      const selectedList = lists.find(l => l.id === campaignForm.listId);

      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingCampaign === 'new' ? 'Nieuwe Campagne' : 'Campagne Bewerken'}</h3>
            <button 
              className="admin-button-secondary"
              onClick={closeCampaignEditor}
            >
              Annuleren
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left Column: Form */}
            <div>
              <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Campagne Naam *
                  </label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => {
                      setCampaignForm({ ...campaignForm, name: e.target.value });
                      updateCampaignPreview();
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="Bijv: Weekly Newsletter"
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Onderwerp *
                  </label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => {
                      setCampaignForm({ ...campaignForm, subject: e.target.value });
                      updateCampaignPreview();
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="Email onderwerp"
                  />
                  {selectedTemplate && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Template onderwerp: {selectedTemplate.subject}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Template *
                  </label>
                  <select
                    value={campaignForm.templateId}
                    onChange={(e) => {
                      setCampaignForm({ ...campaignForm, templateId: e.target.value });
                      const template = templates.find(t => t.id === e.target.value);
                      if (template && !campaignForm.subject) {
                        setCampaignForm(prev => ({ ...prev, subject: template.subject }));
                      }
                      updateCampaignPreview();
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Selecteer template</option>
                    {templates.filter(t => t.isActive).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Maillijst *
                  </label>
                  <select
                    value={campaignForm.listId}
                    onChange={(e) => {
                      setCampaignForm({ ...campaignForm, listId: e.target.value });
                      updateCampaignPreview();
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Selecteer maillijst</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.totalConsumers || list._count?.listMembers || 0} leden)
                      </option>
                    ))}
                  </select>
                  {recipientCount > 0 && (
                    <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '5px', fontWeight: 'bold' }}>
                      📧 {recipientCount} ontvangers
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Geplande Verzendtijd (Optioneel)
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledAt}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Laat leeg om direct te versturen na opslaan
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-button-primary"
                  onClick={saveCampaign}
                  disabled={campaignLoading}
                >
                  {campaignLoading ? 'Opslaan...' : editingCampaign === 'new' ? 'Campagne Opslaan' : 'Campagne Bijwerken'}
                </button>
                {editingCampaign !== 'new' && (
                  <button
                    className="admin-button-secondary"
                    onClick={() => sendCampaign(editingCampaign)}
                    disabled={campaignLoading || campaignForm.status === 'sending' || campaignForm.status === 'sent'}
                    style={{ backgroundColor: '#4caf50', color: 'white' }}
                  >
                    📧 Versturen
                  </button>
                )}
                <button
                  className="admin-button-secondary"
                  onClick={closeCampaignEditor}
                  disabled={campaignLoading}
                >
                  Annuleren
                </button>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div>
              <h4 style={{ marginBottom: '15px' }}>Preview</h4>
              {selectedTemplate ? (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: 'white',
                  minHeight: '400px'
                }}>
                  <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>Onderwerp:</strong> {campaignForm.subject || selectedTemplate.subject || '(geen onderwerp)'}
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ __html: campaignPreview || '<p style="color: #999;">Selecteer een template om preview te zien</p>' }}
                    style={{ 
                      lineHeight: '1.6',
                      color: '#333'
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: '#f5f5f5',
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  Selecteer een template om preview te zien
                </div>
              )}
              {selectedList && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '6px', fontSize: '12px' }}>
                  📋 <strong>Geselecteerde lijst:</strong> {selectedList.name}<br/>
                  👥 <strong>Leden:</strong> {selectedList.totalConsumers || selectedList._count?.listMembers || 0}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show campaign list
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Email Campagnes</h3>
          <button 
            className="admin-button-primary"
            onClick={() => {
              // Ensure templates and lists are loaded
              if (!mailingData.templates) fetchMailingData('templates');
              if (!mailingData.lists) fetchMailingData('lists');
              openCampaignEditor();
            }}
          >
            + Nieuwe Campagne
          </button>
        </div>

        {pagination && (
          <div style={{ marginBottom: '15px', color: '#666' }}>
            Totaal: {pagination.total} campagnes
          </div>
        )}

        {campaigns.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Onderwerp</th>
                  <th>Status</th>
                  <th>Template</th>
                  <th>Ontvangers</th>
                  <th>Verstuurd</th>
                  <th>Geopend</th>
                  <th>Geklikt</th>
                  <th>Gebounced</th>
                  <th>Datum</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const listId = campaign.filterCriteria?.listId;
                  const list = lists.find(l => l.id === listId);
                  
                  return (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>{campaign.subject}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 
                            campaign.status === 'sent' ? '#4caf50' :
                            campaign.status === 'sending' ? '#ff9800' :
                            campaign.status === 'scheduled' ? '#2196f3' :
                            '#e0e0e0',
                          color: campaign.status === 'draft' ? '#666' : 'white'
                        }}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>{campaign.template?.name || '-'}</td>
                      <td>
                        {campaign.totalRecipients || 0}
                        {list && <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>({list.name})</span>}
                      </td>
                      <td>{campaign.totalSent}</td>
                      <td>{campaign.totalOpened}</td>
                      <td>{campaign.totalClicked}</td>
                      <td>{campaign.totalBounced}</td>
                      <td>{new Date(campaign.createdAt).toLocaleDateString('nl-NL')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="admin-button-small"
                            onClick={() => {
                              if (!mailingData.templates) fetchMailingData('templates');
                              if (!mailingData.lists) fetchMailingData('lists');
                              openCampaignEditor(campaign);
                            }}
                          >
                            Bewerken
                          </button>
                          {campaign.status === 'draft' && (
                            <button 
                              className="admin-button-small"
                              onClick={() => sendCampaign(campaign.id)}
                              style={{ backgroundColor: '#4caf50', color: 'white' }}
                            >
                              Versturen
                            </button>
                          )}
                          <button 
                            className="admin-button-small"
                            onClick={() => deleteCampaign(campaign.id)}
                            style={{ backgroundColor: '#f44336', color: 'white' }}
                          >
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen campagnes gevonden. Klik op "Nieuwe Campagne" om er een aan te maken.
          </div>
        )}
      </div>
    );
  };

  const renderBouncesContent = () => {
    const bounces = mailingData.bounces?.bounces || [];
    const statistics = mailingData.bounces?.statistics;
    const pagination = mailingData.bounces?.pagination;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Email Bounces</h3>
          <button className="admin-button-secondary">Cleanup Oude Bounces</button>
        </div>

        {statistics && (
          <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <h3>Totaal Bounces</h3>
              <p className="stat-number">{statistics.total}</p>
            </div>
            <div className="stat-card">
              <h3>Hard Bounces</h3>
              <p className="stat-number">{statistics.hard}</p>
            </div>
            <div className="stat-card">
              <h3>Soft Bounces</h3>
              <p className="stat-number">{statistics.soft}</p>
            </div>
          </div>
        )}

        {pagination && (
          <div style={{ marginBottom: '15px', color: '#666' }}>
            Totaal: {pagination.total} bounces
          </div>
        )}

        {bounces.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Naam</th>
                  <th>Campagne</th>
                  <th>Type</th>
                  <th>Reden</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {bounces.map((bounce) => (
                  <tr key={bounce.id}>
                    <td>{bounce.consumer?.email || '-'}</td>
                    <td>{bounce.consumer ? `${bounce.consumer.firstName} ${bounce.consumer.lastName}` : '-'}</td>
                    <td>{bounce.campaign?.name || '-'}</td>
                    <td>
                      <span style={{ 
                        color: bounce.bounceType === 'hard' ? 'red' : 'orange',
                        fontWeight: 'bold'
                      }}>
                        {bounce.bounceType || '-'}
                      </span>
                    </td>
                    <td>{bounce.bounceReason || '-'}</td>
                    <td>{new Date(bounce.occurredAt).toLocaleDateString('nl-NL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Geen bounces gevonden
          </div>
        )}
      </div>
    );
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
          <button 
            className={`admin-nav-button ${activeSection === 'mailing' ? 'active' : ''}`}
            onClick={() => setActiveSection('mailing')}
          >
            Mailing
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

