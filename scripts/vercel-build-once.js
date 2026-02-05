/**
 * Run the full build only once per deployment.
 * If build/output already exists, skip (exit 0) to stop Vercel build loops.
 * Use this as "vercel-build" so Dashboard override to "npm run vercel-build" still works.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(process.cwd(), 'build');
const sentinelFile = path.join(process.cwd(), '.vercel-build-done');
const indexHtml = path.join(buildDir, 'index.html');

if (fs.existsSync(indexHtml) && fs.existsSync(sentinelFile)) {
  console.log('Build already completed in this deployment, skipping to avoid loop.');
  process.exit(0);
}

try {
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Running setup-images...');
  execSync('npm run setup-images', { stdio: 'inherit' });
  console.log('Running react-scripts build...');
  execSync('npm run build', { stdio: 'inherit' });
  fs.writeFileSync(sentinelFile, new Date().toISOString());
  console.log('Build completed once.');
} catch (err) {
  process.exit(1);
}
