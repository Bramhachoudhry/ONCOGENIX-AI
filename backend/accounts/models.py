"""
ONCOGENIX AI - User & Clinical Profile Models
Extends standard Django User with institutional roles (Patient, Oncologist, Researcher, Admin).
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

ROLE_CHOICES = (
    ("patient", "Patient"),
    ("oncologist", "Clinical Oncologist"),
    ("researcher", "Bioinformatics Researcher"),
    ("admin", "Administrator"),
)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="patient")
    institution = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, "profile"):
            instance.profile.save()
