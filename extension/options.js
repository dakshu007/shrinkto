import { getLicense, deactivate } from "./license.js";

const $ = (sel) => document.querySelector(sel);

init();

async function init() {
  const lic = await getLicense();
  if (lic) {
    $("#status").textContent = lic.valid ? "Active" : "Invalid";
    $("#status").className = `badge ${lic.valid ? "on" : "off"}`;
    $("#key").textContent = mask(lic.key);
    $("#activated").textContent = new Date(lic.activatedAt).toLocaleDateString();
    $("#mode").textContent = lic.testMode ? "Test" : "Live";
    const btn = $("#deactivate");
    btn.hidden = false;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Deactivating…";
      await deactivate();
      location.reload();
    });
  }

  const { devTestMode } = await chrome.storage.sync.get("devTestMode");
  const check = $("#testMode");
  check.checked = Boolean(devTestMode);
  check.addEventListener("change", () => {
    chrome.storage.sync.set({ devTestMode: check.checked });
  });
}

function mask(key) {
  if (!key) return "—";
  return key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : key;
}
