// Utility script to clear Consumer and EmailListMember data from the database.
//
// USAGE (locally of in een eenmalige omgeving):
//   1) Zorg dat DATABASE_URL wijst naar de database die je wilt opschonen.
//   2) VOEG expliciet toe: ALLOW_CLEAR_EMAIL_DATA=true
//   3) Run:
//        npx prisma generate
//        ALLOW_CLEAR_EMAIL_DATA=true node scripts/clear-consumer-email-data.js
//
// LET OP: dit verwijdert ALLE consumenten en maillijst-lidmaatschappen.
//         Dit is onomkeerbaar – maak eerst een backup als dat nodig is.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function main() {
  console.log('-----------------------------------------');
  console.log(' This script will DELETE ALL records from:');
  console.log('   - EmailListMember');
  console.log('   - Consumer');
  console.log(' and related records via ON DELETE CASCADE (EmailEvent,');
  console.log(' EmailWorkflowExecution, etc. where configured).');
  console.log('-----------------------------------------');

  const dbUrl = process.env.DATABASE_URL || '(not set)';
  console.log('DATABASE_URL (truncated):', dbUrl.substring(0, 80), '...');

  // Extra veiligheidscheck: vereis een expliciete bevestiging via env var
  if (process.env.ALLOW_CLEAR_EMAIL_DATA !== 'true') {
    console.error('\nABORTED: Set ALLOW_CLEAR_EMAIL_DATA=true in the environment to run this script.');
    console.error('Example:');
    console.error('  ALLOW_CLEAR_EMAIL_DATA=true node scripts/clear-consumer-email-data.js');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    console.log('\nFetching counts before delete...');
    const [consumerCount, memberCount] = await Promise.all([
      prisma.consumer.count(),
      prisma.emailListMember.count(),
    ]);
    console.log(`Consumers before delete:        ${consumerCount}`);
    console.log(`EmailListMembers before delete: ${memberCount}`);

    console.log('\nDeleting EmailListMember and Consumer data...');
    // Eerst list memberships weg, daarna consumers (veilig bij FKs)
    const result = await prisma.$transaction([
      prisma.emailListMember.deleteMany({}),
      prisma.consumer.deleteMany({}),
    ]);

    console.log('Delete results (affected rows):', result);

    const [consumerAfter, memberAfter] = await Promise.all([
      prisma.consumer.count(),
      prisma.emailListMember.count(),
    ]);
    console.log('\nCounts after delete:');
    console.log(`Consumers:        ${consumerAfter}`);
    console.log(`EmailListMembers: ${memberAfter}`);

    console.log('\nDONE: Consumer and EmailListMember tables have been cleared.');
  } catch (err) {
    console.error('Error while clearing email data:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();