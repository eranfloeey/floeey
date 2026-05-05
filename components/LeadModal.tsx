"use client";

import { useEffect, useRef, useState } from "react";

export default function LeadModal({
  open,
  onClose,
  variantId,
}: {
  open: boolean;
  onClose: () => void;
  variantId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      variant_id: variantId,
      landing_url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };
    const sp = new URLSearchParams(window.location.search);
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ].forEach((k) => {
      const v = sp.get(k);
      if (v) payload[k] = v;
    });
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch {
      setDone(true);
      setTimeout(onClose, 1800);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leadTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <button className="modal-close" aria-label="סגור" onClick={onClose}>
          ×
        </button>

        <div className="modal-body">
          <p className="eyebrow">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M9 1h6v2H9V1zm10 6.6 1.4-1.4-1.4-1.4-1.6 1.6A9 9 0 0 0 12 5a9 9 0 1 0 9 9c0-2.1-.8-4.1-2-5.4zM12 21a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm1-11h-2v6h2v-6z" />
            </svg>
            בעוד <span className="num-accent">30 שניות</span> בדיוק
          </p>
          <h3 id="leadTitle" className="title">
            <span className="line-big m">מנחם</span>
            <span className="line">איתך על הקו</span>
          </h3>
          <p className="small">זה לא איום. זו הבטחה.</p>

          <form id="leadForm" onSubmit={submit}>
            <label htmlFor="name">שם מלא</label>
            <div className="field">
              <svg
                className="field-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
              </svg>
              <input ref={inputRef} id="name" name="name" type="text" placeholder="השם שלך" required />
            </div>

            <label htmlFor="phone">מספר טלפון</label>
            <div className="field">
              <svg
                className="field-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1z" />
              </svg>
              <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="המספר שלך" required />
            </div>

            <button type="submit" className="submit-btn" disabled={submitting || done}>
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1z" />
                </svg>
              </span>
              {done ? "תודה! חוזרים אליך תוך דקות" : "צלצל כבר מנחם!"}
            </button>
            <p className="trust">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V5l-8-3z" />
              </svg>
              הפרטים שלך בטוחים איתנו
            </p>
          </form>
        </div>

        <div className="modal-art">
          <span className="bubble">
            נדבר <span className="wink">😉</span>
          </span>
          <img className="modal-character" src="/img/menachem-linkedin.png" alt="" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
