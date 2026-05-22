import crypto from "crypto";

export function verifyRazorpaySignature(payload, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ""));
}
