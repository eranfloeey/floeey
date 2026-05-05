"use client";

import { useState } from "react";
import Hero from "./Hero";
import StaticSections from "./StaticSections";
import LeadModal from "./LeadModal";
import { DEFAULT_HERO } from "@/lib/copy";

export default function LandingPage({
  variantId,
  overrides,
}: {
  variantId: string;
  overrides?: Partial<typeof DEFAULT_HERO>;
}) {
  const [open, setOpen] = useState(false);
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  return (
    <main id="top">
      <Hero overrides={overrides} onOpenModal={onOpen} />
      <StaticSections onOpenModal={onOpen} />
      <LeadModal open={open} onClose={onClose} variantId={variantId} />
    </main>
  );
}
