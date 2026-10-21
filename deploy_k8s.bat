@echo off
cd /d "%~dp0"
echo ===================================================
echo [AeroMind-DL] Deploying Swarm to Kubernetes (K8s)
echo ===================================================

echo [1/3] Building local container images for Kubernetes...
docker build -t aeromind-edge:latest -f Dockerfile.backend .
docker build -t aeromind-dashboard:latest -f Dockerfile.frontend .

echo.
echo [2/3] Applying Kubernetes manifests (Namespace, MQTT, Backend, Frontend, RL Job)...
kubectl apply -f k8s\all-in-one.yaml

echo.
echo [3/3] Fetching Kubernetes Pods in namespace 'aeromind':
kubectl get pods -n aeromind -o wide
kubectl get services -n aeromind

echo.
echo Access endpoints:
echo Frontend: http://localhost:30300 (or NodePort 30300)
echo Backend API: http://localhost:30800
echo MQTT Broker: localhost:31883
pause
