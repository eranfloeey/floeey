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
  Notes: () => (
    <svg viewBox="0 0 24 24" {...stroke}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
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
  const teamSectionRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function progressFor(el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      return Math.max(0, Math.min(1, traveled / total));
    }

    function buildProgress(el: HTMLElement) {
      // Map scroll so the flowchart "builds itself" as it crosses the viewport.
      //   start: when the section's top is this far down the viewport, build = 0.
      //   end:   when the section's top is this far up the viewport, build = 1.
      // The desktop range is now ~1.15*vh of scroll (vs the previous 0.65*vh)
      // so the animation reads at a comfortable scroll pace instead of flashing
      // through. On mobile the .flow stack is much taller than the viewport, so
      // we stretch end further so progress only completes around the time the
      // section's mid-point passes the top of viewport.
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 880px)").matches;
      const start = isMobile ? vh * 0.85 : vh * 1.05;
      const end = isMobile
        ? Math.min(vh * 0.20, vh * 0.5 - rect.height)
        : vh * -0.45;
      if (start === end) return 0;
      return Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
    }

    let ticking = false;
    const update = () => {
      if (flyerSectionRef.current && flyerRef.current) {
        flyerRef.current.style.setProperty("--p", progressFor(flyerSectionRef.current).toFixed(4));
      }
      if (armSectionRef.current && armRef.current) {
        armRef.current.style.setProperty("--p", progressFor(armSectionRef.current).toFixed(4));
      }
      if (flowRef.current) {
        flowRef.current.style.setProperty("--build", buildProgress(flowRef.current).toFixed(4));
      }
      if (teamSectionRef.current) {
        teamSectionRef.current.style.setProperty("--reveal", progressFor(teamSectionRef.current).toFixed(4));
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

          {/* The whole chart receives a --build (0..1) that ramps with scroll; child
              elements opt-in via inline --step thresholds for a sequential reveal. */}
          <div className="flow flow-build" ref={flowRef}>
            {/* TRIGGER */}
            <div className="flow-card flow-card-trigger flow-reveal" style={{ ["--step" as string]: 0.02 }}>
              <span className="fc-icon"><Icon.Phone /></span>
              <span className="fc-label">כשנכנסת שיחה</span>
            </div>

            <div className="flow-line flow-reveal-line" style={{ ["--step" as string]: 0.10 }} aria-hidden="true"></div>

            {/* AI AGENT */}
            <div className="flow-card flow-card-ai flow-reveal" style={{ ["--step" as string]: 0.14 }}>
              <img className="fc-avatar" src="/img/menachem-linkedin.png" alt="" aria-hidden="true" />
              <span className="fc-label">
                <strong>מנחם</strong>
                <em>הסוכן הקולי שלכם- דואג להכל!</em>
              </span>
            </div>

            {/* 4 primary actions branch from the agent; 3 of them get a follow-up below.
                LTR column centers in the 1100-wide viewBox: 137.5, 412.5, 687.5, 962.5.
                Row 2 sits under LTR cols 1..3 (RTL pos 4..2 visually). */}
            <div className="flow-actions-area">
              <svg
                className="flow-wires"
                viewBox="0 0 1100 344"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Agent -> 4 primaries. Each path is normalized to pathLength=100 so the
                    same calc in CSS draws every wire from start to end the same way.
                    y=0 sits at the top of .flow-actions-area (which has padding-top:60px),
                    y=60 is the top of row 1, y=136 its bottom, y=164 the top of row 2,
                    y=240 its bottom, y=268 the top of row 3, y=344 its bottom. */}
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.18 }} d="M550,0 V20 H137.5 V60" />
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.22 }} d="M550,0 V20 H412.5 V60" />
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.26 }} d="M550,0 V20 H687.5 V60" />
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.30 }} d="M550,0 V20 H962.5 V60" />
                {/* Drops to the 3 follow-ups under LTR cols 1..3 */}
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.42 }} d="M137.5,136 V164" />
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.48 }} d="M412.5,136 V164" />
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.54 }} d="M687.5,136 V164" />
                {/* Row 2 -> row 3: only קביעת פגישה (col 2) gets a follow-up */}
                <path className="wire" pathLength={100} style={{ ["--step" as string]: 0.62 }} d="M412.5,240 V268" />

                {/* Junction dots — one at the agent fan-out and one at every wire endpoint */}
                <circle className="wire-dot" style={{ ["--step" as string]: 0.16 }} cx="550" cy="20" r="4" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.20 }} cx="137.5" cy="60" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.24 }} cx="412.5" cy="60" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.28 }} cx="687.5" cy="60" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.32 }} cx="962.5" cy="60" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.44 }} cx="137.5" cy="164" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.50 }} cx="412.5" cy="164" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.56 }} cx="687.5" cy="164" r="3.5" />
                <circle className="wire-dot" style={{ ["--step" as string]: 0.64 }} cx="412.5" cy="268" r="3.5" />
              </svg>

              <div className="flow-actions-grid">
                {/* Row 1 — primary actions (4). LTR col order: package(purple), whatsapp(green),
                    crm(blue), transfer(red). Visually in RTL Hebrew that reads
                    transfer→crm→whatsapp→package right-to-left, matching the reference. */}
                <div className="flow-card flow-card-action a-row1 a-col1 c-purple flow-reveal" style={{ ["--step" as string]: 0.20 }}>
                  <span className="fc-icon"><Icon.Package /></span>
                  <span className="fc-label">בדיקת משלוח</span>
                </div>
                <div className="flow-card flow-card-action a-row1 a-col2 c-green flow-reveal" style={{ ["--step" as string]: 0.24 }}>
                  <span className="fc-icon"><Icon.Chat /></span>
                  <span className="fc-label">שליחת WhatsApp</span>
                </div>
                <div className="flow-card flow-card-action a-row1 a-col3 c-blue flow-reveal" style={{ ["--step" as string]: 0.28 }}>
                  <span className="fc-icon"><Icon.Chart /></span>
                  <span className="fc-label">פתיחת ליד ב-CRM</span>
                </div>
                <div className="flow-card flow-card-action a-row1 a-col4 c-pink flow-reveal" style={{ ["--step" as string]: 0.32 }}>
                  <span className="fc-icon"><Icon.PhoneForward /></span>
                  <span className="fc-label">העברת שיחה</span>
                </div>
                {/* Row 2 — follow-ups (3) under LTR cols 1..3 */}
                <div className="flow-card flow-card-action flow-card-sub a-row2 a-col1 c-cyan flow-reveal" style={{ ["--step" as string]: 0.44 }}>
                  <span className="fc-icon"><Icon.CreditCard /></span>
                  <span className="fc-label">קישור לתשלום</span>
                </div>
                <div className="flow-card flow-card-action flow-card-sub a-row2 a-col2 c-purple flow-reveal" style={{ ["--step" as string]: 0.50 }}>
                  <span className="fc-icon"><Icon.Calendar /></span>
                  <span className="fc-label">קביעת פגישה</span>
                </div>
                <div className="flow-card flow-card-action flow-card-sub a-row2 a-col3 c-pink flow-reveal" style={{ ["--step" as string]: 0.56 }}>
                  <span className="fc-icon"><Icon.Receipt /></span>
                  <span className="fc-label">הפקת חשבונית</span>
                </div>
                {/* Row 3 — single follow-up under קביעת פגישה (LTR col 2) */}
                <div className="flow-card flow-card-action flow-card-sub a-row3 a-col2 c-purple flow-reveal" style={{ ["--step" as string]: 0.66 }}>
                  <span className="fc-icon"><Icon.Notes /></span>
                  <span className="fc-label">שליחת סיכום פגישה</span>
                </div>
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

      <section className="block team-section" ref={teamSectionRef}>
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
          {/* Static 5×2 grid of personas — each avatar lives in its own framed
              circular halo, so no neighbouring glows can blend into a panel.
              The --i index drives a per-card stagger reveal on scroll. */}
          <ul className="team-grid" aria-label="צוות סוכני פלואי">
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n, i) => (
              <li key={n} className="team-member" style={{ ["--i" as string]: i }}>
                <span className="team-halo" aria-hidden="true" />
                <img src={`/img/team/${n}.png`} alt="" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer>
        <div className="container">© Floeey · סוכן קולי לעסקים</div>
      </footer>
    </>
  );
}
