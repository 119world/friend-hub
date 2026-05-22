import { env } from "../config/env.js";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (token !== env.adminToken) return res.status(401).json({ message: "Admin access required" });
  next();
}
