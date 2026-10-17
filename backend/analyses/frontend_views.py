"""
ONCOGENIX AI - Pure Django Frontend View Controllers
Serves all templates directly without React:
- Landing Page (3D DNA Double Helix & Ambient biotech canvas)
- Clinician Login (Strictly professional, NO demo credentials shown)
- Registration (Institutional researcher & clinician onboarding)
- Dashboard (3D Anatomical Multi-Organ Explorer: Breast, Lungs, Pancreas, Colon)
- DNA Analysis Assay Upload (cBioPortal MAF, CSV, TSV, VCF or direct gene entry)
- Results & Diagnostic Reports (3D Organ preview, Chart.js probabilities, CIViC matches)
- Patient Comparator (Jaccard divergence index & differential therapies)
- History & Reports Archive (Patient data isolation & PDF report downloads)
- Methodology & Provenance (Thakur Shyamnarayan College of Engineering, Mumbai)
"""

import json
import logging
import os
import requests
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_http_methods

from .models import Analysis
from .report_generator import generate_patient_pdf_report
from storage.firebase_storage import storage_service

logger = logging.getLogger("frontend_views")

def landing_page(request):
    """Renders the high-impact futuristic biotech landing page."""
    return render(request, "landing.html")

def login_page(request):
    """
    Renders professional clinical login portal and authenticates user.
    Strictly NO pre-seeded demo credentials or quick-fill buttons displayed.
    """
    if request.user.is_authenticated:
        return redirect("/dashboard/")

    next_url = request.GET.get("next") or request.POST.get("next") or "/dashboard/"
    error = None

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "").strip()

        if not username or not password:
            error = "Please provide both your username and password."
        else:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect(next_url)
            else:
                error = "Authentication failed. Invalid username or password. Please verify your clinical credentials."

    return render(request, "login.html", {
        "error": error,
        "next": next_url,
    })

def register_page(request):
    """Renders institutional researcher and clinician onboarding."""
    if request.user.is_authenticated:
        return redirect("/dashboard/")

    error = None
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        role = request.POST.get("role", "Oncologist")
        affiliation = request.POST.get("affiliation", "").strip()
        password = request.POST.get("password", "").strip()
        password_confirm = request.POST.get("password_confirm", "").strip()

        if not username or not email or not password:
            error = "Please complete all required fields."
        elif password != password_confirm:
            error = "Password confirmation does not match."
        elif len(password) < 8:
            error = "Password must be at least 8 characters long."
        elif User.objects.filter(username=username).exists():
            error = f"Username '{username}' is already registered."
        elif User.objects.filter(email=email).exists():
            error = f"Email address '{email}' is already in use."
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            # Link profile role and affiliation
            profile = getattr(user, "profile", None)
            if profile:
                profile.role = role
                profile.institution = affiliation
                profile.save()

            login(request, user)
            return redirect("/dashboard/")

    return render(request, "register.html", {"error": error})

def logout_page(request):
    """Logs out user and redirects to login portal."""
    logout(request)
    return redirect("/login/")

@login_required(login_url="/login/")
def dashboard_page(request):
    """
    Renders clinical dashboard with:
    - 3D Interactive Anatomical Organ Explorer (Breast, Lungs, Pancreas, Colon, Full Body)
    - Telemetry metrics and recent patient assays
    """
    user_analyses = Analysis.objects.filter(user=request.user)
    total_analyses = user_analyses.count()
    recent_analyses = user_analyses[:5]

    gene_counts = {}
    for a in user_analyses:
        for g in (a.mutated_genes or []):
            gene_counts[g] = gene_counts.get(g, 0) + 1
    frequent_genes = sorted(gene_counts.items(), key=lambda x: x[1], reverse=True)[:6]

    # Model info from FastAPI AI service
    ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
    model_info = {"model_name": "GradientBoostingClassifier", "num_features": 40, "classes": ["LUAD", "PAAD", "BRCA", "COADREAD"]}
    try:
        r = requests.get(f"{ai_service_url}/model/info", timeout=3)
        if r.status_code == 200:
            model_info = r.json()
    except Exception:
        pass

    return render(request, "dashboard.html", {
        "total_analyses": total_analyses,
        "recent_analyses": recent_analyses,
        "frequent_genes": frequent_genes,
        "model_info": model_info,
    })

