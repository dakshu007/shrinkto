// ---- Free-tier usage tracking -------------------------------------------------
// Free plan: FREE_LIMIT compressions per rolling 7-day window, per browser.
// The window starts at the first compression and resets FREE_WINDOW_MS later.

import { CONFIG } from "./config.js";

const KEY = "shrinktoUsage";

async function read() {
  const data = await chrome.storage.local.get(KEY);
  let usage = data[KEY];
  if (!usage || typeof usage.count !== "number") {
    usage = { count: 0, windowStart: 0 };
  }
  // Window elapsed -> fresh allowance.
  if (usage.windowStart && Date.now() - usage.windowStart >= CONFIG.FREE_WINDOW_MS) {
    usage = { count: 0, windowStart: 0 };
    await chrome.storage.local.set({ [KEY]: usage });
  }
  return usage;
}

/** Compressions left in the current window. */
export async function freeRemaining() {
  const usage = await read();
  return Math.max(0, CONFIG.FREE_LIMIT - usage.count);
}

/** Record one successful compression. Returns the new remaining count. */
export async function recordUse() {
  const usage = await read();
  if (!usage.windowStart) usage.windowStart = Date.now();
  usage.count += 1;
  await chrome.storage.local.set({ [KEY]: usage });
  return Math.max(0, CONFIG.FREE_LIMIT - usage.count);
}

/** Human text for when the allowance resets, e.g. "3d 4h". */
export async function resetsIn() {
  const usage = await read();
  if (!usage.windowStart) return "";
  const ms = usage.windowStart + CONFIG.FREE_WINDOW_MS - Date.now();
  if (ms <= 0) return "";
  let days = Math.floor(ms / 86400000);
  let hours = Math.ceil((ms % 86400000) / 3600000);
  if (hours === 24) {
    days += 1;
    hours = 0;
  }
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  return `${hours}h`;
}
