/**
 * Check if DATABASE_URL is correctly configured
 * This script validates the format without exposing sensitive data
 */

require('dotenv').config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== DATABASE_URL Check ===\n');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  console.log('\nPlease add DATABASE_URL to your .env file:');
  console.log('DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');

// Validate format
const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/([^?]+)(\?.*)?$/;
const match = DATABASE_URL.match(urlPattern);

if (!match) {
  console.error('❌ DATABASE_URL format is invalid');
  console.log('\nExpected format:');
  console.log('postgresql://username:password@host:port/database?sslmode=require');
  console.log('\nFor Neon:');
  console.log('postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require');
  process.exit(1);
}

const [, username, password, host, port, database, query] = match;

console.log('✅ DATABASE_URL format is valid');
console.log('\nConnection details (masked):');
console.log(`  Username: ${username ? '***' : 'missing'}`);
console.log(`  Password: ${password ? '***' : 'missing'}`);
console.log(`  Host: ${host || 'missing'}`);
console.log(`  Port: ${port || '5432 (default)'}`);
console.log(`  Database: ${database || 'missing'}`);
console.log(`  Query params: ${query || 'none'}`);

// Check for Neon-specific requirements
if (host && host.includes('neon.tech')) {
  console.log('\n✅ Neon database detected');
  
  // Check if using pooler (recommended for serverless)
  if (host.includes('-pooler')) {
    console.log('✅ Using pooler URL (recommended for Vercel/serverless)');
  } else {
    console.warn('⚠️  Not using pooler URL');
    console.log('   For Vercel/serverless, use the pooler URL:');
    console.log('   Change: ep-xxx-xxx.region.aws.neon.tech');
    console.log('   To:     ep-xxx-xxx-pooler.region.aws.neon.tech');
  }
  
  // Check for SSL
  if (query && query.includes('sslmode=require')) {
    console.log('✅ SSL mode is set (required for Neon)');
  } else {
    console.warn('⚠️  SSL mode not set');
    console.log('   Add ?sslmode=require to your DATABASE_URL');
  }
} else {
  console.log('\n⚠️  Not a Neon database (or hostname not recognized)');
}

// Check connection (optional, but helpful)
console.log('\n=== Connection Test ===');
console.log('To test the connection, run:');
console.log('  cd server');
console.log('  npx prisma db pull');
console.log('\nOr check in Vercel:');
console.log('  1. Go to Vercel Dashboard → Project → Settings → Environment Variables');
console.log('  2. Verify DATABASE_URL is set for all environments');
console.log('  3. Make sure it uses the pooler URL for serverless: ep-xxx-xxx-pooler.region.aws.neon.tech');

