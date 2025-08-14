# 🚀 AdWords Tool Deployment Guide

## Online Deployment naar sdeal.com/adwords-tool

### Optie 1: Linux Server (Apache)

1. **Upload bestanden naar server:**
   ```bash
   scp -r adwords-tool/ user@your-server:/tmp/
   ```

2. **Run deployment script:**
   ```bash
   ssh user@your-server
   cd /tmp/adwords-tool
   chmod +x deploy-to-production.sh
   sudo ./deploy-to-production.sh
   ```

3. **Configure Apache:**
   - Voeg de configuratie uit `apache-config-sdeal.conf` toe aan je Apache virtual host
   - Restart Apache: `sudo systemctl restart apache2`

### Optie 2: Windows Server (IIS)

1. **Upload bestanden naar server:**
   ```cmd
   xcopy /E /I /Y adwords-tool\ C:\inetpub\wwwroot\sdeal.com\adwords-tool\
   ```

2. **Run deployment script:**
   ```cmd
   cd C:\inetpub\wwwroot\sdeal.com\adwords-tool
   deploy-to-production.bat
   ```

3. **Configure IIS:**
   - Voeg URL Rewrite rules toe aan web.config
   - Configure Application Pool voor Python

### Optie 3: Cloud Deployment (Docker)

1. **Build Docker image:**
   ```bash
   docker build -t adwords-tool .
   ```

2. **Run container:**
   ```bash
   docker run -d -p 8080:8080 --name adwords-tool adwords-tool
   ```

3. **Configure reverse proxy:**
   - Nginx/Apache proxy naar `http://localhost:8080`

## 🔒 Security Considerations

### Credentials Management
- ✅ `.env` file is beveiligd met restricted permissions
- ✅ Only system and your user have access
- ✅ Consider using environment variables on production server

### Network Security
- ✅ Tool runs on localhost (127.0.0.1:8080)
- ✅ Apache/IIS acts as reverse proxy
- ✅ HTTPS encryption recommended

### Access Control
- ✅ Consider adding authentication layer
- ✅ IP whitelisting for admin access
- ✅ Rate limiting for API calls

## 📊 Monitoring

### Service Status
```bash
# Linux
sudo systemctl status adwords-tool

# Windows
sc query AdWordsTool
```

### Logs
```bash
# Linux
sudo journalctl -u adwords-tool -f

# Windows
Get-EventLog -LogName Application -Source AdWordsTool
```

### Health Check
```bash
curl http://127.0.0.1:8080/health
```

## 🔧 Troubleshooting

### Common Issues

1. **Service won't start:**
   - Check Python path in service file
   - Verify permissions on adwords-tool directory
   - Check logs: `sudo journalctl -u adwords-tool`

2. **Apache proxy not working:**
   - Enable mod_proxy and mod_proxy_http
   - Check Apache error logs
   - Verify port 8080 is accessible

3. **Credentials not loading:**
   - Check .env file permissions
   - Verify file path in client_utils.py
   - Test with test_api_version.py

### Performance Optimization

1. **Gunicorn (Linux):**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 127.0.0.1:8080 simple_web:app
   ```

2. **Load Balancing:**
   - Multiple instances behind load balancer
   - Redis for session storage
   - Database for persistent data

## 🌐 Final URL

After deployment, your AdWords Tool will be available at:
**https://sdeal.com/adwords-tool**

## 📞 Support

For deployment issues:
1. Check service status and logs
2. Verify network connectivity
3. Test local access first
4. Review Apache/IIS configuration
