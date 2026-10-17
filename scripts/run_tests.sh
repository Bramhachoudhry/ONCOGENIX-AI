#!/usr/bin/env bash
# ========================================================
# ONCOGENIX AI - Complete Automated Test Suite Runner
# Pure Django Web Application + FastAPI Microservice
# Department of Artificial Intelligence & Precision Oncology Research
# Thakur Shyamnarayan College of Engineering, Mumbai
# ========================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -d "$PROJECT_ROOT/venv" ]; then
    PYTHON="$PROJECT_ROOT/venv/bin/python3"
else
    PYTHON="python3"
fi

echo "=========================================================="
echo " [1/3] Running AI Inference & Variant Validation Tests..."
echo "=========================================================="
PYTHONPATH="$PROJECT_ROOT" $PYTHON -m unittest discover -s ai_service/tests

echo ""
echo "=========================================================="
echo " [2/3] Running Django Frontend & Patient Isolation Tests..."
echo "=========================================================="
$PYTHON backend/manage.py test tests

echo ""
echo "=========================================================="
echo " [3/3] Running End-to-End System Integration Tests..."
echo "=========================================================="
$PYTHON scripts/test_end_to_end.py

echo ""
echo "=========================================================="
echo " ALL TESTS PASSED WITH 100% SUCCESS!"
echo " Institution: Thakur Shyamnarayan College of Engineering, Mumbai"
echo "=========================================================="
