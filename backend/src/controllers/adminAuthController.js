import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { findAdminAccountFromMemory } from "../services/credentialStore.js";

function clean(value) {
  return String(value || "").trim();
}

function signAdminToken(account) {
  if (!env.jwtSecret) {
    const error = new Error("Admin auth is not configured. Set JWT_SECRET on the backend.");
    error.status = 500;
    throw error;
  }
  return jwt.sign(
    {
      type: "admin",
      loginId: account.loginId,
      role: account.role || "admin"
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

async function findAdminAccount(loginId, password) {
  const localAccount = findAdminAccountFromMemory(loginId, password);
  if (localAccount) return localAccount;

  if (!hasFirestoreCredentials || !loginId || !password) return null;
  const snap = await db.collection("adminAccounts")
    .where("loginId", "==", clean(loginId))
    .where("active", "==", true)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  const account = doc?.data();
  if (!account || String(account.password || "") !== String(password || "")) return null;
  return {
    id: doc.id,
    loginId: account.loginId,
    displayName: account.displayName || account.loginId,
    role: account.role || "admin",
    active: account.active
  };
}

export async function adminLogin(req, res) {
  const loginId = clean(req.body?.loginId || req.body?.username);
  const password = String(req.body?.password || "");
  const adminToken = clean(req.body?.adminToken);

  if (adminToken) {
    if (adminToken !== env.adminToken) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    const account = { loginId: "admin_token", displayName: "Admin User", role: "super_admin" };
    return res.json({
      token: signAdminToken(account),
      admin: account
    });
  }

  if (!loginId || !password) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const account = await findAdminAccount(loginId, password);
  if (!account) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  return res.json({
    token: signAdminToken(account),
    admin: {
      loginId: account.loginId,
      displayName: account.displayName || account.loginId,
      role: account.role || "admin"
    }
  });
}

export function adminSession(req, res) {
  res.json({
    ok: true,
    admin: {
      loginId: req.admin?.loginId || "admin",
      role: req.admin?.role || "admin"
    }
  });
}
