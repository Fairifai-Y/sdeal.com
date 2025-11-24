const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase max header size to prevent 431 errors
// Default is 8KB, increase to 32KB
const http = require('http');
const server = http.createServer({
  maxHeaderSize: 32768 // 32KB
}, app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../build')));

// Serve images from the images directory
app.use('/images', express.static(path.join(__dirname, '../images')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SDeal API is running' });
});

// Package selection routes
const packageRoutes = require('./routes/package');
app.use('/api/package', packageRoutes);

// Local test route for sync customers (only in development)
if (process.env.NODE_ENV !== 'production') {
  // Import sync function
  const syncCustomersHandler = require('../api/admin/mailing/sync-customers');
  
  // Proxy sync customers endpoint for local testing
  app.all('/api/admin/mailing/sync-customers', async (req, res) => {
    // Convert Express req/res to Vercel-style handler
    const vercelReq = {
      method: req.method,
      body: req.body,
      query: req.query
    };
    
    const vercelRes = {
      status: (code) => ({
        json: (data) => {
          res.status(code).json(data);
        },
        end: () => {
          res.status(code).end();
        }
      }),
      json: (data) => {
        res.json(data);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      end: () => {
        res.end();
      }
    };
    
    try {
      await syncCustomersHandler(vercelReq, vercelRes);
    } catch (error) {
      console.error('[Local Sync] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  console.log('✅ Local sync endpoint enabled: /api/admin/mailing/sync-customers');
  
  // Add all mailing API endpoints for local development
  const mailingEndpoints = [
    { path: '/api/admin/mailing/templates', handler: require('../api/admin/mailing/templates') },
    { path: '/api/admin/mailing/workflows', handler: require('../api/admin/mailing/workflows') },
    { path: '/api/admin/mailing/lists', handler: require('../api/admin/mailing/lists') },
    { path: '/api/admin/mailing/campaigns', handler: require('../api/admin/mailing/campaigns') },
    { path: '/api/admin/mailing/list-members', handler: require('../api/admin/mailing/list-members') }
  ];
  
  mailingEndpoints.forEach(({ path, handler }) => {
    app.all(path, async (req, res) => {
      // Set headers first
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');
      
      // Handle OPTIONS
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      const vercelReq = {
        method: req.method,
        body: req.body,
        query: req.query
      };
      
      let responseSent = false;
      
      const vercelRes = {
        status: (code) => ({
          json: (data) => {
            if (!responseSent && !res.headersSent) {
              responseSent = true;
              res.status(code).json(data);
            }
          },
          end: () => {
            if (!responseSent && !res.headersSent) {
              responseSent = true;
              res.status(code).end();
            }
          }
        }),
        json: (data) => {
          if (!responseSent && !res.headersSent) {
            responseSent = true;
            res.json(data);
          }
        },
        setHeader: (name, value) => {
          if (!res.headersSent) {
            res.setHeader(name, value);
          }
        },
        end: () => {
          if (!responseSent && !res.headersSent) {
            responseSent = true;
            res.end();
          }
        }
      };
      
      try {
        await handler(vercelReq, vercelRes);
        
        // If handler didn't send a response, send a default error
        if (!responseSent && !res.headersSent) {
          console.warn(`[Local API] Handler for ${path} did not send a response for ${req.method}`);
          res.status(500).json({
            success: false,
            error: 'Handler did not send a response'
          });
        }
      } catch (error) {
        console.error(`[Local API] Error in ${path} (${req.method}):`, error);
        if (!responseSent && !res.headersSent) {
          res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
          });
        }
      }
    });
    console.log(`✅ Local endpoint enabled: ${path}`);
  });
}

app.get('/api/countries', (req, res) => {
  const countries = [
    {
      name: 'Netherlands',
      url: 'https://www.sdeal.nl',
      image: '/images/netherlands.png',
      flag: 'https://www.sdeal.nl/media/images/Nederlandse_vlag.png'
    },
    {
      name: 'Germany',
      url: 'https://www.sdeal.de',
      image: '/images/germany.png',
      flag: 'https://www.sdeal.nl/media/images/duitse_vlag.png'
    },
    {
      name: 'France',
      url: 'https://www.sdeal.fr',
      image: '/images/france.png',
      flag: 'https://www.sdeal.nl/media/images/franse_vlag.png'
    },
    {
      name: 'Belgium',
      url: 'https://www.sdeal.be',
      image: '/images/belgium.png',
      flag: 'https://www.sdeal.nl/media/images/Belgie.png'
    },
    {
      name: 'Italy',
      url: 'https://www.sdeal.it',
      image: '/images/italy.png',
      flag: 'https://www.sdeal.nl/media/images/italian_flag.png'
    },
    {
      name: 'Denmark',
      url: 'https://www.sdeal.dk',
      image: '/images/denmark.png',
      flag: 'https://www.sdeal.nl/media/images/danish_flag.png'
    },
    {
      name: 'Austria',
      url: 'https://www.sdeal.at',
      image: '/images/austria.png',
      flag: 'https://www.sdeal.nl/media/images/austrian_flag.png'
    }
  ];
  res.json(countries);
});

app.get('/api/integrations', (req, res) => {
  const integrations = [
    {
      name: 'Shopify',
      url: 'https://www.shopify.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/shopify.png',
      description: 'Synchronize your Shopify products and orders easily with SDeal for streamlined operations.'
    },
    {
      name: 'WooCommerce',
      url: 'https://woocommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/woocommerce.png',
      description: 'Connect WooCommerce to SDeal for automated syncing of orders, customers, and product updates.'
    },
    {
      name: 'Lightspeed',
      url: 'https://www.lightspeedhq.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/lightspeedhq.png',
      description: 'Integrate Lightspeed with SDeal to manage inventory and orders from one central location.'
    },
    {
      name: 'Channable',
      url: 'https://www.channable.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channable.png',
      description: 'Use Channable to manage your feed and connect it to SDeal for seamless product data integration.'
    },
    {
      name: 'PrestaShop',
      url: 'https://www.prestashop.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/prestashop.png',
      description: 'Connect PrestaShop to SDeal for automated order processing and synchronized inventory management.'
    },
    {
      name: 'BaseLinker',
      url: 'https://www.baselinker.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/baselinker.png',
      description: 'BaseLinker integrates smoothly with SDeal to support multi-channel sales and centralize all order flows.'
    },
    {
      name: 'ChannelEngine',
      url: 'https://www.channelengine.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/channelengine.png',
      description: 'Connect ChannelEngine with SDeal to manage marketplace sales and sync inventory and orders.'
    },
    {
      name: 'EffectConnect',
      url: 'https://www.effectconnect.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/effectconnect.png',
      description: 'EffectConnect links your marketplaces to SDeal and streamlines order and inventory processes.'
    },
    {
      name: 'Magento 2',
      url: 'https://magento.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/magento.png',
      description: 'SDeal supports advanced Magento 2 integration with real-time product, customer, and order syncing.'
    },
    {
      name: 'GoedGepickt',
      url: 'https://www.goedgepickt.nl',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/goedgepickt.png',
      description: 'With GoedGepickt, manage your warehouse directly from SDeal and automate stock updates and order fulfillment.'
    },
    {
      name: 'BigCommerce',
      url: 'https://www.bigcommerce.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/bigcommerce.png',
      description: 'Easily connect BigCommerce to SDeal for global sales and automated syncing of products and orders.'
    },
    {
      name: 'ProductFlow',
      url: 'https://www.productflow.com',
      image: 'https://www.sdeal.nl/media//wysiwyg/media/productflow.png',
      description: 'Manage all your product content, inventory, and order flows from one place with ProductFlow + SDeal.'
    }
  ];
  res.json(integrations);
});

// AdWords Tool Integration
app.get('/adwords-tool/app', (req, res) => {
  // Serve the AdWords tool interface
  const adwordsHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Ads Tools - SDeal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .tool-card { border: none; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 25px; }
        .btn-success { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); border: none; border-radius: 25px; }
        .btn-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 25px; }
        .result-box { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-top: 20px; max-height: 400px; overflow-y: auto; }
        .label-checkbox { margin: 5px 0; }
        .label-checkbox input[type="checkbox"] { margin-right: 8px; }
        .preview-box { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 10px; padding: 15px; margin-top: 15px; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark">
        <div class="container">
            <span class="navbar-brand">SDeal Google Ads Tools</span>
            <a href="/adwords-tool" class="btn btn-outline-light btn-sm">← Terug naar login</a>
        </div>
    </nav>

    <div class="container mt-4">
        <h1 class="mb-4">Google Ads Campaign Tools</h1>
        
        <div class="row">
            <!-- Label Discovery -->
            <div class="col-md-6">
                <div class="card tool-card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Label Discovery</h5>
                    </div>
                    <div class="card-body">
                        <form id="discoverForm">
                            <div class="mb-3">
                                <label class="form-label">Customer ID *</label>
                                <input type="text" class="form-control" id="customerId" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Label Index</label>
                                <select class="form-select" id="labelIndex">
                                    <option value="0">custom_label_0</option>
                                    <option value="1">custom_label_1</option>
                                    <option value="2">custom_label_2</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-primary" onclick="discoverLabels()">Discover Labels</button>
                        </form>
                        <div id="discoverResults" class="result-box" style="display: none;"></div>
                    </div>
                </div>
            </div>

            <!-- Campaign Creation -->
            <div class="col-md-6">
                <div class="card tool-card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">Campaign Creation</h5>
                    </div>
                    <div class="card-body">
                        <form id="createForm">
                            <div class="mb-3">
                                <label class="form-label">Customer ID *</label>
                                <input type="text" class="form-control" id="createCustomerId" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Select Labels</label>
                                <div id="labelSelection" class="border rounded p-3" style="background: #f8f9fa;">
                                    <small class="text-muted">Eerst labels ontdekken om ze hier te kunnen selecteren</small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Campaign Prefix</label>
                                <input type="text" class="form-control" id="campaignPrefix" value="PMax Feed">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Daily Budget (€)</label>
                                <input type="number" class="form-control" id="dailyBudget" value="5.0" step="0.1">
                            </div>
                            <button type="button" class="btn btn-warning me-2" onclick="previewCampaigns()">Preview Campagnes</button>
                            <button type="submit" class="btn btn-success">Create Selected Campaigns</button>
                        </form>
                        <div id="previewResults" class="preview-box" style="display: none;"></div>
                        <div id="createResults" class="result-box" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let discoveredLabels = [];
        
        async function discoverLabels() {
            const customerId = document.getElementById('customerId').value.trim();
            const labelIndex = parseInt(document.getElementById('labelIndex').value);
            
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const formData = {
                customer_id: customerId,
                label_index: labelIndex
            };

            try {
                const response = await fetch('/adwords-tool/api/discover-labels', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const container = document.getElementById('discoverResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-success"><h6>✅ Labels gevonden:</h6><pre>' + result.output + '</pre></div>';
                    
                    // Parse labels from output
                    const output = result.output;
                    const labels = [];
                    
                    const labelMatches = output.match(/'([^']+)': \\d+ impressions/g);
                    if (labelMatches) {
                        labelMatches.forEach(match => {
                            const label = match.match(/'([^']+)'/)[1];
                            labels.push(label);
                        });
                    }
                    
                    displayLabels(labels);
                    document.getElementById('createCustomerId').value = customerId;
                    
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre></div>';
                }
                container.style.display = 'block';
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function displayLabels(labels) {
            const container = document.getElementById('labelSelection');
            if (!labels || labels.length === 0) {
                container.innerHTML = '<small class="text-muted">Geen labels gevonden</small>';
                return;
            }
            
            let html = '<div class="mb-2"><strong>Gevonden labels:</strong></div>';
            html += '<div class="row">';
            
            labels.forEach((label, index) => {
                const colClass = labels.length > 6 ? 'col-md-4' : 'col-md-6';
                html += \`
                    <div class="\${colClass}">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="label\${index}" value="\${label}" checked>
                            <label class="form-check-label" for="label\${index}">\${label}</label>
                        </div>
                    </div>
                \`;
            });
            
            html += '</div>';
            html += '<div class="mt-2">';
            html += '<button type="button" class="btn btn-sm btn-outline-primary" onclick="selectAll()">Alles selecteren</button>';
            html += '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAll()">Alles deselecteren</button></div>';
            
            container.innerHTML = html;
        }

        function getSelectedLabels() {
            const checkboxes = document.querySelectorAll('#labelSelection input[type="checkbox"]:checked');
            return Array.from(checkboxes).map(cb => cb.value.trim());
        }

        function selectAll() {
            document.querySelectorAll('#labelSelection input[type="checkbox"]').forEach(cb => cb.checked = true);
        }

        function deselectAll() {
            document.querySelectorAll('#labelSelection input[type="checkbox"]').forEach(cb => cb.checked = false);
        }

        async function previewCampaigns() {
            const selectedLabels = getSelectedLabels();
            if (selectedLabels.length === 0) {
                alert('Selecteer minimaal één label om een preview te zien.');
                return;
            }
            
            const customerId = document.getElementById('createCustomerId').value.trim();
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const formData = {
                customer_id: customerId,
                prefix: document.getElementById('campaignPrefix').value,
                daily_budget: parseFloat(document.getElementById('dailyBudget').value),
                selected_labels: selectedLabels
            };

            try {
                const response = await fetch('/adwords-tool/api/preview-campaigns', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const container = document.getElementById('previewResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-info"><h6>📋 Preview van campagnes:</h6><pre>' + result.output + '</pre></div>';
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre></div>';
                }
                container.style.display = 'block';
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        document.getElementById('createForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const selectedLabels = getSelectedLabels();
            if (selectedLabels.length === 0) {
                alert('Selecteer minimaal één label om campagnes aan te maken.');
                return;
            }
            
            const customerId = document.getElementById('createCustomerId').value.trim();
            if (!customerId) {
                alert('Vul een Customer ID in.');
                return;
            }
            
            const formData = {
                customer_id: customerId,
                prefix: document.getElementById('campaignPrefix').value,
                daily_budget: parseFloat(document.getElementById('dailyBudget').value),
                selected_labels: selectedLabels
            };

            try {
                const response = await fetch('/adwords-tool/api/create-campaigns', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const container = document.getElementById('createResults');
                if (result.success) {
                    container.innerHTML = '<div class="alert alert-success"><h6>✅ Campagnes aangemaakt:</h6><pre>' + result.output + '</pre></div>';
                } else {
                    container.innerHTML = '<div class="alert alert-danger"><h6>❌ Error:</h6><pre>' + (result.error || result.output) + '</pre></div>';
                }
                container.style.display = 'block';
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>`;
  
  res.send(adwordsHtml);
});

// AdWords Tool API Routes
app.post('/adwords-tool/api/discover-labels', async (req, res) => {
  try {
    const { customer_id, label_index } = req.body;
    
    // Load environment variables
    const path = require('path');
    const fs = require('fs');
    const envPath = path.join(__dirname, '../.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\\n').forEach(line => {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':', 2);
          envVars[key.trim()] = value.trim();
        }
      });
      
      // Set environment variables
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });
    }
    
    // Use the client_utils to create Google Ads client
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', ['../adwords-tool/src/client_utils.py'], {
      cwd: path.join(__dirname, '../adwords-tool'),
      env: { ...process.env }
    });
    
    // For now, return demo data
    const output = `'electronics': 1250 impressions
'clothing': 890 impressions
'books': 567 impressions
'home': 432 impressions
'garden': 234 impressions`;
    
    res.json({
      success: true,
      output: output,
      command: `GAQL query for customer ${customer_id}, label_index ${label_index}`
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.post('/adwords-tool/api/preview-campaigns', async (req, res) => {
  try {
    const { customer_id, prefix, daily_budget, selected_labels } = req.body;
    
    const output = `Preview van campagnes die aangemaakt gaan worden:

Customer ID: ${customer_id}
Campaign Prefix: ${prefix}
Daily Budget: €${daily_budget}

Campagnes:
${selected_labels.map((label, i) => `${i+1}. ${prefix} - ${label}`).join('\n')}

Totaal: ${selected_labels.length} campagnes`;
    
    res.json({
      success: true,
      output: output,
      command: `Preview mode - would create ${selected_labels.length} campaigns`
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.post('/adwords-tool/api/create-campaigns', async (req, res) => {
  try {
    const { customer_id, prefix, daily_budget, selected_labels } = req.body;
    
    const output = `✅ Demo Mode - Campaign Creation Successful!

Customer ID: ${customer_id}
Campaign Prefix: ${prefix}
Labels: ${selected_labels.join(', ')}

Campagnes aangemaakt:
${selected_labels.map((label, i) => `${i+1}. ${prefix} - ${label}`).join('\n')}

📝 Note: This is a demo mode.
For full functionality, implement Google Ads API integration.`;
    
    res.json({
      success: true,
      output: output,
      command: `Demo mode - created ${selected_labels.length} campaigns`
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server with increased header size
server.listen(PORT, () => {
  console.log(`SDeal server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Max header size: 32KB (to prevent 431 errors)`);
}); 