@echo off
echo Starting AdWords Tool...
echo.

echo Installing server dependencies...
cd server
npm install
cd ..

echo Installing AdWords tool dependencies...
cd adwords-tool
pip install -r requirements.txt
cd ..

echo.
echo Starting AdWords Tool proxy server...
start "AdWords Proxy" cmd /k "cd server && node adwords-proxy.js"

echo.
echo Starting main SDeal server...
start "SDeal Server" cmd /k "cd server && npm start"

echo.
echo AdWords Tool will be available at:
echo - Main site: http://localhost:3000/adwords-tool
echo - Direct access: http://localhost:8081
echo.
echo Press any key to exit...
pause
