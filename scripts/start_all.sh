#!/usr/bin/env bash
# ========================================================
# ONCOGENIX AI - Unified Startup Script
# Pure Django Web Application (8000) & FastAPI AI Inference (8001)
# Developed at Thakur Shyamnarayan College of Engineering, Mumbai
# ========================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo " Starting ONCOGENIX AI Precision Oncology Ecosystem"
echo " Department of Artificial Intelligence & Precision Oncology Research"
echo " Thakur Shyamnarayan College of Engineering, Mumbai"
echo "=========================================================="

# Activate virtual environment
if [ -d "$PROJECT_ROOT/venv" ]; then
    PYTHON="$PROJECT_ROOT/venv/bin/python3"
    UVICORN="$PROJECT_ROOT/venv/bin/uvicorn"
else
    PYTHON="python3"
    UVICORN="uvicorn"
fi

# 1. Ensure migrations and seeds
echo "[1/3] Applying database migrations and initializing clinical accounts..."
$PYTHON backend/manage.py migrate --noinput
$PYTHON scripts/seed_demo_data.py

# Function to kill all background services on exit
cleanup() {
    echo ""
    echo "Terminating ONCOGENIX AI background services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Start FastAPI AI Inference Microservice
echo "[2/3] Starting FastAPI AI Inference Microservice on http://127.0.0.1:8001 ..."
PYTHONPATH="$PROJECT_ROOT" $UVICORN ai_service.app.main:app --host 127.0.0.1 --port 8001 &
FASTAPI_PID=$!

# Wait briefly for FastAPI to initialize
sleep 2

# 3. Start Django Web Application Server
echo "[3/3] Starting Unified Pure Django Web Application on http://127.0.0.1:8000 ..."
$PYTHON backend/manage.py runserver 127.0.0.1:8000 &
DJANGO_PID=$!

echo ""
echo "=========================================================="
echo " ONCOGENIX AI Precision Oncology Services are LIVE:"
echo "   - Web Application:  http://127.0.0.1:8000"
echo "   - AI API Service:   http://127.0.0.1:8001/docs"
echo "   - Institution:      Thakur Shyamnarayan College of Engineering, Mumbai"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."

wait
