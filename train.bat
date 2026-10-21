@echo off
echo ======================================================================
echo [AEROMIND-DL] Launching Multi-Agent Deep RL Training (MAPPO)
echo ======================================================================
echo.

set PYTHONPATH=%~dp0backend
cd /d %~dp0backend

py -m aeromind.train --episodes 50 --drones 8 --targets 20 --save-dir checkpoints

echo.
pause
