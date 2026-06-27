"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApplyModal } from "./ApplyModal";

export function BecomePartnerCta({ size = "lg", label = "Apply to become a partner" }: { size?: "md" | "lg"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && <ApplyModal onClose={() => setOpen(false)} />}
    </>
  );
}
