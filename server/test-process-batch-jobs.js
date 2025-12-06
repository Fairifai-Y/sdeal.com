require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { processPendingBatchJobs } = require('../api/admin/mailing/process-batch-jobs');

async function testProcessBatchJobs() {
  console.log('🧪 Testing batch creation job processing...\n');

  try {
    // Import the function directly (it's not exported, so we need to call it via the module)
    const prisma = require('../api/lib/prisma-with-retry');
    
    // Get pending jobs
    const jobs = await prisma.batchCreationJob.findMany({
      where: {
        status: { in: ['pending', 'processing'] },
        OR: [
          { nextProcessAt: null },
          { nextProcessAt: { lte: new Date() } }
        ]
      },
      orderBy: [{ createdAt: 'asc' }],
      take: 1,
      include: {
        campaign: {
          select: {
            id: true,
            status: true,
            name: true
          }
        }
      }
    });

    console.log(`📦 Found ${jobs.length} job(s) to process\n`);

    if (jobs.length === 0) {
      console.log('✅ No pending jobs found');
      await prisma.$disconnect();
      return;
    }

    // Manually call the processing function
    // We need to import the internal function
    const fs = require('fs');
    const path = require('path');
    const processBatchJobsPath = path.join(__dirname, '..', 'api', 'admin', 'mailing', 'process-batch-jobs.js');
    const processBatchJobsCode = fs.readFileSync(processBatchJobsPath, 'utf8');
    
    // Instead, let's make a direct HTTP request to the endpoint
    console.log('📤 Making request to process-batch-jobs endpoint...\n');
    
    const http = require('http');
    const url = require('url');
    
    // For local testing, we'll call the function directly by requiring it
    // But first, let's check if we can import the internal function
    
    // Actually, let's just manually trigger the processing logic
    const sgMail = require('@sendgrid/mail');
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    // Import helper functions from the file
    const batchJobsModule = require('../api/admin/mailing/process-batch-jobs');
    const processPendingBatchJobs = batchJobsModule.processPendingBatchJobs;
    
    if (!processPendingBatchJobs) {
      throw new Error('processPendingBatchJobs function not exported');
    }
    
    console.log('🚀 Processing batch jobs...\n');
    const result = await processPendingBatchJobs(1);
    
    console.log('\n✅ Processing completed:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    const prisma = require('../api/lib/prisma-with-retry');
    await prisma.$disconnect();
  }
}

testProcessBatchJobs();

