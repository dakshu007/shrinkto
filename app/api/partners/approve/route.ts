import { NextResponse } from "next/server";
import { getPartner, setStatus } from "@/lib/partners/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One-click approval from the notification email link. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";

  const partner = await getPartner(id);
  if (!partner || partner.approveToken !== token) {
    return htmlResponse("Invalid or expired approval link.", false);
  }
  if (partner.status === "approved") {
    return htmlResponse(`${partner.brandName} is already approved.`, true);
  }
  await setStatus(id, "approved");
  return htmlResponse(`${partner.brandName} approved and added to the partner directory. 🎉`, true);
}

function htmlResponse(message: string, ok: boolean): Response {
  const color = ok ? "#1e8e3e" : "#d93025";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>ShrinkTo Partners</title>
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8f9fa}
    .card{background:#fff;border:1px solid #e8eaed;border-radius:16px;padding:40px;max-width:440px;text-align:center;box-shadow:0 4px 8px rgba(60,64,67,.08)}
    h1{color:${color};font-size:22px;margin:0 0 12px}a{color:#1a73e8}</style></head>
    <body><div class="card"><h1>${message}</h1>
    <p><a href="/admin/partners">Open the partner admin</a> · <a href="/partners">View directory</a></p>
    </div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
