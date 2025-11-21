const { PrismaClient } = require('@prisma/client');
const { makeRequest: makeMagentoRequest } = require('../../magento/helpers');
const { makeRequest: makeSellerAdminRequest } = require('../../seller-admin/helpers');
const crypto = require('crypto');

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// In-memory sync status (in production, use Redis or database)
const syncStatus = {
  isRunning: false,
  progress: {
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    currentPage: 0,
    totalPages: 0
  },
  errors: [],
  startedAt: null,
  completedAt: null
};

/**
 * Process a batch of customers (optimized with createMany)
 */
async function processBatch(customers, storeMapping = {}) {
  const results = {
    created: 0,
    updated: 0,
    errors: []
  };

  // Prepare data for bulk operations
  const toCreate = [];
  const toUpdate = [];
  const emails = customers.map(c => c.email).filter(Boolean);

  // Get existing consumers in batch
  const existingConsumers = await prisma.consumer.findMany({
    where: {
      email: { in: emails }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      store: true,
      country: true,
      phone: true
    }
  });

  const existingEmails = new Set(existingConsumers.map(c => c.email));
  const existingMap = new Map(existingConsumers.map(c => [c.email, c]));

  // Process each customer
  for (const customer of customers) {
    try {
      const email = customer.email;
      if (!email) {
        results.errors.push({ customer: 'unknown', error: 'Missing email' });
        continue;
      }

      // Determine store from website_id or default
      const websiteId = customer.website_id || 1;
      const store = storeMapping[websiteId] || 'NL'; // Default to NL
      
      // Extract name
      const firstName = customer.firstname || '';
      const lastName = customer.lastname || '';

      if (existingEmails.has(email)) {
        // Prepare for update
        const existing = existingMap.get(email);
        toUpdate.push({
          email,
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          store: store || existing.store,
          country: customer.country_id || existing.country,
          phone: customer.telephone || existing.phone
        });
      } else {
        // Prepare for create
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        toCreate.push({
          firstName,
          lastName,
          email,
          store,
          country: customer.country_id || store,
          phone: customer.telephone,
          source: 'magento_sync',
          sourceUrl: null,
          unsubscribeToken,
          preferences: customer.custom_attributes ? 
            JSON.parse(JSON.stringify(customer.custom_attributes)) : null
        });
      }
    } catch (error) {
      console.error(`[Sync Customers] Error preparing customer ${customer.email}:`, error);
      results.errors.push({
        customer: customer.email || 'unknown',
        error: error.message
      });
    }
  }

  // Bulk create new consumers
  if (toCreate.length > 0) {
    try {
      // Use createMany for better performance
      const createResult = await prisma.consumer.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      results.created = createResult.count;
    } catch (error) {
      console.error(`[Sync Customers] Error bulk creating ${toCreate.length} consumers:`, error);
      // Fallback to individual creates
      for (const data of toCreate) {
        try {
          await prisma.consumer.create({ data });
          results.created++;
        } catch (createError) {
          results.errors.push({
            customer: data.email,
            error: createError.message
          });
        }
      }
    }
  }

  // Bulk update existing consumers
  if (toUpdate.length > 0) {
    // Prisma doesn't have updateMany with different values, so we update individually
    // But we can use Promise.all for parallel updates
    const updatePromises = toUpdate.map(data => 
      prisma.consumer.update({
        where: { email: data.email },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          store: data.store,
          country: data.country,
          phone: data.phone,
          updatedAt: new Date()
        }
      }).catch(error => {
        results.errors.push({
          customer: data.email,
          error: error.message
        });
        return null;
      })
    );

    const updateResults = await Promise.all(updatePromises);
    results.updated = updateResults.filter(r => r !== null).length;
  }

  return results;
}

/**
 * Sync customers from orders (fallback method)
 */
