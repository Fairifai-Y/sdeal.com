const prisma = require('../../lib/prisma');
const { makeRequest: makeMagentoRequest } = require('../../magento/helpers');
const { makeRequest: makeSellerAdminRequest } = require('../../seller-admin/helpers');
const crypto = require('crypto');

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

  // Get existing consumers in batch (limit to prevent connection pool issues)
  // Process in smaller chunks if needed
  const chunkSize = 50; // Smaller chunks to avoid connection pool exhaustion
  const existingEmails = new Set();
  const existingMap = new Map();
  
  for (let i = 0; i < emails.length; i += chunkSize) {
    const emailChunk = emails.slice(i, i + chunkSize);
    try {
      const existingConsumers = await prisma.consumer.findMany({
        where: {
          email: { in: emailChunk }
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
      
      existingConsumers.forEach(c => {
        existingEmails.add(c.email);
        existingMap.set(c.email, c);
      });
    } catch (error) {
      console.error(`[Sync Customers] Error fetching existing consumers chunk ${i}-${i + chunkSize}:`, error.message);
      // Continue with next chunk
    }
  }


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
      const store = storeMapping[websiteId] || customer.store || 'NL'; // Default to NL
      
      // Extract name - support both camelCase and lowercase field names
      const firstName = customer.firstname || customer.firstName || '';
      const lastName = customer.lastname || customer.lastName || '';

      if (existingEmails.has(email)) {
        // Prepare for update
        const existing = existingMap.get(email);
        toUpdate.push({
          email,
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          store: store || existing.store,
          country: customer.country_id || customer.country || existing.country,
          phone: customer.telephone || customer.phone || existing.phone
        });
      } else {
        // Prepare for create
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        toCreate.push({
          firstName,
          lastName,
          email,
          store,
          country: customer.country_id || customer.country || store,
          phone: customer.telephone || customer.phone,
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
    console.log(`[Sync Customers] Creating ${toCreate.length} new consumers...`);
    try {
      // Use createMany for better performance
      const createResult = await prisma.consumer.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      results.created = createResult.count;
      console.log(`[Sync Customers] ✅ Successfully created ${createResult.count} consumers`);
    } catch (error) {
      console.error(`[Sync Customers] Error bulk creating ${toCreate.length} consumers:`, error.message);
      console.error(`[Sync Customers] Error details:`, error);
      // Fallback to individual creates with retry
      console.log(`[Sync Customers] Falling back to individual creates with retry...`);
      for (const data of toCreate) {
        let retries = 3;
        let success = false;
        
        while (retries > 0 && !success) {
          try {
            await prisma.consumer.create({ data });
            results.created++;
            success = true;
          } catch (createError) {
            retries--;
            const isConnectionError = createError.message.includes("Can't reach database") || 
                                    createError.message.includes("connection") ||
                                    createError.code === 'P1001';
            
            if (isConnectionError && retries > 0) {
              console.warn(`[Sync Customers] Database connection error for ${data.email}, retrying... (${retries} retries left)`);
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
            } else {
              console.error(`[Sync Customers] Error creating consumer ${data.email}:`, createError.message);
              results.errors.push({
                customer: data.email,
                error: createError.message
              });
              success = true; // Stop retrying
            }
          }
        }
      }
      console.log(`[Sync Customers] Individual creates completed: ${results.created} created`);
    }
  } else {
    console.log(`[Sync Customers] No new consumers to create`);
  }

  // Bulk update existing consumers
  // Do updates sequentially to avoid connection pool exhaustion
  if (toUpdate.length > 0) {
    console.log(`[Sync Customers] Updating ${toUpdate.length} existing consumers sequentially...`);
    for (const data of toUpdate) {
      try {
        await prisma.consumer.update({
          where: { email: data.email },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            store: data.store,
            country: data.country,
            phone: data.phone,
            updatedAt: new Date()
          }
        });
        results.updated++;
      } catch (error) {
        console.error(`[Sync Customers] Error updating consumer ${data.email}:`, error.message);
        results.errors.push({
          customer: data.email,
          error: error.message
        });
      }
    }
    console.log(`[Sync Customers] ✅ Successfully updated ${results.updated} consumers`);
  } else {
    console.log(`[Sync Customers] No existing consumers to update`);
  }

  return results;
}

/**
 * Sync customers from orders (fallback method)
 */
async function syncCustomersFromOrders(storeMapping = {}, batchSize = 100, delayBetweenBatches = 1000, maxPages = null) {
  console.log('[Sync Customers] Using orders-based sync (standard Magento API - NO admin token)...');
  
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
    const maxPagesLimit = maxPages || 1000; // Limit to prevent infinite loops (or use provided limit)

    while (hasMore && page <= maxPagesLimit) {
      try {
        syncStatus.progress.currentPage = page;
        console.log(`[Sync Customers] Fetching orders page ${page} to extract customers...`);

        // Use STANDARD Magento API for orders (NO admin token - uses Bearer token if configured)
        // This is the standard Magento REST API, not the Seller Admin API
        const ordersData = await makeMagentoRequest('/orders', {
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
          console.log(`[Sync Customers] First order sample:`, JSON.stringify(orders[0], null, 2).substring(0, 1000));
          
          // Also log a few more orders to see if structure varies
          if (orders.length > 1) {
            console.log(`[Sync Customers] Second order keys:`, Object.keys(orders[1]));
          }
          if (orders.length > 2) {
            console.log(`[Sync Customers] Third order keys:`, Object.keys(orders[2]));
          }
        }

        // Extract customer info from orders
        // Note: /supplier/orders/ might not have customer_email in list, need to check order details
        let customersFoundInPage = 0;
        let skippedNoEmail = 0;
        
        for (const order of orders) {
          // Try different field names for customer email from order list
          // Check all possible locations where email might be stored
          let email = order.customer_email || 
                     order.customerEmail || 
                     order.email ||
                     order.customer_email_address ||
                     (order.extension_attributes?.customer_email) ||
                     (order.billing_address?.email) ||
                     (order.shipping_address?.email) ||
                     (order.address?.email) ||
                     order.customer_name; // Sometimes email is in customer_name
          
          // If no email in list, try to get from order details (but this is slow for 75k orders)
          // For now, skip orders without email in the list
          if (!email || !email.includes('@')) {
            // Try to extract from customer_name if it looks like an email
            if (order.customer_name && order.customer_name.includes('@')) {
              email = order.customer_name;
            } else {
              // Log missing email for first few orders to debug
              if (skippedNoEmail < 3 && page <= 2) {
                console.log(`[Sync Customers] Order ${order.id || order.entity_id || 'unknown'} has no email. Available fields:`, Object.keys(order).filter(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('customer') || k.toLowerCase().includes('name')));
              }
              skippedNoEmail++;
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
              const customerData = {
                email,
                firstname: firstName || '', // Note: using 'firstname' (lowercase) to match Magento API format
                lastname: lastName || '',   // Note: using 'lastname' (lowercase) to match Magento API format
                store,
                country_id: order.shipping_countryid || order.country_id || order.shipping_country || store,
                telephone: order.customer_phone || order.telephone || order.phone || null,
                website_id: storeId || 1
              };
              uniqueCustomers.set(email, customerData);
              customersFoundInPage++;
              
              // Log first few customers for debugging
              if (customersFoundInPage <= 3) {
                console.log(`[Sync Customers] Sample customer ${customersFoundInPage}:`, customerData);
              }
            }
          }
        }
        
        console.log(`[Sync Customers] Page ${page}: Extracted ${customersFoundInPage} new customers from ${orders.length} orders (${skippedNoEmail} skipped - no email)`);

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

    // Process all unique customers in smaller batches to avoid connection pool exhaustion
    const customersArray = Array.from(uniqueCustomers.values());
    syncStatus.progress.total = customersArray.length;
    syncStatus.progress.totalPages = 1;

    console.log(`[Sync Customers] Processing ${customersArray.length} unique customers from orders in smaller batches...`);
    
    // Process in smaller batches (50 at a time) to avoid connection pool issues
    const processingBatchSize = 50;
    let totalCreated = 0;
    let totalUpdated = 0;
    const allErrors = [];
    
    for (let i = 0; i < customersArray.length; i += processingBatchSize) {
      const batch = customersArray.slice(i, i + processingBatchSize);
      console.log(`[Sync Customers] Processing batch ${Math.floor(i / processingBatchSize) + 1}/${Math.ceil(customersArray.length / processingBatchSize)} (${batch.length} customers)...`);
      
      const batchResults = await processBatch(batch, storeMapping);
      totalCreated += batchResults.created;
      totalUpdated += batchResults.updated;
      allErrors.push(...batchResults.errors);
      
      // Small delay between batches to let connection pool recover
      if (i + processingBatchSize < customersArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const batchResults = {
      created: totalCreated,
      updated: totalUpdated,
      errors: allErrors
    };

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
    // Skip customer endpoints - they don't work reliably (timeouts, 404s, 400s)
    // Use orders-based sync directly (this works and is more reliable)
    console.log('[Sync Customers] Using orders-based sync method (standard Magento API)...');
    console.log('[Sync Customers] Note: Extracting customers from order data using standard Magento REST API (no admin token needed).');
    return await syncCustomersFromOrders(storeMapping, batchSize, delayBetweenBatches, maxPages);

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
      // Use orders-based sync as fallback (uses standard Magento API - NO admin token)
      console.log('[Sync Customers] Customer endpoint returned 0 results. Switching to orders-based sync (standard Magento API)...');
      return await syncCustomersFromOrders(storeMapping, batchSize, delayBetweenBatches, maxPages);
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
        storeMapping = {},
        testMode = false // Test mode: max 100 orders
      } = req.body;

      // In test mode, limit to 1 page (100 orders max)
      const finalMaxPages = testMode ? 1 : (maxPages ? parseInt(maxPages) : null);
      const finalBatchSize = testMode ? 100 : parseInt(batchSize);

      console.log(`[Sync Customers] Starting sync (testMode: ${testMode}, maxPages: ${finalMaxPages}, batchSize: ${finalBatchSize})`);

      // Start sync in background (don't await)
      syncCustomersFromMagento({
        batchSize: finalBatchSize,
        maxPages: finalMaxPages,
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

