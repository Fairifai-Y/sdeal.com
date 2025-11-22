/**
 * Setup root .env file by copying DATABASE_URL from server/.env
 * This ensures both Prisma clients use the same database
 */

const fs = require('fs');
const path = require('path');

const serverEnvPath = path.join(__dirname, '../server/.env');
const rootEnvPath = path.join(__dirname, '../.env');

console.log('=== Root .env Setup ===\n');

// Read server/.env
if (!fs.existsSync(serverEnvPath)) {
  console.error('❌ server/.env not found!');
  console.log('Please create server/.env first with DATABASE_URL');
  process.exit(1);
}

const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
const serverEnvLines = serverEnvContent.split('\n');

// Extract DATABASE_URL from server/.env
let databaseUrl = null;
for (const line of serverEnvLines) {
  if (line.startsWith('DATABASE_URL=')) {
    databaseUrl = line.trim();
    break;
  }
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in server/.env');
  process.exit(1);
}

console.log('✅ Found DATABASE_URL in server/.env');

// Check if root .env exists
let rootEnvContent = '';
if (fs.existsSync(rootEnvPath)) {
  rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
  console.log('✅ Root .env already exists');
} else {
  console.log('📝 Creating root .env...');
}

// Check if DATABASE_URL already exists in root .env
if (rootEnvContent.includes('DATABASE_URL=')) {
  console.log('⚠️  DATABASE_URL already exists in root .env');
  console.log('   Updating existing DATABASE_URL...');
  
  // Replace existing DATABASE_URL
  const lines = rootEnvContent.split('\n');
  const updatedLines = lines.map(line => {
    if (line.startsWith('DATABASE_URL=')) {
      return databaseUrl;
    }
    return line;
  });
  rootEnvContent = updatedLines.join('\n');
} else {
  // Add DATABASE_URL to root .env
  if (rootEnvContent && !rootEnvContent.endsWith('\n')) {
    rootEnvContent += '\n';
  }
  rootEnvContent += `\n# Database Configuration (copied from server/.env)\n${databaseUrl}\n`;
}

// Write root .env
fs.writeFileSync(rootEnvPath, rootEnvContent, 'utf8');

console.log('✅ Root .env updated with DATABASE_URL');
console.log('\n📋 Root .env location:', rootEnvPath);
console.log('📋 Server .env location:', serverEnvPath);
console.log('\n✅ Both Prisma clients will now use the same database!');
console.log('\n⚠️  Remember: For Vercel, set DATABASE_URL as Environment Variable in Vercel Dashboard');