async function syncCustomersFromOrders(storeMapping = {}, batchSize = 100, delayBetweenBatches = 1000) {
  console.log('[Sync Customers] Using orders-based sync as fallback...');
  
  syncStatus.isRunning = true;
  syncStatus.startedAt = new Date();
  syncStatus.progress = {
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    currentPage: 0,
    totalPages: 0
  };
  syncStatus.errors = [];

  try {
    // Get orders and extract unique customers
    const uniqueCustomers = new Map(); // email -> customer data
    let page = 1;
    let hasMore = true;
    const maxPages = 100; // Limit to prevent infinite loops

    while (hasMore && page <= maxPages) {
      try {
        syncStatus.progress.currentPage = page;
        console.log(`[Sync Customers] Fetching orders page ${page} to extract customers...`);

        // Use Seller Admin API for orders (this uses admin token)
        const ordersData = await makeSellerAdminRequest('/supplier/orders/', {
          'searchCriteria[pageSize]': batchSize,
          'searchCriteria[currentPage]': page
        });

        const orders = ordersData?.items || [];
        
        console.log(`[Sync Customers] Orders page ${page}: received ${orders.length} orders`);
        
        if (orders.length === 0) {
          console.log(`[Sync Customers] No more orders, stopping at page ${page}`);
          hasMore = false;
          break;
        }

        // Log first order structure to see what fields are available
        if (page === 1 && orders.length > 0) {
          console.log(`[Sync Customers] First order structure:`, Object.keys(orders[0]));
          console.log(`[Sync Customers] First order sample:`, JSON.stringify(orders[0], null, 2).substring(0, 500));
        }

        // Extract customer info from orders
        // Note: /supplier/orders/ might not have customer_email in list, need to check order details
        let customersFoundInPage = 0;
        for (const order of orders) {
          // Try different field names for customer email from order list
          let email = order.customer_email || order.customerEmail || 
                     (order.extension_attributes?.customer_email) ||
                     (order.billing_address?.email) ||
                     order.customer_name; // Sometimes email is in customer_name
          
          // If no email in list, try to get from order details (but this is slow for 75k orders)
          // For now, skip orders without email in the list
          if (!email || !email.includes('@')) {
            // Try to extract from customer_name if it looks like an email
            if (order.customer_name && order.customer_name.includes('@')) {
              email = order.customer_name;
            } else {
              // Skip this order - no email available
              continue;
            }
          }
          
          if (email && email.includes('@')) {
            // Extract name from order or use email prefix
            let firstName = order.customer_firstname || order.first_name || 
                          (order.billing_address?.firstname) || '';
            let lastName = order.customer_lastname || order.last_name || 
                         (order.billing_address?.lastname) || '';
            
            // If no name, try to extract from customer_name
            if (!firstName && !lastName && order.customer_name && !order.customer_name.includes('@')) {
              const nameParts = order.customer_name.trim().split(/\s+/);
              if (nameParts.length > 0) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ') || '';
              }
            }
            
            // Determine store from order
            // For /supplier/orders/, we might need to infer from supplier or use default
            const storeId = order.store_id || order.storeId || 1;
            const store = storeMapping[storeId] || 'NL';

            if (!uniqueCustomers.has(email)) {
              uniqueCustomers.set(email, {
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                store,
                country: order.shipping_countryid || order.country_id || order.shipping_country || store,
                phone: order.customer_phone || order.telephone || order.phone || null
              });
              customersFoundInPage++;
            }
          }
        }
        
        console.log(`[Sync Customers] Page ${page}: Extracted ${customersFoundInPage} new customers from ${orders.length} orders`);

        syncStatus.progress.processed += orders.length;
        console.log(`[Sync Customers] Page ${page}: Found ${uniqueCustomers.size} unique customers so far`);

        if (orders.length < batchSize) {
          hasMore = false;
        }

        page++;
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));

      } catch (pageError) {
        console.error(`[Sync Customers] Error processing orders page ${page}:`, pageError);
        syncStatus.errors.push({
          page,
          error: pageError.message
        });
        hasMore = false;
        break;
      }
    }

    // Process all unique customers
    const customersArray = Array.from(uniqueCustomers.values());
    syncStatus.progress.total = customersArray.length;
    syncStatus.progress.totalPages = 1;

    console.log(`[Sync Customers] Processing ${customersArray.length} unique customers from orders...`);
    const batchResults = await processBatch(customersArray, storeMapping);

    syncStatus.progress.created = batchResults.created;
    syncStatus.progress.updated = batchResults.updated;
    syncStatus.progress.errors += batchResults.errors.length;
    syncStatus.errors.push(...batchResults.errors);

    syncStatus.completedAt = new Date();
    console.log(`[Sync Customers] Orders-based sync completed: ${batchResults.created} created, ${batchResults.updated} updated`);

    return syncStatus.progress;

  } catch (error) {
    console.error('[Sync Customers] Fatal error in orders-based sync:', error);
    syncStatus.errors.push({
      fatal: true,
      error: error.message
    });
    throw error;
  } finally {
    syncStatus.isRunning = false;
  }
}

/**
 * Sync customers from Magento to database
 */
