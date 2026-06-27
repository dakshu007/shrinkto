export type PartnerStatus = "pending" | "approved" | "rejected";

export interface Partner {
  id: string;
  brandName: string;
  website: string;
  description: string;
  /** Brand logo stored as a small base64 data URL. */
  logo: string;
  status: PartnerStatus;
  createdAt: number;
  /** Secret token used for the one-click email approval link. */
  approveToken: string;
}

/** What the public directory exposes (no token). */
export type PublicPartner = Omit<Partner, "approveToken">;

export function toPublic(p: Partner): PublicPartner {
  const { approveToken: _t, ...rest } = p;
  return rest;
}