@login_required(login_url="/login/")
def analysis_page(request):
    """
    Renders mutation assay upload form (GET) and processes somatic mutations
    via FastAPI AI inference microservice (POST).
    """
    error = None

    if request.method == "POST":
        sample_id = request.POST.get("sample_id", "").strip() or "SAMPLE-001"
        patient_identifier = request.POST.get("patient_identifier", "").strip()
        genome_build = request.POST.get("genome_build", "GRCh38")
        suspected_cancer_type = request.POST.get("suspected_cancer_type", "").strip()
        direct_genes = request.POST.get("direct_genes", "").strip()
        uploaded_file = request.FILES.get("mutation_file")

        raw_content = ""
        file_format = "csv"
        file_name = f"{sample_id}.csv"

        if uploaded_file:
            file_name = uploaded_file.name
            raw_bytes = uploaded_file.read()
            raw_content = raw_bytes.decode("utf-8", errors="replace")
            if file_name.endswith(".tsv"):
                file_format = "tsv"
            elif file_name.endswith(".maf"):
                file_format = "maf"
            elif file_name.endswith(".vcf"):
                file_format = "vcf"
        elif direct_genes:
            genes = [g.strip().upper() for g in direct_genes.replace("\n", ",").replace(";", ",").split(",") if g.strip()]
            lines = ["Hugo_Symbol,Variant_Classification,Tumor_Sample_Barcode"]
            for g in genes:
                lines.append(f"{g},Missense_Mutation,{sample_id}")
            raw_content = "\n".join(lines)
            file_format = "csv"
            file_name = f"{sample_id}_direct.csv"
        else:
            error = "Please upload a mutation file (.csv, .tsv, .maf, .vcf) or provide a list of driver gene symbols."
            return render(request, "analysis.html", {"error": error})

        # Save raw mutation assay file locally or via Firebase
        storage_path, storage_type = storage_service.save_file(
            raw_content.encode("utf-8"), file_name, subfolder="uploads"
        )

        analysis = Analysis.objects.create(
            user=request.user,
            sample_id=sample_id,
            patient_identifier=patient_identifier,
            file_name=file_name,
            file_format=file_format,
            file_storage_path=storage_path,
            file_storage_type=storage_type,
            genome_assembly=genome_build,
            status="PROCESSING"
        )

        # Call FastAPI inference service
        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        try:
            payload = {
                "sample_id": sample_id,
                "genome_assembly": genome_build,
                "file_format": file_format,
                "raw_content": raw_content
            }
            resp = requests.post(f"{ai_service_url}/analyze/mutations", json=payload, timeout=25)
            if resp.status_code != 200:
                analysis.status = "FAILED"
                analysis.error_message = f"Inference service returned status {resp.status_code}: {resp.text}"
                analysis.save()
                return render(request, "analysis.html", {
                    "error": f"AI inference error: {resp.text}"
                })

            data = resp.json()

            analysis.status = "COMPLETED"
            analysis.validation_status = data.get("validation_status", "PASSED")
            analysis.total_variants = data.get("valid_variants_processed", 0)
            analysis.distinct_genes_count = data.get("distinct_mutated_genes_count", 0)
            analysis.mutated_genes = data.get("mutated_genes", [])
            analysis.variant_categories = data.get("variant_categories", {})
            analysis.observed_variants = data.get("observed_variants", [])
            analysis.evidence_matches = data.get("evidence_matches", [])
            analysis.cancer_prediction = data.get("cancer_prediction") or {}
            analysis.validation_notes = data.get("validation_notes", [])

            # Generate PDF report automatically
            try:
                report_dict = {
                    "report_id": f"OGX-{str(analysis.id)[:8].upper()}",
                    "sample_id": analysis.sample_id,
                    "created_at": analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "genome_assembly": analysis.genome_assembly,
                    "validation_status": analysis.validation_status,
                    "valid_variants_processed": analysis.total_variants,
                    "cancer_prediction": analysis.cancer_prediction,
                    "observed_variants": analysis.observed_variants,
                    "evidence_matches": analysis.evidence_matches
                }
                pdf_bytes = generate_patient_pdf_report(report_dict)
                pdf_path, pdf_type = storage_service.save_file(
                    pdf_bytes, f"report_{analysis.sample_id}.pdf", subfolder="reports"
                )
                analysis.pdf_report_path = pdf_path
                analysis.pdf_report_storage_type = pdf_type
            except Exception as e:
                logger.error("Failed to generate PDF report: %s", e)

            analysis.save()
            return redirect(f"/results/{analysis.id}/")

        except Exception as e:
            analysis.status = "FAILED"
            analysis.error_message = str(e)
            analysis.save()
            return render(request, "analysis.html", {
                "error": f"Connection error contacting AI microservice at {ai_service_url}: {e}"
            })

    return render(request, "analysis.html")

