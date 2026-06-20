import { Cashfree, CFEnvironment } from "cashfree-pg";
import { env } from "./env.js";

const cashfreeEnvironment = env.cashfree.env === "SANDBOX" ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;

export const cashfree = new Cashfree(
  cashfreeEnvironment,
  env.cashfree.clientId || "",
  env.cashfree.clientSecret || ""
);

export function hasCashfreeCredentials() {
  return Boolean(env.cashfree.clientId && env.cashfree.clientSecret);
}
