@echo off
echo ======================================================================
echo [AEROMIND-DL] Starting Cloud-Edge Framework & 3D Web Center
echo ======================================================================
echo.

set PYTHONPATH=%~dp0backend

echo [1/2] Launching AeroMind FastAPI Backend on http://localhost:8000 ...
start "AeroMind-DL API Server" cmd /k "cd /d %~dp0backend && py -m uvicorn aeromind.api.server:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React 3D Dashboard on http://localhost:5173 ...
start "AeroMind-DL 3D Dashboard" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ======================================================================
echo Framework is running!
echo Web Dashboard: http://localhost:5173
echo API Docs:      http://localhost:8000/docs
echo Telemetry WS:  ws://localhost:8000/ws/telemetry
echo ======================================================================
pause
