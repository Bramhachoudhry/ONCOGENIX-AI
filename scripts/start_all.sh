#!/usr/bin/env bash
# ========================================================
# ONCOGENIX AI - Unified Local Development Startup Script
# Starts FastAPI (8001), Django (8000), and React Vite (5173)
# ========================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo " Starting ONCOGENIX AI Precision Oncology Ecosystem"
echo "=========================================================="

# Activate virtual environment
if [ -d "$PROJECT_ROOT/venv" ]; then
    PYTHON="$PROJECT_ROOT/venv/bin/python3"
    UVICORN="$PROJECT_ROOT/venv/bin/uvicorn"
else
    PYTHON="python3"
    UVICORN="uvicorn"
fi

# Ensure migrations and seeds
echo "[1/4] Applying database migrations and seeding demo accounts..."
$PYTHON backend/manage.py migrate --noinput
$PYTHON scripts/seed_demo_data.py

# Function to kill all children on exit
cleanup() {
    echo ""
    echo "Terminating ONCOGENIX AI background services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI AI Inference Service
echo "[2/4] Starting FastAPI AI Inference Service on http://127.0.0.1:8001 ..."
PYTHONPATH="$PROJECT_ROOT" $UVICORN ai_service.app.main:app --host 127.0.0.1 --port 8001 &
FASTAPI_PID=$!

# Wait briefly for FastAPI to initialize
sleep 2

# 2. Start Django Backend Service
echo "[3/4] Starting Django Application Backend on http://127.0.0.1:8000 ..."
$PYTHON backend/manage.py runserver 127.0.0.1:8000 &
DJANGO_PID=$!

# 3. Start Vite React Frontend
echo "[4/4] Starting Vite React Frontend on http://127.0.0.1:5173 ..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " ONCOGENIX AI Services are LIVE:"
echo "   - React Frontend:   http://localhost:5173"
echo "   - Django Backend:   http://127.0.0.1:8000"
echo "   - FastAPI Engine:   http://127.0.0.1:8001/docs"
echo "   - Demo Clinician:   demooncologist / Password123!"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."

wait
