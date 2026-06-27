import { NextResponse } from "next/server";
import { listPartners, setStatus } from "@/lib/partners/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default token is overridable via ADMIN_TOKEN. Set a strong one in Netlify env.
function adminToken(): string {
  return process.env.ADMIN_TOKEN || "shrinkto-admin";
}

function authorized(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const token = request.headers.get("x-admin-token") || searchParams.get("token") || "";
  return token === adminToken();
}

/** List all applications (any status) for the admin dashboard. */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await listPartners();
  return NextResponse.json({ partners: all });
}

/** Approve or reject an application. */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = body.id ?? "";
  const status = body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : null;
  if (!status) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const updated = await setStatus(id, status);
  if (!updated) return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}