@login_required(login_url="/login/")
def results_page(request, pk):
    """
    Renders precision oncology diagnostic report for a specific assay.
    Enforces strict patient data isolation: user can only view their own analyses.
    """
    analysis = get_object_or_404(Analysis, id=pk, user=request.user)
    return render(request, "results.html", {"analysis": analysis})

@login_required(login_url="/login/")
def comparison_page(request):
    """
    Renders multi-patient genomic profile comparison tool.
    Computes Jaccard divergence index and differential therapy candidates.
    """
    user_analyses = Analysis.objects.filter(user=request.user)
    sample_a_id = request.GET.get("sample_a") or request.GET.get("sample_a_id")
    sample_b_id = request.GET.get("sample_b") or request.GET.get("sample_b_id")

    comparison_data = None

    if sample_a_id and sample_b_id:
        try:
            a = user_analyses.get(id=sample_a_id)
            b = user_analyses.get(id=sample_b_id)

            genes_a = set(a.mutated_genes or [])
            genes_b = set(b.mutated_genes or [])

            shared = sorted(list(genes_a & genes_b))
            unique_a = sorted(list(genes_a - genes_b))
            unique_b = sorted(list(genes_b - genes_a))
            union = genes_a | genes_b

            jaccard = (len(shared) / len(union) * 100.0) if union else 0.0

            comparison_data = {
                "profile_a": {
                    "id": str(a.id),
                    "sample_id": a.sample_id,
                    "cancer_type": a.predicted_cancer_name,
                    "genes": sorted(list(genes_a)),
                },
                "profile_b": {
                    "id": str(b.id),
                    "sample_id": b.sample_id,
                    "cancer_type": b.predicted_cancer_name,
                    "genes": sorted(list(genes_b)),
                },
                "shared_genes": shared,
                "unique_to_a": unique_a,
                "unique_to_b": unique_b,
                "jaccard_index": jaccard,
                "jaccard_index_negative": round(100 - jaccard, 1),
            }
        except Exception as e:
            logger.warning("Comparison query error: %s", e)

    return render(request, "comparison.html", {
        "user_analyses": user_analyses,
        "selected_a_id": sample_a_id,
        "selected_b_id": sample_b_id,
        "comparison_data": comparison_data,
    })

@login_required(login_url="/login/")
def history_page(request):
    """
    Renders audit log and archive of all patient assays belonging to the authenticated user.
    """
    analyses = Analysis.objects.filter(user=request.user)
    return render(request, "history.html", {"analyses": analyses})

@login_required(login_url="/login/")
@require_http_methods(["POST"])
def delete_analysis_view(request, pk):
    """
    Securely deletes a patient analysis record belonging to the authenticated user.
    """
    analysis = get_object_or_404(Analysis, id=pk, user=request.user)
    analysis.delete()
    return redirect("/history/")

@login_required(login_url="/login/")
def download_pdf_report(request, pk):
    """
    Serves official clinical PDF report for the specified assay.
    Enforces user isolation.
    """
    analysis = get_object_or_404(Analysis, id=pk, user=request.user)

    # Check if file exists on disk
    if analysis.pdf_report_path and os.path.exists(analysis.pdf_report_path):
        with open(analysis.pdf_report_path, "rb") as f:
            pdf_bytes = f.read()
    else:
        # Re-generate on the fly
        report_dict = {
            "report_id": f"OGX-{str(analysis.id)[:8].upper()}",
            "sample_id": analysis.sample_id,
            "created_at": analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "genome_assembly": analysis.genome_assembly,
            "validation_status": analysis.validation_status,
            "valid_variants_processed": analysis.total_variants,
            "cancer_prediction": analysis.cancer_prediction,
            "observed_variants": analysis.observed_variants,
            "evidence_matches": analysis.evidence_matches
        }
        pdf_bytes = generate_patient_pdf_report(report_dict)

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="oncogenix_report_{analysis.sample_id}.pdf"'
    return response

def about_page(request):
    """
    Renders scientific methodology, TCGA PanCancer provenance, zero-leakage ML architecture,
    and Thakur Shyamnarayan College of Engineering, Mumbai academic accreditation.
    """
    return render(request, "about.html")
