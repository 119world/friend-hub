import { env } from "../config/env.js";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "main";
}

const defaultPartnerId = `partner_${slugify(env.defaultPartnerLoginId)}`;

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
      id: defaultPartnerId,
      partnerId: defaultPartnerId,
      loginId: env.defaultPartnerLoginId,
      displayName: "Main Partner",
      password: env.defaultPartnerPassword,
      temporaryAccessCode: env.defaultPartnerPassword,
      role: "main_partner",
      isMain: true,
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

export function deleteCredentialResource(name, id) {
  const key = clean(id);
  const list = memory[name] || [];
  memory[name] = list.filter((entry) => entry.id !== key && entry.partnerId !== key);
  return true;
}

export function clearCredentialResource(name) {
  memory[name] = [];
  return true;
}

export function isValidAdminCredential(loginId, password) {
  return Boolean(findAdminAccountFromMemory(loginId, password));
}

export function findAdminAccountFromMemory(loginId, password) {
  return memory.adminAccounts.find((account) =>
    account.active !== false &&
    clean(account.loginId) === clean(loginId) &&
    String(account.password || account.temporaryAccessCode || "") === String(password || "")
  ) || null;
}

export function findPartnerAccountFromMemory(loginId, password) {
  return memory.partnerAccounts.find((account) =>
    account.active !== false &&
    clean(account.loginId) === clean(loginId) &&
    clean(account.password || account.temporaryAccessCode || "") === clean(password)
  ) || null;
}

export function findPartnerAccountByIdFromMemory(id) {
  return memory.partnerAccounts.find((account) => account.id === id || account.partnerId === id) || null;
}
