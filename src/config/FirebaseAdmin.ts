import admin from "firebase-admin";

// ✅ Load service account from JSON (download from Firebase console → Project Settings → Service Accounts)
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