async function syncCustomersFromMagento(options = {}) {
  const {
    batchSize = 100,
    maxPages = null, // null = all pages
    delayBetweenBatches = 1000, // 1 second delay between batches
    storeMapping = {} // Map website_id to store code
  } = options;

  syncStatus.isRunning = true;
  syncStatus.startedAt = new Date();
  syncStatus.progress = {
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    currentPage: 0,
    totalPages: 0
  };
  syncStatus.errors = [];

  try {
    // Try different customer endpoints (like the working implementation)
    // Note: These endpoints might not be available with current credentials
    // We'll fallback to orders-based sync which is more reliable
    const endpointsToTry = [
      { endpoint: '/customers', params: { 'searchCriteria[pageSize]': 1, 'searchCriteria[currentPage]': 1 } },
      { endpoint: '/customers/search', params: { 'searchCriteria[pageSize]': 1, 'searchCriteria[currentPage]': 1 } }
    ];

    let firstPageData = null;
    let workingEndpoint = null;
    let lastError = null;

    console.log('[Sync Customers] Trying different customer endpoints...');
    
    for (const { endpoint, params } of endpointsToTry) {
      try {
        console.log(`[Sync Customers] Trying endpoint: ${endpoint}`);
        console.log(`[Sync Customers] Request params:`, params);
        
        // Add timeout wrapper (10 seconds - customers endpoint might not exist)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
        });
        
        // Use Magento API helper (NO admin token headers)
        const requestPromise = makeMagentoRequest(endpoint, params);
        firstPageData = await Promise.race([requestPromise, timeoutPromise]);
        
        // Log response details
        console.log(`[Sync Customers] ✅ Endpoint ${endpoint} returned data`);
        console.log(`[Sync Customers] Response type:`, typeof firstPageData);
        console.log(`[Sync Customers] Response is array:`, Array.isArray(firstPageData));
        console.log(`[Sync Customers] Response is null:`, firstPageData === null);
        console.log(`[Sync Customers] Response is undefined:`, firstPageData === undefined);
        
        if (firstPageData) {
          console.log(`[Sync Customers] Response keys:`, Object.keys(firstPageData));
          
          // Check if it's a valid response structure
          const hasItems = firstPageData.items !== undefined;
          const hasTotalCount = firstPageData.total_count !== undefined || firstPageData.totalCount !== undefined;
          const isArray = Array.isArray(firstPageData);
          
          console.log(`[Sync Customers] Response structure check:`, {
            hasItems,
            hasTotalCount,
            isArray,
            itemCount: hasItems ? (firstPageData.items?.length || 0) : (isArray ? firstPageData.length : 0)
          });
          
          // Log sample of response
          try {
            const sample = JSON.stringify(firstPageData, null, 2);
            console.log(`[Sync Customers] Response sample (first 1000 chars):`, sample.substring(0, 1000));
          } catch (stringifyError) {
            console.warn(`[Sync Customers] Could not stringify response:`, stringifyError.message);
          }
        } else {
          console.warn(`[Sync Customers] Endpoint ${endpoint} returned null/undefined`);
        }
        
        // If we got data (even if empty), consider it a working endpoint
        if (firstPageData !== null && firstPageData !== undefined) {
          workingEndpoint = endpoint;
          console.log(`[Sync Customers] ✅ Using endpoint: ${workingEndpoint}`);
          break;
        }
      } catch (error) {
        console.error(`[Sync Customers] ❌ Endpoint ${endpoint} failed:`, error.message);
        console.error(`[Sync Customers] Error stack:`, error.stack);
        if (error.details) {
          const detailsStr = typeof error.details === 'string' 
            ? error.details.substring(0, 500) 
            : JSON.stringify(error.details).substring(0, 500);
          console.error(`[Sync Customers] Error details:`, detailsStr);
        }
        if (error.status) {
          console.error(`[Sync Customers] HTTP status:`, error.status, error.statusText);
        }
        lastError = error;
        continue;
      }
    }

    if (!firstPageData || !workingEndpoint) {
      console.warn('[Sync Customers] All customer endpoints failed. Falling back to orders-based sync...');
      console.warn('[Sync Customers] Last error:', lastError?.message || 'Unknown error');
      if (lastError?.status) {
        console.warn('[Sync Customers] HTTP status:', lastError.status, lastError.statusText);
      }
      // Fallback to orders-based sync (this works because /supplier/orders/ endpoint is available)
      console.log('[Sync Customers] Switching to orders-based sync method...');
      return await syncCustomersFromOrders(storeMapping, batchSize, delayBetweenBatches);
    }

    // Check response structure - Magento might return different formats
    const totalCount = firstPageData?.total_count || firstPageData?.totalCount || 
                      (firstPageData?.items ? firstPageData.items.length : 0);
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / batchSize) : 0;
    
    syncStatus.progress.total = totalCount;
    syncStatus.progress.totalPages = totalPages;

    console.log(`[Sync Customers] Found ${totalCount} customers, ${totalPages} pages to process using endpoint: ${workingEndpoint}`);
    
    if (totalCount === 0) {
      console.warn('[Sync Customers] No customers found via customer endpoint. Response structure:', Object.keys(firstPageData || {}));
      console.warn('[Sync Customers] Full response:', JSON.stringify(firstPageData, null, 2));
      
      // If no customers found, the endpoint might not be available or requires different permissions
      // Use orders-based sync as fallback (this is more reliable since /supplier/orders/ works)
      console.log('[Sync Customers] Customer endpoint returned 0 results. Switching to orders-based sync...');
      return await syncCustomersFromOrders(storeMapping, batchSize, delayBetweenBatches);
    }

    // Store workingEndpoint for use in the loop
    const endpointToUse = workingEndpoint;
    
    // Process pages
    const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages;
    
    for (let page = 1; page <= pagesToProcess; page++) {
      try {
        syncStatus.progress.currentPage = page;
        console.log(`[Sync Customers] Processing page ${page}/${pagesToProcess}...`);

        // Fetch customers for this page using Magento API (NO admin token)
        let data;
        try {
          data = await makeMagentoRequest(endpointToUse, {
            'searchCriteria[pageSize]': batchSize,
            'searchCriteria[currentPage]': page
          });
          
          // Log response structure for debugging
          if (page === 1) {
            console.log('[Sync Customers] Page 1 response keys:', Object.keys(data || {}));
            console.log('[Sync Customers] Page 1 response sample:', JSON.stringify(data, null, 2).substring(0, 1000));
          }
        } catch (error) {
          console.error(`[Sync Customers] Error fetching page ${page}:`, error);
          console.error(`[Sync Customers] Error details:`, error.details);
          throw error;
        }

        // Handle different response structures
        const customers = data?.items || data?.data || data || [];
        
        if (customers.length === 0) {
          console.log(`[Sync Customers] No customers on page ${page}, stopping`);
          break;
        }

        // Process batch
        const batchResults = await processBatch(customers, storeMapping);
        
        // Update progress
        syncStatus.progress.processed += customers.length;
        syncStatus.progress.created += batchResults.created;
        syncStatus.progress.updated += batchResults.updated;
        syncStatus.progress.errors += batchResults.errors.length;
        syncStatus.errors.push(...batchResults.errors);

        console.log(`[Sync Customers] Page ${page} completed: ${batchResults.created} created, ${batchResults.updated} updated, ${batchResults.errors.length} errors`);

        // Delay between batches to avoid rate limiting
        if (page < pagesToProcess && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }

      } catch (pageError) {
        console.error(`[Sync Customers] Error processing page ${page}:`, pageError);
        syncStatus.errors.push({
          page,
          error: pageError.message
        });
        syncStatus.progress.errors++;
        
        // Continue with next page
        continue;
      }
    }

    syncStatus.completedAt = new Date();
    console.log(`[Sync Customers] Sync completed: ${syncStatus.progress.created} created, ${syncStatus.progress.updated} updated, ${syncStatus.progress.errors} errors`);

  } catch (error) {
    console.error('[Sync Customers] Fatal error:', error);
    syncStatus.errors.push({
      fatal: true,
      error: error.message
    });
    throw error;
  } finally {
    syncStatus.isRunning = false;
  }

  return syncStatus.progress;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get sync status
    if (req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          ...syncStatus,
          duration: syncStatus.startedAt ? 
            (syncStatus.completedAt || new Date()) - syncStatus.startedAt : null
        }
      });
    }

    // POST - Start sync
    if (req.method === 'POST') {
      if (syncStatus.isRunning) {
        return res.status(400).json({
          success: false,
          error: 'Sync is already running'
        });
      }

      const {
        batchSize = 100,
        maxPages = null,
        delayBetweenBatches = 1000,
        storeMapping = {}
      } = req.body;

      // Start sync in background (don't await)
      syncCustomersFromMagento({
        batchSize: parseInt(batchSize),
        maxPages: maxPages ? parseInt(maxPages) : null,
        delayBetweenBatches: parseInt(delayBetweenBatches),
        storeMapping
      }).catch(error => {
        console.error('[Sync Customers] Background sync error:', error);
      });

      return res.json({
        success: true,
        message: 'Sync started',
        data: {
          status: 'started',
          estimatedTime: syncStatus.progress.totalPages ? 
            `${Math.ceil(syncStatus.progress.totalPages * delayBetweenBatches / 1000 / 60)} minutes` : 
            'calculating...'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('[Sync Customers API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

