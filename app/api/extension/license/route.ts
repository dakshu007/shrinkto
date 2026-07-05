import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Look up the license key Dodo Payments generated for a completed payment.
 * Called by /extension/activated after checkout redirects back with
 * ?payment_id=... . Requires DODO_API_KEY_LIVE / DODO_API_KEY_TEST env vars
 * (Dodo dashboard -> Developer -> API keys).
 */
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment_id") ?? "";
  const mode = req.nextUrl.searchParams.get("mode") === "test" ? "test" : "live";

  if (!/^[A-Za-z0-9_-]{8,80}$/.test(paymentId)) {
    return NextResponse.json({ error: "Invalid payment id." }, { status: 400 });
  }

  const apiKey = mode === "test" ? process.env.DODO_API_KEY_TEST : process.env.DODO_API_KEY_LIVE;
  if (!apiKey) {
    return NextResponse.json(
      { error: `Server missing DODO_API_KEY_${mode.toUpperCase()} - add it in Netlify env.` },
      { status: 501 },
    );
  }

  const base = mode === "test" ? "https://test.dodopayments.com" : "https://live.dodopayments.com";

  // SECURITY: Dodo's list endpoint ignores unknown query filters, so we must
  // match payment_id ourselves - only ever return a key whose payment_id
  // equals the one from the checkout redirect. Newest keys come first, so a
  // just-completed purchase is found on page 0.
  interface LicenseItem {
    key?: string;
    payment_id?: string;
  }

  for (let pageNumber = 0; pageNumber < 10; pageNumber++) {
    let res: Response;
    try {
      res = await fetch(
        `${base}/license_keys?page_size=100&page_number=${pageNumber}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
      );
    } catch {
      return NextResponse.json({ error: "Couldn't reach Dodo Payments." }, { status: 502 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Dodo lookup failed (HTTP ${res.status}).` }, { status: 502 });
    }

    const body = (await res.json()) as unknown;
    const items = (Array.isArray(body) ? body : ((body as { items?: unknown[] })?.items ?? [])) as LicenseItem[];

    const match = items.find((item) => item.payment_id === paymentId && item.key);
    if (match?.key) return NextResponse.json({ key: match.key });

    if (items.length < 100) break; // no more pages
  }

  return NextResponse.json(
    { error: "No license key found for this payment yet. It can take a few seconds - refresh this page." },
    { status: 404 },
  );
}
