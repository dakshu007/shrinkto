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
  let res: Response;
  try {
    res = await fetch(`${base}/license_keys?payment_id=${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Dodo Payments." }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Dodo lookup failed (HTTP ${res.status}).` }, { status: 502 });
  }

  const body = (await res.json()) as unknown;
  // Accept both {items: [...]} and bare-array response shapes.
  const items = Array.isArray(body)
    ? body
    : ((body as { items?: unknown[] })?.items ?? []);
  const first = items[0] as { key?: string } | undefined;

  if (!first?.key) {
    return NextResponse.json(
      { error: "No license key found for this payment yet. It can take a few seconds - refresh this page." },
      { status: 404 },
    );
  }

  return NextResponse.json({ key: first.key });
}
