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

function clean(value) {
  return String(value || "").trim();
}

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
    clean(account.loginId) === clean(loginId) &&
    String(account.password || account.temporaryAccessCode || "") === String(password || "")
  );
}

export function findPartnerAccountFromMemory(loginId, password) {
  return memory.partnerAccounts.find((account) =>
    account.active !== false &&
    clean(account.loginId) === clean(loginId) &&
    String(account.password || account.temporaryAccessCode || "") === String(password || "")
  ) || null;
}

export function findPartnerAccountByIdFromMemory(id) {
  return memory.partnerAccounts.find((account) => account.id === id || account.partnerId === id) || null;
}
