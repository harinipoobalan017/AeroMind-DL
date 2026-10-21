@echo off
echo ======================================================================
echo [AEROMIND-DL] Launching AWS Cloud-Ready MAPPO Multi-Agent Training
echo ======================================================================
echo.

set PYTHONPATH=%~dp0backend
cd /d %~dp0backend

py -m aeromind.cloud.aws_trainer --episodes 50 --drones 8 --targets 20 --out-dir checkpoints

echo.
pause
