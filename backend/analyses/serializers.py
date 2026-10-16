"""
ONCOGENIX AI - Analysis Serializers
"""

from rest_framework import serializers
from .models import Analysis

class AnalysisListSerializer(serializers.ModelSerializer):
    top_prediction = serializers.SerializerMethodField()
    confidence = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = [
            "id", "sample_id", "patient_identifier", "file_name", "status",
            "validation_status", "total_variants", "distinct_genes_count",
            "top_prediction", "confidence", "created_at"
        ]

    def get_top_prediction(self, obj):
        pred = obj.cancer_prediction or {}
        if pred.get("is_abstention"):
            return "Inconclusive / Abstention"
        return pred.get("predicted_cancer_name") or pred.get("predicted_cancer_code") or "N/A"

    def get_confidence(self, obj):
        pred = obj.cancer_prediction or {}
        return pred.get("confidence_score") or 0.0

class AnalysisDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at", "updated_at"]

class AnalysisCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False, write_only=True)
    raw_content = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Analysis
        fields = [
            "sample_id", "patient_identifier", "genome_assembly", "analysis_type",
            "file_format", "file", "raw_content"
        ]
