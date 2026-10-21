#!/usr/bin/env bash
# ==============================================================================
# AeroMind-DL: AWS EC2 Deep Learning AMI Automated Training Script
# Tested on: AWS EC2 g4dn.xlarge (NVIDIA T4) & g5.xlarge (NVIDIA A10G)
# ==============================================================================

set -e

echo "======================================================================"
echo "[AEROMIND-DL] Bootstrapping AWS EC2 GPU Training Cluster"
echo "======================================================================"

# 1. Verify GPU
nvidia-smi || echo "Warning: NVIDIA GPU not detected, falling back to CPU."

# 2. Setup Virtual Environment
python3 -m venv venv_aws
source venv_aws/bin/activate

# 3. Install Dependencies
pip install --upgrade pip
pip install torch torchvision numpy scipy fastapi uvicorn websockets pydantic boto3

# 4. Export Python Path
export PYTHONPATH="$(pwd)/backend"

# 5. Launch Cloud MAPPO Training with AWS S3 Sync
echo "[AEROMIND-DL] Launching 100 Episodes MAPPO Multi-Agent Swarm Optimization..."
python3 backend/aeromind/cloud/aws_trainer.py \
    --episodes 100 \
    --drones 8 \
    --targets 20 \
    --s3-bucket "${AWS_S3_BUCKET:-aeromind-models}" \
    --out-dir checkpoints

echo "======================================================================"
echo "[AEROMIND-DL] AWS Cloud Training Successfully Completed!"
echo "Model weights saved to checkpoints/ and synchronized to Amazon S3."
echo "======================================================================"
