import { env } from "../config/env.js";

const memory = {
  adminAccounts: [
    {
      id: "admin_default",
      loginId: env.adminUsername,
      displayName: "Main Admin",
      password: env.adminPassword,
      role: "super_admin",
      active: true
    }
  ],
  partnerAccounts: [
    {
      id: "partner_sonu119",
      partnerId: "partner_sonu119",
      loginId: env.defaultPartnerLoginId,
      displayName: "Sonu Partner",
      temporaryAccessCode: env.defaultPartnerPassword,
      active: true
    }
  ]
};

export function listCredentialResource(name) {
  return memory[name] || [];
}

export function upsertCredentialResource(name, item) {
  const list = memory[name] || [];
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) list[index] = { ...list[index], ...item };
  else list.unshift(item);
  memory[name] = list.slice(0, 100);
  return item;
}

export function isValidAdminCredential(loginId, password) {
  return memory.adminAccounts.some((account) =>
    account.active !== false &&
    String(account.loginId || "").trim() === String(loginId || "").trim() &&
    String(account.password || account.temporaryAccessCode || "") === String(password || "")
  );
}
