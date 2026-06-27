// Notifies the site owner when a partner applies. Uses Resend's REST API if
// RESEND_API_KEY is set — otherwise it's a no-op and approval happens via the
// admin page. No SDK needed; we just POST to the API.

import type { Partner } from "./types";

const OWNER_EMAIL = process.env.PARTNER_NOTIFY_EMAIL || "daksheshbabu@gmail.com";
// Resend's shared sender works for delivering to the account owner's address.
const FROM = process.env.PARTNER_FROM_EMAIL || "ShrinkTo Partners <onboarding@resend.dev>";

function siteUrl(): string {
  return process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://shrinkto.com";
}

export async function notifyOwnerOfApplication(partner: Partner): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const approveUrl = `${siteUrl()}/api/partners/approve?id=${encodeURIComponent(
    partner.id,
  )}&token=${encodeURIComponent(partner.approveToken)}`;
  const adminUrl = `${siteUrl()}/admin/partners`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">New partner application</h2>
      <p><strong>Brand:</strong> ${escapeHtml(partner.brandName)}</p>
      <p><strong>Website:</strong> <a href="${escapeHtml(partner.website)}">${escapeHtml(partner.website)}</a></p>
      <p><strong>Description:</strong><br>${escapeHtml(partner.description)}</p>
      ${partner.logo ? `<p><img src="${partner.logo}" alt="logo" style="max-height:80px;border-radius:8px"></p>` : ""}
      <p style="margin:24px 0">
        <a href="${approveUrl}" style="background:#1a73e8;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;font-weight:600">Approve &amp; add to directory</a>
      </p>
      <p style="color:#5f6368;font-size:13px">Or manage all applications in the <a href="${adminUrl}">admin page</a>.</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [OWNER_EMAIL],
        subject: `New partner application — ${partner.brandName}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
