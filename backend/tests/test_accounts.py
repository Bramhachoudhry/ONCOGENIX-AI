"""
Automated tests for Django Accounts & Authentication
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

class AccountsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@oncogenix.ai",
            password="SecurePassword123!"
        )

    def test_registration_success(self):
        payload = {
            "username": "newoncologist",
            "email": "onco@hospital.org",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "oncologist",
            "institution": "Memorial Cancer Center"
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["user"]["role"], "oncologist")

    def test_registration_password_mismatch(self):
        payload = {
            "username": "badpassuser",
            "email": "bad@oncogenix.ai",
            "password": "Password123!",
            "confirm_password": "MismatchPassword!"
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success_username(self):
        resp = self.client.post("/api/auth/login/", {
            "username_or_email": "testuser",
            "password": "SecurePassword123!"
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("token", resp.data)

    def test_login_success_email(self):
        resp = self.client.post("/api/auth/login/", {
            "username_or_email": "testuser@oncogenix.ai",
            "password": "SecurePassword123!"
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("token", resp.data)

    def test_me_authenticated(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "testuser")

    def test_me_unauthenticated(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
