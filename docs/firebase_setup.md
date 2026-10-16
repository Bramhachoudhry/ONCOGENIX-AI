# ONCOGENIX AI — Firebase Setup & Cloud Storage Architecture

## 1. Overview

ONCOGENIX AI integrates with Firebase across two tiers:
1. **Frontend**: Firebase Client SDK for web analytics and direct authentication integration.
2. **Backend**: Firebase Admin SDK for authorized server-side file and report storage in Google Cloud Storage.

---

## 2. Frontend Client Configuration

The React frontend uses the official project configuration located in `frontend/src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAF3MjhSvTWjjebhVY-j_DRFaEDEAloS0w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oncogenix-ai-aab38.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oncogenix-ai-aab38",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oncogenix-ai-aab38.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178152879328",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178152879328:web:fb2462f4faecedac160c85",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HX44QV6635"
};
```

---

## 3. Backend Firebase Admin SDK Setup

To enable Firebase Cloud Storage in the Django backend:

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) -> **Project Settings** -> **Service Accounts**.
2. Click **Generate new private key** and download the resulting `.json` key file.
3. Place the file securely in your server environment (e.g. `backend/config/firebase_service_account.json`).
4. **Never commit this file to GitHub.** (It is already added to `.gitignore`).
5. Set the environment variable in `.env`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY="/path/to/firebase_service_account.json"
   FIREBASE_STORAGE_BUCKET="oncogenix-ai-aab38.firebasestorage.app"
   ```

---

## 4. Automatic Development Fallback

If `FIREBASE_SERVICE_ACCOUNT_KEY` is not configured or the key file is not present:
- The system automatically detects this and falls back to **local secure object storage** inside `backend/media/uploads/` and `backend/media/reports/`.
- All operations (uploading mutation assays, generating and downloading clinical reports) continue working without interruption.
- The `/api/health/` endpoint explicitly reports whether `Firebase` or `Local Secure Fallback` is the active storage engine.
