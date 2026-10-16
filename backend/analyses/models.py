"""
ONCOGENIX AI - Analysis & Precision Oncology Models
Enforces strict patient data isolation with foreign keys to User.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User

STATUS_CHOICES = (
    ("PENDING", "Pending"),
    ("PROCESSING", "Processing"),
    ("COMPLETED", "Completed"),
    ("FAILED", "Failed"),
)

class Analysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyses")
    sample_id = models.CharField(max_length=150, default="UNKNOWN-SAMPLE")
    patient_identifier = models.CharField(max_length=150, blank=True, default="")
    file_name = models.CharField(max_length=255, blank=True, default="")
    file_format = models.CharField(max_length=20, default="csv")
    file_storage_path = models.TextField(blank=True, default="")
    file_storage_type = models.CharField(max_length=20, default="local")
    genome_assembly = models.CharField(max_length=20, default="GRCh37")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    analysis_type = models.CharField(max_length=50, default="classification_and_evidence")

    validation_status = models.CharField(max_length=30, default="PENDING")
    total_variants = models.IntegerField(default=0)
    distinct_genes_count = models.IntegerField(default=0)

    # Structured JSON results
    mutated_genes = models.JSONField(default=list, blank=True)
    variant_categories = models.JSONField(default=dict, blank=True)
    cancer_prediction = models.JSONField(default=dict, blank=True)
    evidence_matches = models.JSONField(default=list, blank=True)
    observed_variants = models.JSONField(default=list, blank=True)
    validation_notes = models.JSONField(default=list, blank=True)

    pdf_report_path = models.TextField(blank=True, default="")
    pdf_report_storage_type = models.CharField(max_length=20, default="local")
    error_message = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Analysis {self.id} - {self.sample_id} ({self.status})"
