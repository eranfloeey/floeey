"use client";

import { useEffect, useRef, useState } from "react";
import { isValidIsraeliPhone } from "@/lib/phone";

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
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [partialLeadId, setPartialLeadId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!open) {
      setStep(1);
      setConsent(false);
      setError(null);
      setSubmitting(false);
      setDone(false);
      setPartialLeadId(null);
    }
  }, [open]);

  // Build the payload shared between the partial step-1 save and the final
  // submit. Kept here so utm/tracking params get attached consistently in both.
  function buildPayload() {
    const payload: Record<string, string> = {
      form_id: "main",
      name: name.trim(),
      phone: phone.trim(),
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
    return payload;
  }

  if (!open) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (step === 1) {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      if (!trimmedName) {
        setError("נא להזין שם");
        return;
      }
      if (!isValidIsraeliPhone(trimmedPhone)) {
        setError("מספר טלפון ישראלי לא תקין. למשל: 054-123-4567");
        return;
      }
      setStep(2);
      // Fire-and-forget: save an "abandoned" lead at step 1 so the operator
      // can see people who entered details but didn't tick the consent box.
      // No NLPearl / webhook firing — that only happens at step 2.
      fetch("/api/leads/partial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
        .then((r) => r.json().catch(() => ({})))
        .then((d) => {
          if (d?.lead_id) setPartialLeadId(Number(d.lead_id));
        })
        .catch(() => {});
      return;
    }

    if (!consent) {
      setError("יש לאשר את ההצהרה כדי להמשיך");
      return;
    }

    setSubmitting(true);
    const payload: Record<string, string | number> = buildPayload();
    // Upgrade the step-1 row instead of creating a duplicate. If the partial
    // POST is still in flight or failed, the server falls back to insert.
    if (partialLeadId != null) payload.lead_id = partialLeadId;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        // 400 → user-fixable (invalid phone, etc). 500 → server problem.
        const msg =
          data?.message ||
          (res.status >= 500
            ? "משהו השתבש אצלנו, נסה שוב בעוד רגע"
            : "לא הצלחנו לשמור — בדוק שהפרטים תקינים");
        setError(msg);
        setSubmitting(false);
        return;
      }
      setDone(true);
      // Redirect to the dedicated thanks page so the user sees the confirmation
      // copy + Menachem image.
      window.location.href = "/thanks";
    } catch {
      setError("בעיית חיבור — נסה שוב בעוד רגע");
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
            {step === 1 ? (
              <>
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
                  <input
                    ref={inputRef}
                    id="name"
                    name="name"
                    type="text"
                    placeholder="השם שלך"
                    aria-label="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

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
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="המספר שלך"
                    aria-label="מספר טלפון"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="consent-step">
                <label className="consent-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-label="אישור הצהרה"
                  />
                  <span className="consent-text">
                    אני מאשר/ת כי ידוע לי ומוסכם עלי כי הפרטים שמסרתי ייאספו, יוחזקו ויעובדו במאגר מידע בהתאם להוראות חוק הגנת הפרטיות,
                    התשמ&quot;א–1981 (כולל תיקון 13), ולמטרות המפורטות{" "}
                    <a href="/terms?tab=privacy" target="_blank" rel="noopener noreferrer">
                      במדיניות הפרטיות של האתר
                    </a>
                    . ידוע לי כי מסירת המידע נעשית מרצוני החופשי, וכי עומדות לי הזכויות המוקנות לי לפי החוק.
                  </span>
                </label>
              </div>
            )}

            {error ? (
              <p className="lead-error" role="alert" style={{
                color: "#fca5a5",
                background: "rgba(248,113,113,0.10)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                marginBottom: 10,
              }}>
                {error}
              </p>
            ) : null}

            <button type="submit" className="submit-btn" disabled={submitting || done}>
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1z" />
                </svg>
              </span>
              {done ? "מעבירים אותך…" : submitting ? "שולח…" : "צלצל כבר מנחם!"}
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
