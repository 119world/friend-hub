import { auth } from "../config/firebaseAdmin.js";

export async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      const guestUid = req.headers["x-guest-uid"];
      if (guestUid) {
        if (!/^local_\d+$|^[A-Za-z0-9_-]{8,128}$/.test(String(guestUid))) {
          return res.status(401).json({ message: "Invalid guest id" });
        }
        req.user = { uid: guestUid, guest: true };
        return next();
      }
      return res.status(401).json({ message: "Login required" });
    }
    req.user = await auth.verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid user token" });
  }
}
