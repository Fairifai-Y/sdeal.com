#!/bin/bash
# Deployment script for AdWords Tool to sdeal.com

echo "🚀 Deploying AdWords Tool to sdeal.com/adwords-tool"

# Configuration
PROJECT_DIR="/var/www/sdeal.com"
ADWORDS_TOOL_DIR="$PROJECT_DIR/adwords-tool"
SERVICE_NAME="adwords-tool"

# 1. Create directories if they don't exist
echo "📁 Creating directories..."
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $ADWORDS_TOOL_DIR

# 2. Copy AdWords Tool files
echo "📋 Copying AdWords Tool files..."
sudo cp -r . $ADWORDS_TOOL_DIR/

# 3. Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data $ADWORDS_TOOL_DIR
sudo chmod -R 755 $ADWORDS_TOOL_DIR
sudo chmod 600 $ADWORDS_TOOL_DIR/.env 2>/dev/null || true

# 4. Install Python dependencies
echo "📦 Installing Python dependencies..."
cd $ADWORDS_TOOL_DIR
sudo pip3 install -r requirements.txt

# 5. Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Google Ads Tool Web Interface
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$ADWORDS_TOOL_DIR
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/python3 simple_web.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable and start service
echo "🔄 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# 7. Check service status
echo "📊 Service status:"
sudo systemctl status $SERVICE_NAME --no-pager

# 8. Apache configuration
echo "🌐 Apache configuration..."
echo "Add the following to your Apache virtual host configuration:"
echo "================================================================"
cat apache-config-sdeal.conf
echo "================================================================"
echo ""
echo "Then restart Apache: sudo systemctl restart apache2"

# 9. Test the deployment
echo "🧪 Testing deployment..."
sleep 5
curl -s http://127.0.0.1:8080 > /dev/null && echo "✅ AdWords Tool is running locally" || echo "❌ AdWords Tool failed to start"

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Access your AdWords Tool at: https://sdeal.com/adwords-tool"
echo "📝 Check logs with: sudo journalctl -u $SERVICE_NAME -f"
