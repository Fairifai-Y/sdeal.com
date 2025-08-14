const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.ADWORDS_PORT || 8081;

// Start the Python Flask app
function startPythonApp() {
  const pythonProcess = spawn('python', ['simple_web.py'], {
    cwd: path.join(__dirname, '../adwords-tool'),
    env: { ...process.env, PORT: '8082' }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python app: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python app error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python app exited with code ${code}`);
    // Restart after 5 seconds
    setTimeout(startPythonApp, 5000);
  });

  return pythonProcess;
}

// Start Python app
const pythonApp = startPythonApp();

// Proxy all requests to the Python Flask app
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8082',
  changeOrigin: true,
  logLevel: 'debug'
}));

app.listen(PORT, () => {
  console.log(`AdWords Tool proxy running on port ${PORT}`);
  console.log(`Proxying to: http://localhost:8082`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down AdWords proxy...');
  pythonApp.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down AdWords proxy...');
  pythonApp.kill();
  process.exit(0);
});
