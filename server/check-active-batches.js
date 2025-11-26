require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma-with-retry');

async function checkActiveBatches() {
  try {
    console.log('🔍 Checking for active batches...\n');
    
    // Check pending batches
    const pendingBatches = await prisma.emailBatch.findMany({
      where: {
        status: 'pending'
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check processing batches
    const processingBatches = await prisma.emailBatch.findMany({
      where: {
        status: 'processing'
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check failed batches that might be retried
    const failedBatches = await prisma.emailBatch.findMany({
      where: {
        status: 'failed',
        retryCount: { lt: prisma.emailBatch.fields.maxRetries }
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Batch Status Summary:\n`);
    console.log(`   Pending: ${pendingBatches.length}`);
    console.log(`   Processing: ${processingBatches.length}`);
    console.log(`   Failed (retryable): ${failedBatches.length}\n`);

    if (pendingBatches.length > 0) {
      console.log(`\n⏳ PENDING Batches (${pendingBatches.length}):`);
      for (const batch of pendingBatches) {
        const emailCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
        console.log(`   - Batch ${batch.id.substring(0, 8)}...`);
        console.log(`     Campaign: ${batch.campaign.name} (${batch.campaign.status})`);
        console.log(`     Emails: ${emailCount}`);
        console.log(`     Created: ${batch.createdAt.toISOString()}`);
        if (batch.nextRetryAt) {
          console.log(`     Next retry: ${batch.nextRetryAt.toISOString()}`);
        }
        console.log('');
      }
    }

    if (processingBatches.length > 0) {
      console.log(`\n🔄 PROCESSING Batches (${processingBatches.length}):`);
      for (const batch of processingBatches) {
        const emailCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
        const processingTime = batch.processedAt ? 
          Math.floor((Date.now() - new Date(batch.processedAt).getTime()) / 1000) : 0;
        console.log(`   - Batch ${batch.id.substring(0, 8)}...`);
        console.log(`     Campaign: ${batch.campaign.name} (${batch.campaign.status})`);
        console.log(`     Emails: ${emailCount}`);
        console.log(`     Processing for: ${processingTime}s`);
        console.log(`     Started: ${batch.processedAt?.toISOString() || 'Unknown'}`);
        console.log('');
      }
    }

    if (failedBatches.length > 0) {
      console.log(`\n❌ FAILED Batches (retryable) (${failedBatches.length}):`);
      for (const batch of failedBatches) {
        const emailCount = Array.isArray(batch.emails) ? batch.emails.length : 0;
        console.log(`   - Batch ${batch.id.substring(0, 8)}...`);
        console.log(`     Campaign: ${batch.campaign.name} (${batch.campaign.status})`);
        console.log(`     Emails: ${emailCount}`);
        console.log(`     Retry count: ${batch.retryCount}/${batch.maxRetries}`);
        console.log(`     Error: ${batch.errorMessage || 'Unknown'}`);
        console.log(`     Next retry: ${batch.nextRetryAt?.toISOString() || 'Not scheduled'}`);
        console.log('');
      }
    }

    // Check for stuck processing batches (processing for more than 5 minutes)
    const stuckBatches = processingBatches.filter(batch => {
      if (!batch.processedAt) return false;
      const processingTime = Date.now() - new Date(batch.processedAt).getTime();
      return processingTime > 5 * 60 * 1000; // 5 minutes
    });

    if (stuckBatches.length > 0) {
      console.log(`\n⚠️  STUCK Batches (processing > 5 minutes) (${stuckBatches.length}):`);
      for (const batch of stuckBatches) {
        const processingTime = Math.floor((Date.now() - new Date(batch.processedAt).getTime()) / 1000);
        console.log(`   - Batch ${batch.id.substring(0, 8)}... processing for ${processingTime}s`);
      }
    }

    // Total summary
    const totalActive = pendingBatches.length + processingBatches.length;
    if (totalActive === 0) {
      console.log(`\n✅ No active batches found. All batches have been processed.`);
    } else {
      console.log(`\n📋 Total active batches: ${totalActive}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActiveBatches();

