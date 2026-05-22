import Razorpay from "razorpay";
import { env } from "./env.js";

export const razorpay = new Razorpay({
  key_id: env.razorpay.keyId || "rzp_test_missing",
  key_secret: env.razorpay.keySecret || "missing"
});
