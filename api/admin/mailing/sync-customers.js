const { PrismaClient } = require('@prisma/client');
const { makeRequest } = require('../../seller-admin/helpers');
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
    // First, get total count
    console.log('[Sync Customers] Fetching first page to get total count...');
    const firstPageData = await makeRequest('/customers/search', {
      'searchCriteria[pageSize]': 1,
      'searchCriteria[currentPage]': 1
    });

    const totalCount = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalCount / batchSize);
    
    syncStatus.progress.total = totalCount;
    syncStatus.progress.totalPages = totalPages;

    console.log(`[Sync Customers] Found ${totalCount} customers, ${totalPages} pages to process`);

    // Process pages
    const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages;
    
    for (let page = 1; page <= pagesToProcess; page++) {
      try {
        syncStatus.progress.currentPage = page;
        console.log(`[Sync Customers] Processing page ${page}/${pagesToProcess}...`);

        // Fetch customers for this page
        const data = await makeRequest('/customers/search', {
          'searchCriteria[pageSize]': batchSize,
          'searchCriteria[currentPage]': page
        });

        const customers = data.items || [];
        
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

