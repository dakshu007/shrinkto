import { NextResponse } from "next/server";
import { addPartner, listPartners } from "@/lib/partners/store";
import { notifyOwnerOfApplication } from "@/lib/partners/email";
import type { Partner } from "@/lib/partners/types";
import { toPublic } from "@/lib/partners/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGO_CHARS = 400_000; // ~300 KB base64

function clean(s: unknown, max: number): string {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

function validUrl(u: string): boolean {
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Public: the approved partner directory. */
export async function GET() {
  const approved = await listPartners("approved");
  return NextResponse.json({ partners: approved.map(toPublic) });
}

/** Apply to become a partner. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const brandName = clean(body.brandName, 80);
  const websiteRaw = clean(body.website, 200);
  const description = clean(body.description, 500);
  const logo = clean(body.logo, MAX_LOGO_CHARS);

  if (!brandName) return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
  if (!websiteRaw || !validUrl(websiteRaw))
    return NextResponse.json({ error: "A valid website URL is required." }, { status: 400 });
  if (!description) return NextResponse.json({ error: "A short description is required." }, { status: 400 });
  if (logo && !logo.startsWith("data:image/"))
    return NextResponse.json({ error: "Logo must be an image." }, { status: 400 });

  const website = websiteRaw.startsWith("http") ? websiteRaw : `https://${websiteRaw}`;

  const partner: Partner = {
    id: crypto.randomUUID(),
    brandName,
    website,
    description,
    logo,
    status: "pending",
    createdAt: Date.now(),
    approveToken: crypto.randomUUID().replace(/-/g, ""),
  };

  await addPartner(partner);
  const emailed = await notifyOwnerOfApplication(partner);

  return NextResponse.json({ ok: true, emailed });
}
