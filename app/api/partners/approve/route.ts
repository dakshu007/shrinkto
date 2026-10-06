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
  return htmlResponse(`${partner.brandName} approved and added to the partner directory.`, true);
}

function htmlResponse(message: string, ok: boolean): Response {
  const color = "#1A73E8";
  const title = ok ? "Approved" : "Something went wrong";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} - ShrinkTo Partners</title>
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#FFFFFF;color:#1A73E8}
    .card{background:#FFFFFF;border:1.5px solid rgba(26,115,232,.22);border-radius:16px;padding:40px;max-width:440px;text-align:center;box-shadow:0 4px 8px rgba(26,115,232,.08)}
    h1{color:${color};font-size:22px;margin:0 0 12px}a{color:#1A73E8}</style></head>
    <body><div class="card"><h1>${message}</h1>
    <p><a href="/admin/partners">Open the partner admin</a> · <a href="/partners">View directory</a></p>
    </div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
