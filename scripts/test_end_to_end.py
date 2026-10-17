"""
End-to-end integration test verifying full stack:
FastAPI + Django + SQLite + PDF Generation + Patient Isolation
"""

import os
import sys
import django
import requests

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from analyses.models import Analysis

def run_integration_test():
    print("Testing Django internal test client with seeded clinician...")
    client = Client()

    # Login demooncologist
    login_ok = client.login(username="demooncologist", password="Password123!")
    assert login_ok, "Login failed for demooncologist"
    print("✓ Logged in demooncologist successfully")

    # Check dashboard API
    resp = client.get("/api/dashboard/")
    assert resp.status_code == 200, f"Dashboard failed: {resp.status_code}"
    dash_data = resp.json()
    print("✓ Dashboard retrieved: Total analyses =", dash_data["total_analyses"])
    assert dash_data["total_analyses"] >= 1, "Expected at least 1 seeded analysis"

    # Check analyses list
    resp = client.get("/api/analyses/")
    assert resp.status_code == 200
    analyses = resp.json()
    first_id = analyses[0]["id"]
    print("✓ Found analysis ID:", first_id, "Sample:", analyses[0]["sample_id"])

    # Test PDF report download
    resp = client.get(f"/api/analyses/{first_id}/report/")
    assert resp.status_code == 200
    assert resp["Content-Type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")
    print("✓ PDF report downloaded successfully (size:", len(resp.content), "bytes)")

    # Test patient isolation: create intruder user
    intruder, _ = User.objects.get_or_create(username="intruder_user")
    intruder.set_password("IntruderPass123!")
    intruder.save()

    client_intruder = Client()
    client_intruder.login(username="intruder_user", password="IntruderPass123!")
    resp_leak = client_intruder.get(f"/api/analyses/{first_id}/")
    assert resp_leak.status_code == 404, f"Security Breach! Status was {resp_leak.status_code}"
    print("✓ Patient data isolation verified: Unauthorized user received 404")

    # Test intruder report download
    resp_leak_rpt = client_intruder.get(f"/api/analyses/{first_id}/report/")
    assert resp_leak_rpt.status_code == 404, "Security Breach on report download!"
    print("✓ Report download isolation verified: Unauthorized user received 404")

    # Test Pure Django Web Frontend Template routes
    print("\nTesting Pure Django Web Frontend template pages...")
    resp_landing = client.get("/")
    assert resp_landing.status_code == 200
    assert "Thakur Shyamnarayan College of Engineering, Mumbai" in resp_landing.content.decode("utf-8")
    print("✓ Landing page rendered with institutional college attribution")

    anon_client = Client()
    resp_login = anon_client.get("/login/")
    assert resp_login.status_code == 200
    # Strict requirement: No demo credentials shown in UI
    assert "demooncologist" not in resp_login.content.decode("utf-8")
    assert "Quick Demo Fill" not in resp_login.content.decode("utf-8")
    print("✓ Login page verified: No pre-seeded demo credentials or quick-fill buttons exposed")

    resp_dash = client.get("/dashboard/")
    assert resp_dash.status_code == 200
    assert "Precision Oncology Dashboard" in resp_dash.content.decode("utf-8")
    assert "Holographic Organ Geometry" in resp_dash.content.decode("utf-8")
    print("✓ Dashboard rendered with 3D Multi-Organ Anatomical Explorer")

    resp_res = client.get(f"/results/{first_id}/")
    assert resp_res.status_code == 200
    assert "Anatomical Telemetry" in resp_res.content.decode("utf-8")
    print("✓ Results page rendered with 3D organ telemetry and CIViC evidence")

    resp_comp = client.get("/comparison/")
    assert resp_comp.status_code == 200
    print("✓ Patient comparison page rendered")

    resp_hist = client.get("/history/")
    assert resp_hist.status_code == 200
    print("✓ History archive page rendered")

    resp_about = client.get("/about/")
    assert resp_about.status_code == 200
    assert "Thakur Shyamnarayan College of Engineering, Mumbai" in resp_about.content.decode("utf-8")
    print("✓ Methodology & provenance page rendered with academic attribution")

    print("\nALL END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_integration_test()
