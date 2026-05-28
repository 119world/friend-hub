import { env } from "../config/env.js";
import { db, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import jwt from "jsonwebtoken";
import { isValidAdminCredential } from "../services/credentialStore.js";

function verifyAdminJwt(token) {
  if (!token || !env.jwtSecret) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload?.type === "admin" && payload?.loginId) return payload;
  } catch {}
  return null;
}

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const loginId = req.headers["x-admin-id"];
  const password = req.headers["x-admin-password"];
  const session = verifyAdminJwt(token);
  if (session) {
    req.admin = session;
    return next();
  }
  if (token && token === env.adminToken) {
    req.admin = { loginId: "admin_token", role: "super_admin", type: "admin" };
    return next();
  }
  if (isValidAdminCredential(loginId, password)) {
    req.admin = { loginId, role: "super_admin", type: "admin" };
    return next();
  }
  if (hasFirestoreCredentials && loginId && password) {
    try {
      const snap = await db.collection("adminAccounts")
        .where("loginId", "==", String(loginId))
        .where("active", "==", true)
        .limit(1)
        .get();
      const account = snap.docs[0]?.data();
      if (account && String(account.password || "") === String(password)) {
        req.admin = { loginId, role: account.role || "admin", type: "admin" };
        return next();
      }
    } catch {}
  }
  return res.status(401).json({ message: "Admin access required" });
}
