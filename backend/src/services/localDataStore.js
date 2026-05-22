import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { defaultLocalStore } from "./localDefaults.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "localStore.json");
let cache = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyDefaults(store) {
  let changed = false;
  for (const [name, defaults] of Object.entries(defaultLocalStore)) {
    if (!Array.isArray(store[name])) {
      store[name] = clone(defaults);
      changed = true;
    }
  }
  return changed;
}

async function readStore() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(dataFile, "utf8"));
  } catch {
    cache = {};
  }
  if (applyDefaults(cache)) {
    await writeStore(cache);
  }
  return cache;
}

async function writeStore(store) {
  cache = store;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
}

export async function listLocalResource(name) {
  const store = await readStore();
  return Array.isArray(store[name]) ? store[name] : [];
}

export async function upsertLocalResource(name, item) {
  const store = await readStore();
  const items = Array.isArray(store[name]) ? store[name] : [];
  store[name] = [item, ...items.filter((old) => old.id !== item.id)].slice(0, 500);
  await writeStore(store);
  return item;
}

export async function getLocalResource(name, id) {
  const items = await listLocalResource(name);
  return items.find((item) => item.id === id) || null;
}
