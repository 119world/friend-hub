import { env } from "../config/env.js";
import { db, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { isValidAdminCredential } from "../services/credentialStore.js";

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const loginId = req.headers["x-admin-id"];
  const password = req.headers["x-admin-password"];
  if (token === env.adminToken || isValidAdminCredential(loginId, password)) return next();
  if (hasFirestoreCredentials && loginId && password) {
    try {
      const snap = await db.collection("adminAccounts")
        .where("loginId", "==", String(loginId))
        .where("active", "==", true)
        .limit(1)
        .get();
      const account = snap.docs[0]?.data();
      if (account && String(account.password || "") === String(password)) return next();
    } catch {}
  }
  return res.status(401).json({ message: "Admin access required" });
}
