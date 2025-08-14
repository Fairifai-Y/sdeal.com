@echo off
echo 🚀 Deploying AdWords Tool to sdeal.com/adwords-tool

REM Configuration
set PROJECT_DIR=C:\inetpub\wwwroot\sdeal.com
set ADWORDS_TOOL_DIR=%PROJECT_DIR%\adwords-tool
set SERVICE_NAME=AdWordsTool

echo 📁 Creating directories...
if not exist "%PROJECT_DIR%" mkdir "%PROJECT_DIR%"
if not exist "%ADWORDS_TOOL_DIR%" mkdir "%ADWORDS_TOOL_DIR%"

echo 📋 Copying AdWords Tool files...
xcopy /E /I /Y . "%ADWORDS_TOOL_DIR%"

echo 🔒 Setting permissions...
icacls "%ADWORDS_TOOL_DIR%" /inheritance:r
icacls "%ADWORDS_TOOL_DIR%" /grant:r "IIS_IUSRS:(OI)(CI)F"
icacls "%ADWORDS_TOOL_DIR%" /grant:r "SYSTEM:(OI)(CI)F"

echo 📦 Installing Python dependencies...
cd /d "%ADWORDS_TOOL_DIR%"
pip install -r requirements.txt

echo ⚙️ Creating Windows Service...
sc create "%SERVICE_NAME%" binPath= "C:\Python39\python.exe %ADWORDS_TOOL_DIR%\simple_web.py" start= auto
sc description "%SERVICE_NAME%" "Google Ads Tool Web Interface"

echo 🔄 Starting service...
sc start "%SERVICE_NAME%"

echo 📊 Service status:
sc query "%SERVICE_NAME%"

echo 🌐 IIS Configuration:
echo Add the following to your web.config in the root of sdeal.com:
echo ================================================================
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="AdWords Tool Proxy"^>
echo           ^<match url="^adwords-tool/(.*)" /^>
echo           ^<action type="Rewrite" url="http://127.0.0.1:8080/{R:1}" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo   ^</system.webServer^>
echo ^</configuration^>
echo ================================================================

echo 🧪 Testing deployment...
timeout /t 5 /nobreak >nul
curl -s http://127.0.0.1:8080 >nul && echo ✅ AdWords Tool is running locally || echo ❌ AdWords Tool failed to start

echo.
echo 🎉 Deployment complete!
echo 🌐 Access your AdWords Tool at: https://sdeal.com/adwords-tool
echo 📝 Check service with: sc query "%SERVICE_NAME%"
pause
