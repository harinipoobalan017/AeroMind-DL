@echo off
cd /d "%~dp0"
echo ===================================================
echo [AeroMind-DL] Building and Launching Docker Containers
echo ===================================================

echo [1/3] Building images and starting containers in Docker Desktop...
docker compose up -d --build

echo.
echo [2/3] Checking active containers:
docker compose ps

echo.
echo [3/3] AeroMind-DL is now running in Docker Desktop!
echo Frontend Dashboard: http://localhost:3000
echo Backend API & WS:   http://localhost:8000
echo MQTT Message Broker: localhost:1883
echo.
echo Check your Docker Desktop app - 'aeromind' containers are now active!
pause
