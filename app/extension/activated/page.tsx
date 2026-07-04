import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivatedClient } from "./ActivatedClient";

export const metadata: Metadata = {
  title: "Thanks for your purchase - ShrinkTo Pro",
  description: "Your ShrinkTo Pro license - activate the Chrome extension.",
  robots: { index: false },
};

export default function ExtensionActivatedPage() {
  return (
    <Suspense>
      <ActivatedClient />
    </Suspense>
  );
}
