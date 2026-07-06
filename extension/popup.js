import { CONFIG, isTestPaymentLink } from "./config.js";
import { isActive, activate, getLicense } from "./license.js";
import { freeRemaining, recordUse, resetsIn } from "./usage.js";
import { compressToTarget, pickFormat, extFor, formatBytes } from "./engine.js";

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
if (params.has("tab")) document.body.classList.add("tab");

let targetKb = 100;
let formatChoice = "auto";
let uid = 0;
let isPro = false;
const items = new Map(); // id -> { file, blob, baseName, format }

/** Checkout URL carrying the auto-activation redirect. */
async function buildBuyUrl() {
  const { devTestMode } = await chrome.storage.sync.get("devTestMode");
  const testMode = Boolean(devTestMode) || isTestPaymentLink();
  const redirect = `${CONFIG.ACTIVATED_URL}?ext=${chrome.runtime.id}&mode=${testMode ? "test" : "live"}`;
  const joiner = CONFIG.PAYMENT_LINK.includes("?") ? "&" : "?";
  return `${CONFIG.PAYMENT_LINK}${joiner}redirect_url=${encodeURIComponent(redirect)}`;
}

// ---- boot --------------------------------------------------------------------
init();

async function init() {
  $("#openTab").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?tab=1") });
    window.close();
  });
  $("#openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());

  // If activation lands while this popup is open (auto-activation after
  // checkout, or a key entered elsewhere), unlock immediately.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.shrinktoLicense?.newValue?.valid) {
      isPro = true;
      $("#paywall").hidden = true;
      $("#freeChip").hidden = true;
      $("#quotaBanner").hidden = true;
      if ($("#app").hidden) showApp();
    }
  });

  isPro = await isActive();
  if (isPro) {
    showApp();
    return;
  }
  // Free tier: usable until the weekly allowance runs out.
  if ((await freeRemaining()) > 0) {
    await showFreeChip();
    showApp();
  } else {
    showPaywall(true);
  }
}

async function showFreeChip() {
  const left = await freeRemaining();
  $("#freeChipText").textContent = `Free plan: ${left} of ${CONFIG.FREE_LIMIT} compressions left this week`;
  document.querySelector(".freeChipPrice").textContent = CONFIG.PRICE_TEXT;
  $("#freeChipUpgrade").href = await buildBuyUrl();
  $("#freeChip").hidden = false;
}

async function showQuotaBanner() {
  const reset = await resetsIn();
  $("#quotaBannerReset").textContent = reset ? `Resets in ${reset} - or go unlimited for ${CONFIG.PRICE_TEXT}.` : `Go unlimited for ${CONFIG.PRICE_TEXT}.`;
  $("#quotaBannerBuy").href = await buildBuyUrl();
  $("#quotaBanner").hidden = false;
  $("#freeChip").hidden = true;
}

// ---- paywall -----------------------------------------------------------------
async function showPaywall(quotaExhausted = false) {
  $("#paywall").hidden = false;
  $("#app").hidden = true;
  $("#priceText").textContent = CONFIG.PRICE_TEXT;
  $("#buyBtn").href = await buildBuyUrl();

  if (quotaExhausted) {
    const reset = await resetsIn();
    $("#quotaMsg").textContent =
      `You've used all ${CONFIG.FREE_LIMIT} free compressions this week` +
      (reset ? ` - your allowance resets in ${reset}.` : ".") +
      " Upgrade once and never think about limits again.";
    $("#quotaMsg").hidden = false;
  }

  $("#activateForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#activateBtn");
    const msg = $("#activateMsg");
    btn.disabled = true;
    btn.textContent = "Activating…";
    msg.hidden = true;

    const { devTestMode } = await chrome.storage.sync.get("devTestMode");
    const result = await activate($("#licenseInput").value, {
      testMode: Boolean(devTestMode) || isTestPaymentLink(),
    });

    btn.disabled = false;
    btn.textContent = "Activate";
    msg.hidden = false;
    if (result.ok) {
      msg.textContent = "Activated! Welcome to ShrinkTo Pro.";
      msg.classList.add("ok");
      setTimeout(() => {
        $("#paywall").hidden = true;
        showApp();
      }, 700);
    } else {
      msg.classList.remove("ok");
      msg.textContent = result.error;
    }
  });
}

