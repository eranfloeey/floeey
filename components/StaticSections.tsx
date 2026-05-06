"use client";

import { useEffect, useRef } from "react";

// Crisp line icons (Lucide-inspired) — replace emoji to look intentional, not AI-generated.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const Icon = {
  Bolt: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>
  ),
  CreditCard: () => (
    <svg viewBox="0 0 24 24" {...stroke}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" {...stroke}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
  ),
  Receipt: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>
  ),
  Contract: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l2 2 4-4"/></svg>
  ),
  PhoneForward: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M18 2l4 4-4 4M14 6h8"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" {...stroke}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
  ),
};

// Sections below the hero (benefits + how-it-works + final CTA + team + footer).
// Two scroll-driven parallax pieces:
//  1. Flying Menachem across the benefits section (bottom-right -> top-left)
//  2. Tentacle arm reaching from the right of the final CTA, sliding up & out as you scroll
export default function StaticSections({ onOpenModal }: { onOpenModal: () => void }) {
  const flyerSectionRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLImageElement>(null);
  const armSectionRef = useRef<HTMLElement>(null);
  const armRef = useRef<HTMLImageElement>(null);
  const teamRowRef = useRef<HTMLUListElement>(null);

  // Scroll-driven infinite avatar marquee:
  //  - Page scroll-down moves the row right-to-left; scroll-up reverses
  //  - Modulo wrap on the doubled list = truly infinite in both directions
  //  - Each avatar's --s scales by distance from viewport horizontal center (center biggest)
  useEffect(() => {
    const row = teamRowRef.current;
    if (!row) return;

    const SCROLL_SPEED = 0.6;     // px of horizontal travel per px of vertical scroll
    let lastScrollY = window.scrollY;
    let offset = window.scrollY * SCROLL_SPEED;   // align with current scroll on mount
    let raf = 0;
    let pending = false;

    const apply = () => {
      pending = false;
      const cycle = row.scrollWidth / 3;    // tripled list -> wrap at 1/3
      if (cycle > 0) {
        offset = ((offset % cycle) + cycle) % cycle;
        row.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      // Per-avatar scale: sharp peak at viewport horizontal center
      const vw = window.innerWidth;
      const cx = vw / 2;
      const items = row.querySelectorAll<HTMLElement>(".team-avatar");
      const MAX = 1.6, MIN = 0.32;
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elCx = rect.left + rect.width / 2;
        const dist = Math.min(1, Math.abs(elCx - cx) / (vw / 2));
        // power curve <1 -> sharp peak so neighbors fall off fast
        const t = Math.pow(dist, 0.42);
        const scale = MAX - (MAX - MIN) * t;
        el.style.setProperty("--s", scale.toFixed(3));
      });
    };

    const schedule = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(apply);
    };

    const onScroll = () => {
      const y = window.scrollY;
      offset += (y - lastScrollY) * SCROLL_SPEED;
      lastScrollY = y;
      schedule();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();   // initial paint
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    function progressFor(el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      return Math.max(0, Math.min(1, traveled / total));
    }

    let ticking = false;
    const update = () => {
      if (flyerSectionRef.current && flyerRef.current) {
        flyerRef.current.style.setProperty("--p", progressFor(flyerSectionRef.current).toFixed(4));
      }
      if (armSectionRef.current && armRef.current) {
        armRef.current.style.setProperty("--p", progressFor(armSectionRef.current).toFixed(4));
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <section className="block alt flyer-section" ref={flyerSectionRef}>
        <img
          className="flyer"
          src="/img/menachem-flying-v2.png"
          alt=""
          aria-hidden="true"
          ref={flyerRef}
        />
        <div className="container">
          <div className="section-head">
            <h2>
              ככה זה נראה <span style={{ color: "var(--brand)" }}>עם</span> סוכן קולי
            </h2>
            <p>
              מענה לשאלות, סטטוס חבילה, מעקב משלוחים, שליחת מידע ללקוחות.. לא חבל על הזמן שלך?
            </p>
          </div>
          <div className="benefits">
            <div className="benefit">
              <div className="icon"><Icon.Bolt /></div>
              <h4>מענה תוך שניות</h4>
              <p>כל פנייה נענית מיד. לא תור, לא המתנה, לא לידים שמתקררים.</p>
            </div>
            <div className="benefit">
              <div className="icon"><Icon.Clock /></div>
              <h4>זמין 24/7</h4>
              <p>
                גם בלילה, גם כשאתה בפגישה. <span className="m">מנחם</span> תמיד שם.
              </p>
            </div>
            <div className="benefit">
              <div className="icon"><Icon.Check /></div>
              <h4>לא מפספס אף ליד</h4>
              <p>כל שיחה נענית, כל ליד נרשם, כל הזדמנות עוברת אליך מסוננת.</p>
            </div>
            <div className="benefit">
              <div className="icon"><Icon.TrendingUp /></div>
              <h4>יותר לקוחות</h4>
              <p>עסקים שעובדים עם פלואי רואים יותר פניות שהופכות ללקוחות משלמים.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="section-head">
            <h2>איך זה עובד</h2>
            <p>
              שלושה שלבים ויש לך <span className="m">מנחם</span> בעסק.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h4>משאיר פרטים</h4>
              <p>ממלא את הטופס - שם, טלפון, ושם העסק.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h4>
                <span className="m">מנחם</span> מתקשר
              </h4>
              <p>תוך דקות אנחנו חוזרים אליך עם שיחת היכרות והדגמה חיה.</p>
            </div>
            <div className="step-wrap">
              <img
                className="step-character"
                src="/img/menachem-phone.png"
                alt=""
                aria-hidden="true"
              />
              <div className="step step-featured">
                <div className="num">3</div>
                <h4>
                  <span className="m">מנחם</span> מתחיל לתת שירות בטלפון!
                </h4>
                <p>מתאימים את הסוכן לעסק שלך, ומשם הוא עובד בשבילך 24/7.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block actions-section">
        <div className="container">
          <div className="section-head">
            <h2>
              <span className="m">מנחם</span>, לא רק עונה. הוא <span className="m">מבצע</span>.
            </h2>
            <p>
              שיחה אחת מפעילה זרימה שלמה של פעולות אוטומטיות במערכות שלכם.
            </p>
          </div>

          <div className="flow">
            {/* TRIGGER */}
            <div className="flow-card flow-card-trigger">
              <span className="fc-badge fc-badge-trigger"><Icon.Bolt /></span>
              <span className="fc-icon"><Icon.Phone /></span>
              <span className="fc-label">כשנכנסת שיחה</span>
            </div>

            <div className="flow-line" aria-hidden="true"></div>

            {/* AI AGENT */}
            <div className="flow-card flow-card-ai">
              <span className="fc-badge fc-badge-ai"><Icon.Sparkle /></span>
              <img className="fc-avatar" src="/img/menachem-linkedin.png" alt="" aria-hidden="true" />
              <span className="fc-label">
                <strong>מנחם</strong>
                <em>סוכן הקול שלכם</em>
              </span>
            </div>

            {/* FAN-OUT + ACTIONS — overlay SVG draws an orthogonal "wire" from the agent
                to each of the 8 cards in a 4-column / 2-row grid. */}
            <div className="flow-actions-area">
              <svg
                className="flow-wires"
                viewBox="0 0 1100 360"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 Z" fill="rgba(255,255,255,0.42)" />
                  </marker>
                </defs>
                {/* split bus from agent down to each of the 4 columns, ending at the top of row-1 cards */}
                <path d="M550,0 V40 H131 V116" markerEnd="url(#arr)" />
                <path d="M550,0 V40 H410 V116" markerEnd="url(#arr)" />
                <path d="M550,0 V40 H690 V116" markerEnd="url(#arr)" />
                <path d="M550,0 V40 H969 V116" markerEnd="url(#arr)" />
                {/* row-1 to row-2 chain in each column */}
                <path d="M131,220 V336" markerEnd="url(#arr)" />
                <path d="M410,220 V336" markerEnd="url(#arr)" />
                <path d="M690,220 V336" markerEnd="url(#arr)" />
                <path d="M969,220 V336" markerEnd="url(#arr)" />
              </svg>

              <div className="flow-actions-grid">
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.CreditCard /></span><span className="fc-label">קישור לתשלום</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Chat /></span><span className="fc-label">שליחת WhatsApp</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Calendar /></span><span className="fc-label">קביעת פגישה</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Chart /></span><span className="fc-label">פתיחת ליד ב-CRM</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Receipt /></span><span className="fc-label">הפקת חשבונית</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Package /></span><span className="fc-label">בדיקת משלוח</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.Contract /></span><span className="fc-label">חוזה לחתימה</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon"><Icon.PhoneForward /></span><span className="fc-label">העברת שיחה</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta arm-section" ref={armSectionRef}>
        <img
          className="arm"
          src="/img/menachem-arm-v2.png"
          alt=""
          aria-hidden="true"
          ref={armRef}
        />
        <div className="container">
          <h2>
            "הנחמה הגדולה ביותר<br />
            של בעל עסק היא <span className="m">מנחם</span>"
          </h2>
          <p>ללקוחות שלך מגיע שירות כזה. תלחץ ותראה בעצמך.</p>
          <button className="cta-pill" onClick={onOpenModal}>
            מנחם תתקשר אלי!
          </button>
        </div>
      </section>

      <section className="block team-section">
        <div className="container">
          <div className="section-head">
            <h2>
              <span className="m">מנחם</span> <span className="unlimited">Unlimited</span>
            </h2>
            <p className="lead-sub">
              לסוכן שלנו קוראים <span className="m">מנחם</span>, ולשלך?
            </p>
            <p>
              הסוכן מדבר בקול שאתם תבחרו, זכר או נקבה, והוא מכיר את העסק שלכם כאילו היה בעל הבית!
            </p>
          </div>
          <div className="team-marquee">
            <ul className="team-row" ref={teamRowRef} aria-label="צוות סוכני פלואי">
              {/* Tripled list — guarantees the viewport is always filled and modulo-wrap is invisible */}
              {Array.from({ length: 3 }).flatMap(() => [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).map((n, i) => (
                <li key={i} className="team-avatar">
                  <img src={`/img/team/${n}.png`} alt="" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">© Floeey · סוכן קולי לעסקים</div>
      </footer>
    </>
  );
}
