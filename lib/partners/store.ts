// Partner storage. Uses Netlify Blobs in production (zero-config on Netlify) and
// falls back to a local JSON file in `next dev` so the flow is testable locally.

import type { Partner, PartnerStatus } from "./types";

const KEY = "registry";

// ---- Netlify Blobs backend -------------------------------------------------

async function blobRead(): Promise<Partner[]> {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore("partners");
  const data = (await store.get(KEY, { type: "json" })) as Partner[] | null;
  return data ?? [];
}

async function blobWrite(list: Partner[]): Promise<void> {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore("partners");
  await store.setJSON(KEY, list);
}

// ---- Local file backend (dev only) -----------------------------------------

const FILE = ".data/partners.json";

async function fileRead(): Promise<Partner[]> {
  const fs = await import("node:fs/promises");
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Partner[];
  } catch {
    return [];
  }
}

async function fileWrite(list: Partner[]): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

// ---- Public API ------------------------------------------------------------

// Try Netlify Blobs first (works in the deployed function runtime with the
// auto-injected context). Locally - `next dev` - getStore has no context and
// throws, so we fall back to a JSON file. Detecting "am I on Netlify" via env
// vars is unreliable in the function runtime, so we probe by attempting Blobs.
async function readAll(): Promise<Partner[]> {
  try {
    return await blobRead();
  } catch {
    return fileRead();
  }
}

async function writeAll(list: Partner[]): Promise<void> {
  try {
    await blobWrite(list);
  } catch {
    await fileWrite(list);
  }
}

export async function listPartners(status?: PartnerStatus): Promise<Partner[]> {
  const all = await readAll();
  const filtered = status ? all.filter((p) => p.status === status) : all;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPartner(partner: Partner): Promise<void> {
  const all = await readAll();
  all.push(partner);
  await writeAll(all);
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  return (await readAll()).find((p) => p.id === id);
}

export async function setStatus(id: string, status: PartnerStatus): Promise<Partner | undefined> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  all[idx] = { ...all[idx], status };
  await writeAll(all);
  return all[idx];
}
