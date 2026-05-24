import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function issuePartnerToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function requirePartner(req, res, next) {
  const header = req.headers["x-partner-token"] || req.headers.authorization || "";
  const token = String(header).startsWith("Bearer ") ? String(header).slice(7) : String(header);
  if (!token) return res.status(401).json({ message: "Partner login required" });
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.partner = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid partner session" });
  }
}
