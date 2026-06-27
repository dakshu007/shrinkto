import type { Metadata } from "next";
import { AdminPartners } from "@/components/partners/AdminPartners";

export const metadata: Metadata = {
  title: "Partner admin",
  robots: { index: false, follow: false },
};

export default function AdminPartnersPage() {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)", maxWidth: 900 }}>
      <AdminPartners />
    </div>
  );
}
