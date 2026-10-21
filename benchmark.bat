@echo off
echo ======================================================================
echo [AEROMIND-DL] Running Experimental Benchmarks (MAPPO vs Baselines)
echo ======================================================================
echo.

set PYTHONPATH=%~dp0backend
cd /d %~dp0backend

py -m aeromind.benchmark

echo.
pause
