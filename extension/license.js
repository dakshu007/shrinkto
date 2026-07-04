// ---- Dodo Payments license management ---------------------------------------
// Flow: user buys via the payment link -> Dodo emails a license key ->
// user pastes it here -> we call POST /licenses/activate (public endpoint,
// no API key) -> store the instance -> revalidate lazily every 7 days.
// Network failures never lock a paying user out (grace: keep last-good state).

import { CONFIG } from "./config.js";

const STORE_KEY = "shrinktoLicense";

function baseUrl(testMode) {
  return testMode ? CONFIG.DODO_TEST : CONFIG.DODO_LIVE;
}

export async function getLicense() {
  const data = await chrome.storage.sync.get(STORE_KEY);
  return data[STORE_KEY] ?? null;
}

async function setLicense(value) {
  if (value === null) {
    await chrome.storage.sync.remove(STORE_KEY);
  } else {
    await chrome.storage.sync.set({ [STORE_KEY]: value });
  }
}

/** Activate a license key. Returns {ok, error?}. */
export async function activate(key, { testMode = false } = {}) {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, error: "Please paste your license key." };

  let res;
  try {
    res = await fetch(`${baseUrl(testMode)}/licenses/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: trimmed,
        name: `Chrome extension (${new Date().toISOString().slice(0, 10)})`,
      }),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the license server. Check your connection and try again." };
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* some errors have no JSON body */
  }

  if (!res.ok) {
    const msg =
      body?.message ??
      body?.error ??
      (res.status === 404 || res.status === 422
        ? "That license key wasn't found. Copy it exactly as it appears in your purchase email."
        : `Activation failed (HTTP ${res.status}). Try again or contact support.`);
    return { ok: false, error: String(msg) };
  }

  // The activate response is a "license key instance" - its id is needed
  // for later validations. Accept a couple of shapes defensively.
  const instanceId = body?.id ?? body?.instance?.id ?? body?.license_key_instance_id ?? null;

  await setLicense({
    key: trimmed,
    instanceId,
    testMode,
    activatedAt: Date.now(),
    lastValidatedAt: Date.now(),
    valid: true,
  });
  return { ok: true };
}

/** Cheap check for UI gating. Revalidates in the background when stale. */
export async function isActive() {
  const lic = await getLicense();
  if (!lic || !lic.valid) return false;

  if (Date.now() - (lic.lastValidatedAt ?? 0) > CONFIG.REVALIDATE_EVERY) {
    // Fire and forget - never block the UI on the network.
    revalidate().catch(() => {});
  }
  return true;
}

/** Confirm the key is still valid with Dodo. Grace on network errors. */
export async function revalidate() {
  const lic = await getLicense();
  if (!lic) return false;
  if (!lic.instanceId) {
    // No instance id recorded - nothing to validate against; keep access.
    await setLicense({ ...lic, lastValidatedAt: Date.now() });
    return true;
  }

  let res;
  try {
    res = await fetch(`${baseUrl(lic.testMode)}/licenses/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: lic.key,
        license_key_instance_id: lic.instanceId,
      }),
    });
  } catch {
    return true; // offline - keep access
  }

  if (!res.ok) {
    // Server hiccup: keep access. Only an explicit "valid: false" locks.
    await setLicense({ ...lic, lastValidatedAt: Date.now() });
    return true;
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  const stillValid = body?.valid !== false;
  await setLicense({ ...lic, valid: stillValid, lastValidatedAt: Date.now() });
  return stillValid;
}

/** Release this browser's activation so the key can be used elsewhere. */
export async function deactivate() {
  const lic = await getLicense();
  if (lic?.instanceId) {
    try {
      await fetch(`${baseUrl(lic.testMode)}/licenses/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: lic.key,
          license_key_instance_id: lic.instanceId,
        }),
      });
    } catch {
      /* best effort */
    }
  }
  await setLicense(null);
}
