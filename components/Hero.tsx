"use client";

import { DEFAULT_HERO } from "@/lib/copy";

export default function Hero({
  overrides,
  onOpenModal,
}: {
  overrides?: Partial<typeof DEFAULT_HERO>;
  onOpenModal: () => void;
}) {
  const v = { ...DEFAULT_HERO, ...overrides };
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-top">
          <h1 dangerouslySetInnerHTML={{ __html: v.h1_html }} />
        </div>

        <div className="hero-art">
          <img className="menachem" src="/img/menachem.png" alt="מנחם - הסוכן הקולי של פלואי" />
        </div>

        <div className="hero-bottom">
          <p className="lead" dangerouslySetInnerHTML={{ __html: v.lead_html }} />
          <button className="hero-cta" onClick={onOpenModal}>
            {v.cta_text}
            <span className="arrow" aria-hidden="true">←</span>
          </button>
        </div>
      </div>
    </section>
  );
}
