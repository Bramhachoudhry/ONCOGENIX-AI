#!/usr/bin/env bash
# ========================================================
# ONCOGENIX AI - Complete Automated Test Suite Runner
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
echo " [1/3] Running AI Inference & Validation Unit Tests..."
echo "=========================================================="
PYTHONPATH="$PROJECT_ROOT" $PYTHON -m unittest ai_service/tests/test_ai_service.py

echo ""
echo "=========================================================="
echo " [2/3] Running Django Backend & Patient Isolation Tests..."
echo "=========================================================="
$PYTHON backend/manage.py test tests

echo ""
echo "=========================================================="
echo " [3/3] Running Frontend TypeScript Compilation & Build..."
echo "=========================================================="
cd "$PROJECT_ROOT/frontend"
npm run build

echo ""
echo "=========================================================="
echo " ALL TESTS PASSED SUCCESSFULLY! (AI, Backend, Frontend)"
echo "=========================================================="
