"""
ONCOGENIX AI - Storage Provider
Manages secure storage of uploaded genomic files and generated clinical reports.
Integrates with Firebase Storage via Firebase Admin SDK with seamless local fallback
when Firebase credentials are unconfigured.
"""

import os
import logging
import uuid
from typing import Optional, Tuple

logger = logging.getLogger("storage")

class StorageService:
    def __init__(self):
        self.firebase_initialized = False
        self.bucket = None
        self.local_storage_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media"
        )
        os.makedirs(self.local_storage_dir, exist_ok=True)
        self._init_firebase()

    def _init_firebase(self):
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
        bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET", "oncogenix-ai-aab38.firebasestorage.app")

        if cred_path and os.path.exists(cred_path):
            try:
                import firebase_admin
                from firebase_admin import credentials, storage

                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
                self.bucket = storage.bucket()
                self.firebase_initialized = True
                logger.info("Firebase Storage initialized successfully with bucket: %s", bucket_name)
            except Exception as e:
                logger.warning("Failed to initialize Firebase Storage: %s. Using local storage fallback.", e)
                self.firebase_initialized = False
        else:
            logger.info("Firebase credentials not configured or file absent (%s). Using secure local storage fallback.", cred_path)
            self.firebase_initialized = False

    def save_file(self, content_bytes: bytes, filename: str, subfolder: str = "uploads") -> Tuple[str, str]:
        """
        Saves file bytes.
        Returns: (storage_path_or_url, storage_type: 'firebase' | 'local')
        """
        unique_name = f"{uuid.uuid4().hex[:12]}_{filename}"

        if self.firebase_initialized and self.bucket:
            try:
                blob_path = f"{subfolder}/{unique_name}"
                blob = self.bucket.blob(blob_path)
                blob.upload_from_string(content_bytes)
                # Generate a signed URL valid for 1 hour or return path
                url = blob.generate_signed_url(expiration=3600)
                logger.info("Saved file to Firebase Storage: %s", blob_path)
                return url, "firebase"
            except Exception as e:
                logger.warning("Firebase upload failed: %s. Falling back to local storage.", e)

        # Fallback to local media folder
        dest_dir = os.path.join(self.local_storage_dir, subfolder)
        os.makedirs(dest_dir, exist_ok=True)
        local_path = os.path.join(dest_dir, unique_name)
        with open(local_path, "wb") as f:
            f.write(content_bytes)
        logger.info("Saved file to local storage: %s", local_path)
        return local_path, "local"

    def read_file(self, file_path: str) -> Optional[bytes]:
        if not file_path:
            return None
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                return f.read()
        return None

    def delete_file(self, file_path: str):
        if not file_path:
            return
        if self.firebase_initialized and self.bucket and not os.path.exists(file_path):
            try:
                # If path contains subfolder
                blob = self.bucket.blob(file_path)
                if blob.exists():
                    blob.delete()
                    logger.info("Deleted file from Firebase: %s", file_path)
            except Exception as e:
                logger.warning("Failed to delete Firebase blob: %s", e)
        elif os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("Deleted local file: %s", file_path)
            except Exception as e:
                logger.warning("Failed to delete local file: %s", e)

storage_service = StorageService()
