const { PrismaClient } = require('@prisma/client');
const { makeRequest } = require('../seller-admin/helpers');
const { requireAuth } = require('./auth');

// Use a singleton pattern for Prisma Client in serverless functions
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = async (req, res) => {
  // Require authentication for all admin endpoints
  if (!requireAuth(req, res)) {
    return; // Error response already sent
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Simple in-memory cache (5 minutes TTL)
    const cacheTTL = 5 * 60 * 1000; // 5 minutes
    const cache = global.apiCache || {};
    const now = Date.now();
    
    // 1. Get total balance sellers (all sellers with balance record)
    let totalBalanceSellers = 0;
    const balanceCacheKey = 'api_balance_sellers';
    
    if (cache[balanceCacheKey] && (now - cache[balanceCacheKey].timestamp) < cacheTTL) {
      totalBalanceSellers = cache[balanceCacheKey].value;
      console.log('[Overview] Using cached balance sellers:', totalBalanceSellers);
    } else {
      try {
        const balanceData = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
          'searchCriteria[pageSize]': 1000,
          'searchCriteria[currentPage]': 1
        });
        
        if (balanceData && balanceData.items && balanceData.items.length > 0) {
          const uniqueSupplierIds = new Set();
          balanceData.items.forEach(item => {
            if (item.supplier_id) {
              uniqueSupplierIds.add(String(item.supplier_id));
            }
          });
          
          // Fetch additional pages if needed
          if (balanceData.items.length === 1000 && balanceData.total_count > 1000) {
            const totalPages = Math.ceil(balanceData.total_count / 1000);
            for (let page = 2; page <= Math.min(totalPages, 5); page++) {
              try {
                const pageData = await makeRequest('/sportdeal-balancemanagement/balance/search/', {
                  'searchCriteria[pageSize]': 1000,
                  'searchCriteria[currentPage]': page
                });
                if (pageData && pageData.items) {
                  pageData.items.forEach(item => {
                    if (item.supplier_id) {
                      uniqueSupplierIds.add(String(item.supplier_id));
                    }
                  });
                }
              } catch (pageError) {
                console.warn(`[Overview] Failed to fetch balance page ${page}:`, pageError.message);
                break;
              }
            }
          }
          
          totalBalanceSellers = uniqueSupplierIds.size;
          cache[balanceCacheKey] = { value: totalBalanceSellers, timestamp: now };
          global.apiCache = cache;
          console.log('[Overview] Fetched balance sellers (cached):', totalBalanceSellers);
        }
      } catch (balanceError) {
        console.error('Error fetching balance sellers:', balanceError);
        if (cache[balanceCacheKey]) {
          totalBalanceSellers = cache[balanceCacheKey].value;
        }
      }
    }
    
    // 2. Get sellers with orders (unique suppliers from orders)
    let sellersWithOrders = 0;
    let fetchedOrdersCount = 0; // Count of orders actually fetched and processed
    const ordersCacheKey = 'api_sellers_with_orders';
    const ordersCountCacheKey = 'api_fetched_orders_count';
    
    if (cache[ordersCacheKey] && cache[ordersCountCacheKey] && (now - cache[ordersCacheKey].timestamp) < cacheTTL) {
      sellersWithOrders = cache[ordersCacheKey].value;
      fetchedOrdersCount = cache[ordersCountCacheKey].value;
      console.log('[Overview] Using cached sellers with orders:', sellersWithOrders, 'from', fetchedOrdersCount, 'fetched orders');
    } else {
      try {
        const ordersData = await makeRequest('/supplier/orders/', {
          'searchCriteria[pageSize]': 1000,
          'searchCriteria[currentPage]': 1
        });
        
        if (ordersData && ordersData.items && ordersData.items.length > 0) {
          const uniqueSupplierIds = new Set();
          fetchedOrdersCount = ordersData.items.length; // Start with first page
          
          ordersData.items.forEach(order => {
            if (order.supplier_id) {
              uniqueSupplierIds.add(String(order.supplier_id));
            }
          });
          
          // Fetch additional pages if needed (max 5 pages = 5000 orders)
          if (ordersData.items.length === 1000 && ordersData.total_count > 1000) {
            const totalPages = Math.ceil(ordersData.total_count / 1000);
            for (let page = 2; page <= Math.min(totalPages, 5); page++) {
              try {
                const pageData = await makeRequest('/supplier/orders/', {
                  'searchCriteria[pageSize]': 1000,
                  'searchCriteria[currentPage]': page
                });
                if (pageData && pageData.items) {
                  fetchedOrdersCount += pageData.items.length; // Count actual fetched orders
                  pageData.items.forEach(order => {
                    if (order.supplier_id) {
                      uniqueSupplierIds.add(String(order.supplier_id));
                    }
                  });
                }
              } catch (pageError) {
                console.warn(`[Overview] Failed to fetch orders page ${page}:`, pageError.message);
                break;
              }
            }
          }
          
          sellersWithOrders = uniqueSupplierIds.size;
          cache[ordersCacheKey] = { value: sellersWithOrders, timestamp: now };
          cache[ordersCountCacheKey] = { value: fetchedOrdersCount, timestamp: now };
          global.apiCache = cache;
          console.log('[Overview] Fetched sellers with orders (cached):', sellersWithOrders, 'from', fetchedOrdersCount, 'fetched orders');
        }
      } catch (ordersError) {
        console.error('Error fetching sellers with orders:', ordersError);
        if (cache[ordersCacheKey]) {
          sellersWithOrders = cache[ordersCacheKey].value;
        }
        if (cache[ordersCountCacheKey]) {
          fetchedOrdersCount = cache[ordersCountCacheKey].value;
        }
      }
    }

    // Get all package selections (New Model customers from database)
    const allSelections = await prisma.packageSelection.findMany({
      select: {
        id: true,
        package: true,
        billingPeriod: true,
        isNewCustomer: true,
        mollieMandateId: true,
        createdAt: true
      }
    });

    // Calculate statistics for New Model customers (from database)
    const newModelCustomers = allSelections.length;
    const newCustomers = allSelections.filter(s => s.isNewCustomer).length;
    const existingCustomers = newModelCustomers - newCustomers;
    const withRecurring = allSelections.filter(s => s.mollieMandateId !== null).length;

    // Stats by package
    const statsByPackage = {
      A: allSelections.filter(s => s.package === 'A').length,
      B: allSelections.filter(s => s.package === 'B').length,
      C: allSelections.filter(s => s.package === 'C').length
    };

    // Stats by billing period
    const statsByBilling = {
      monthly: allSelections.filter(s => s.billingPeriod === 'monthly').length,
      yearly: allSelections.filter(s => s.billingPeriod === 'yearly').length
    };

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = allSelections.filter(s => 
      new Date(s.createdAt) >= sevenDaysAgo
    ).length;

    res.json({
      success: true,
      data: {
        // Three main seller counts
        totalBalanceSellers, // Sellers with balance record (from balance endpoint)
        sellersWithOrders, // Sellers that have had orders (from orders endpoint)
        fetchedOrdersCount, // Number of orders actually fetched and processed to calculate sellersWithOrders
        newModelCustomers, // Sellers from database (New Model)
        
        // Legacy fields (kept for backwards compatibility)
        totalCustomers: totalBalanceSellers || sellersWithOrders || newModelCustomers,
        totalCustomersFromAPI: totalBalanceSellers || sellersWithOrders,
        
        // New Model customer statistics
        newCustomers,
        existingCustomers,
        withRecurring,
        statsByPackage,
        statsByBilling,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

