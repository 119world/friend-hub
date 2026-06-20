import { Cashfree } from "cashfree-pg";
import { env } from "./env.js";

const cashfreeEnvironment = env.cashfree.env === "SANDBOX" ? Cashfree.SANDBOX : Cashfree.PRODUCTION;

export const cashfree = new Cashfree(
  cashfreeEnvironment,
  env.cashfree.clientId || "",
  env.cashfree.clientSecret || ""
);

export function hasCashfreeCredentials() {
  return Boolean(env.cashfree.clientId && env.cashfree.clientSecret);
}
