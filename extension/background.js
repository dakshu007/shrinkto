// ---- Service worker: context menu + right-click image hand-off ---------------

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: "shrinkto-compress-image",
    title: "Compress this image with ShrinkTo",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: "shrinkto-open",
    title: "Open ShrinkTo compressor",
    contexts: ["action"],
  });
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?tab=1") });
  }
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "shrinkto-open") {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?tab=1") });
    return;
  }
  if (info.menuItemId !== "shrinkto-compress-image" || !info.srcUrl) return;

  // Try to fetch the image here (works for data: URLs always, and for
  // http(s) once the user has granted optional host access).
  try {
    const res = await fetch(info.srcUrl);
    const blob = await res.blob();
    if (blob.size > 24 * 1024 * 1024) throw new Error("too big for hand-off");
    const dataUrl = await blobToDataUrl(blob);
    await chrome.storage.session.set({
      pendingImage: { dataUrl, name: nameFromUrl(info.srcUrl), type: blob.type },
    });
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?tab=1&pending=1") });
  } catch {
    // No permission (or CORS) - open the app with the URL; it offers a
    // one-click "allow access" button and retries from there.
    chrome.tabs.create({
      url: chrome.runtime.getURL(`popup.html?tab=1&src=${encodeURIComponent(info.srcUrl)}`),
    });
  }
});

function nameFromUrl(url) {
  try {
    const base = new URL(url).pathname.split("/").pop() || "image";
    return decodeURIComponent(base.split("?")[0]) || "image";
  } catch {
    return "image";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