// ---- app ---------------------------------------------------------------------
async function showApp() {
  $("#app").hidden = false;

  // Target pills
  $("#targetPills").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-kb]");
    if (!btn) return;
    targetKb = Number(btn.dataset.kb);
    $("#customKb").value = "";
    setActive("#targetPills button[data-kb]", btn);
  });
  $("#customKb").addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (v >= 1) {
      targetKb = v;
      setActive("#targetPills button[data-kb]", null);
    }
  });

  // Format pills
  $("#formatPills").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-fmt]");
    if (!btn) return;
    formatChoice = btn.dataset.fmt;
    setActive("#formatPills button[data-fmt]", btn);
  });

  // Dropzone
  const drop = $("#drop");
  const fileInput = $("#file");
  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    addFiles([...fileInput.files]);
    fileInput.value = "";
  });
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    addFiles([...e.dataTransfer.files]);
  });
  window.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files ?? [])];
    if (files.length) addFiles(files);
  });

  $("#downloadAll").addEventListener("click", downloadAll);

  // Right-click hand-off: image already fetched by the service worker…
  if (params.has("pending")) {
    const { pendingImage } = await chrome.storage.session.get("pendingImage");
    if (pendingImage) {
      chrome.storage.session.remove("pendingImage");
      const blob = await (await fetch(pendingImage.dataUrl)).blob();
      addFiles([new File([blob], pendingImage.name, { type: pendingImage.type || blob.type })]);
    }
  }
  // …or a URL we still need permission for.
  if (params.has("src")) {
    loadFromUrl(params.get("src"));
  }
}

async function loadFromUrl(src) {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    addFiles([new File([blob], nameFromUrl(src), { type: blob.type })]);
  } catch {
    const wrap = $("#grantWrap");
    wrap.hidden = false;
    $("#grantBtn").addEventListener("click", async () => {
      const granted = await chrome.permissions.request({ origins: ["<all_urls>"] });
      if (granted) {
        wrap.hidden = true;
        loadFromUrl(src);
      }
    });
  }
}

function nameFromUrl(url) {
  try {
    return decodeURIComponent((new URL(url).pathname.split("/").pop() || "image").split("?")[0]) || "image";
  } catch {
    return "image";
  }
}

function setActive(selector, activeBtn) {
  document.querySelectorAll(selector).forEach((b) => b.classList.toggle("active", b === activeBtn));
}

// ---- compression flow ----------------------------------------------------------
function addFiles(files) {
  const images = files.filter((f) => f.type.startsWith("image/"));
  for (const file of images) processFile(file);
}

async function processFile(file) {
  const id = `i${++uid}`;
  const format = pickFormat(file, formatChoice);
  const baseName = file.name.replace(/\.[^.]+$/, "") + "-shrinkto";
  const row = renderRow(id, file, baseName, format);

  // Free tier: enforce the weekly allowance per image.
  if (!isPro && (await freeRemaining()) <= 0) {
    row.querySelector(".sizes").innerHTML = `<span class="warn">Weekly free limit reached - upgrade for unlimited.</span>`;
    await showQuotaBanner();
    return;
  }

  try {
    const result = await compressToTarget(file, { targetKB: targetKb, format });
    items.set(id, { file, blob: result.blob, baseName, format });
    finishRow(row, id, file, result, format);
    if (!isPro) {
      const left = await recordUse();
      if (left <= 0) {
        await showQuotaBanner();
      } else {
        await showFreeChip();
      }
    }
  } catch (err) {
    row.querySelector(".sizes").innerHTML = `<span class="warn">${err.message ?? "Failed to compress."}</span>`;
  }
  $("#downloadAll").hidden = [...items.values()].length < 2;
}

function renderRow(id, file, baseName, format) {
  const row = document.createElement("div");
  row.className = "item";
  row.id = id;
  const thumb = document.createElement("img");
  thumb.className = "thumb";
  thumb.alt = "";
  thumb.src = URL.createObjectURL(file);
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <div class="nameRow">
      <input class="nameInput" value="${baseName.replace(/"/g, "&quot;")}" spellcheck="false" aria-label="Download name" />
      <span class="ext">.${extFor(format)}</span>
    </div>
    <div class="sizes"><span class="spin">Compressing…</span></div>`;
  row.append(thumb, meta);
  $("#results").prepend(row);
  meta.querySelector(".nameInput").addEventListener("input", (e) => {
    const item = items.get(id);
    if (item) item.baseName = e.target.value;
  });
  return row;
}

function finishRow(row, id, file, result, format) {
  const saved = Math.max(0, Math.round((1 - result.blob.size / file.size) * 100));
  const note = result.passthrough
    ? " · already optimal"
    : result.reachedTarget
      ? ""
      : " · smallest possible";
  row.querySelector(".sizes").innerHTML =
    `<span class="old">${formatBytes(file.size)}</span> → ` +
    `<span class="new">${formatBytes(result.blob.size)}</span> ` +
    `<span class="saved">-${saved}%</span>${note}`;
  const btn = document.createElement("button");
  btn.className = "itemDl";
  btn.textContent = "Save";
  btn.addEventListener("click", () => download(id));
  row.append(btn);
}

function download(id) {
  const item = items.get(id);
  if (!item) return;
  const url = URL.createObjectURL(item.blob);
  chrome.downloads.download(
    { url, filename: `${sanitize(item.baseName)}.${extFor(item.format)}`, saveAs: false },
    () => setTimeout(() => URL.revokeObjectURL(url), 30_000),
  );
}

function downloadAll() {
  for (const id of items.keys()) download(id);
}

function sanitize(name) {
  return (name.trim() || "image").replace(/[\\/:*?"<>|]/g, "-");
}
