// Submits every URL in the live sitemap to IndexNow (Bing, Yandex, Seznam, Naver, Yep)
// after a production deploy is published. Never fails the build.
const ENDPOINT = "https://api.indexnow.org/indexnow";

module.exports = {
  async onSuccess({ inputs, utils }) {
    if (process.env.CONTEXT !== "production") {
      console.log(`[indexnow] skipped: context is ${process.env.CONTEXT}`);
      return;
    }
    const site = (process.env.URL || "https://shrinkto.com").replace(/\/$/, "");
    const host = new URL(site).host;
    const key = inputs.key;
    try {
      const xml = await (await fetch(`${site}/sitemap.xml`)).text();
      const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
        .map((m) => m[1].replace(/&amp;/g, "&"))
        .filter((u) => new URL(u).host === host);
      if (!urls.length) throw new Error("no URLs found in sitemap.xml");
      let sent = 0;
      for (let i = 0; i < urls.length; i += 10000) {
        const urlList = urls.slice(i, i + 10000);
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList }),
        });
        if (res.status !== 200 && res.status !== 202) {
          throw new Error(`IndexNow answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
        sent += urlList.length;
      }
      const msg = `Submitted ${sent} URLs from sitemap.xml to IndexNow`;
      console.log(`[indexnow] ${msg}`);
      utils.status.show({ title: "IndexNow", summary: msg });
    } catch (err) {
      console.log(`[indexnow] submission failed: ${err.message}`);
      utils.status.show({ title: "IndexNow", summary: `Submission failed: ${err.message}` });
    }
  },
};
