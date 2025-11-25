/**
 * Check SyncStatus records in database
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../api/lib/prisma');

async function checkSyncStatus() {
  try {
    const syncStatuses = await prisma.syncStatus.findMany();
    
    console.log('📊 SyncStatus records in database:');
    if (syncStatuses.length === 0) {
      console.log('  ❌ No SyncStatus records found');
    } else {
      syncStatuses.forEach(s => {
        console.log('\n' + '='.repeat(60));
        console.log(`Sync Type: ${s.syncType}`);
        console.log(`Last Entity ID: ${s.lastEntityId || 'NULL'}`);
        console.log(`Last Sync At: ${s.lastSyncAt || 'NULL'}`);
        console.log(`Status: ${s.status}`);
        console.log(`Total Processed: ${s.totalProcessed}`);
        console.log(`Total Created: ${s.totalCreated}`);
        console.log(`Total Errors: ${s.totalErrors}`);
        if (s.errorMessage) {
          console.log(`Error Message: ${s.errorMessage}`);
        }
      });
    }
    
    // Also check checkpoint file
    const fs = require('fs');
    const path = require('path');
    const checkpointFile = path.join(__dirname, 'sync-checkpoint.json');
    
    console.log('\n' + '='.repeat(60));
    console.log('📄 Checkpoint file:');
    if (fs.existsSync(checkpointFile)) {
      const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
      console.log(JSON.stringify(checkpoint, null, 2));
    } else {
      console.log('  ❌ No checkpoint file found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncStatus();

