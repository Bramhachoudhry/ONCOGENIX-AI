"""
ONCOGENIX AI - Accounts Serializers
Handles registration, login, and user profile serialization.
"""

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    institution = serializers.CharField(source="profile.institution", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "institution", "is_staff"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default="patient")
    institution = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "password", "confirm_password", "role", "institution"]

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role", "patient")
        institution = validated_data.pop("institution", "")
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"]
        )

        # Profile is created via signal, update fields
        profile = user.profile
        profile.role = role
        profile.institution = institution
        profile.save()

        return user

class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login_val = attrs.get("username_or_email")
        password = attrs.get("password")

        # Support both username or email login
        user = None
        if "@" in login_val:
            try:
                user_obj = User.objects.get(email__iexact=login_val)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        else:
            user = authenticate(username=login_val, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials provided.")
        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")

        attrs["user"] = user
        return attrs
