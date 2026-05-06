"use client";

import { useEffect, useRef } from "react";

// Sections below the hero (benefits + how-it-works + final CTA + team + footer).
// Two scroll-driven parallax pieces:
//  1. Flying Menachem across the benefits section (bottom-right -> top-left)
//  2. Tentacle arm reaching from the right of the final CTA, sliding up & out as you scroll
export default function StaticSections({ onOpenModal }: { onOpenModal: () => void }) {
  const flyerSectionRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLImageElement>(null);
  const armSectionRef = useRef<HTMLElement>(null);
  const armRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
          src="/img/menachem-flying.png"
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
              <div className="icon">⚡</div>
              <h4>מענה תוך שניות</h4>
              <p>כל פנייה נענית מיד. לא תור, לא המתנה, לא לידים שמתקררים.</p>
            </div>
            <div className="benefit">
              <div className="icon">🕐</div>
              <h4>זמין 24/7</h4>
              <p>
                גם בלילה, גם כשאתה בפגישה. <span className="m">מנחם</span> תמיד שם.
              </p>
            </div>
            <div className="benefit">
              <div className="icon">✓</div>
              <h4>לא מפספס אף ליד</h4>
              <p>כל שיחה נענית, כל ליד נרשם, כל הזדמנות עוברת אליך מסוננת.</p>
            </div>
            <div className="benefit">
              <div className="icon">📈</div>
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
            <div className="flow-row flow-row-trigger">
              <aside className="flow-note">
                <strong>טריגר</strong>
                <span>מה מפעיל את הזרימה</span>
              </aside>
              <div className="flow-card flow-card-trigger">
                <span className="fc-badge fc-badge-trigger">⚡</span>
                <span className="fc-icon">📞</span>
                <span className="fc-label">כשנכנסת שיחה</span>
              </div>
            </div>

            <div className="flow-line" aria-hidden="true"></div>

            {/* AI AGENT */}
            <div className="flow-row flow-row-agent">
              <aside className="flow-note">
                <strong>סוכן AI</strong>
                <span>מנתח את השיחה ומחליט מה לעשות</span>
              </aside>
              <div className="flow-card flow-card-ai">
                <span className="fc-badge fc-badge-ai">✨</span>
                <img className="fc-avatar" src="/img/menachem-linkedin.png" alt="" aria-hidden="true" />
                <span className="fc-label">
                  <strong>מנחם</strong>
                  <em>סוכן הקול שלכם</em>
                </span>
              </div>
            </div>

            <div className="flow-fanout" aria-hidden="true">
              <svg viewBox="0 0 800 80" preserveAspectRatio="none">
                <path d="M400,0 L400,30 Q400,40 390,40 L60,40 Q50,40 50,50 L50,80" />
                <path d="M400,0 L400,30 Q400,40 390,40 L160,40 Q150,40 150,50 L150,80" />
                <path d="M400,0 L400,30 Q400,40 390,40 L260,40 Q250,40 250,50 L250,80" />
                <path d="M400,0 L400,30 Q400,40 390,40 L360,40 Q350,40 350,50 L350,80" />
                <path d="M400,0 L400,30 Q400,40 410,40 L450,40 Q460,40 460,50 L460,80" />
                <path d="M400,0 L400,30 Q400,40 410,40 L550,40 Q560,40 560,50 L560,80" />
                <path d="M400,0 L400,30 Q400,40 410,40 L650,40 Q660,40 660,50 L660,80" />
                <path d="M400,0 L400,30 Q400,40 410,40 L750,40 Q760,40 760,50 L760,80" />
              </svg>
            </div>

            {/* ACTIONS */}
            <div className="flow-row flow-row-actions">
              <aside className="flow-note">
                <strong>פעולות ואינטגרציות</strong>
                <span>מנחם מבצע את הפעולה במערכת המתאימה</span>
              </aside>
              <div className="flow-actions-grid">
                <div className="flow-card flow-card-action"><span className="fc-icon">💳</span><span className="fc-label">קישור לתשלום</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">💬</span><span className="fc-label">שליחת WhatsApp</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">📅</span><span className="fc-label">קביעת פגישה</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">📊</span><span className="fc-label">פתיחת ליד ב-CRM</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">🧾</span><span className="fc-label">הפקת חשבונית</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">📦</span><span className="fc-label">בדיקת משלוח</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">📑</span><span className="fc-label">חוזה לחתימה</span></div>
                <div className="flow-card flow-card-action"><span className="fc-icon">📞</span><span className="fc-label">העברת שיחה</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta arm-section" ref={armSectionRef}>
        <img
          className="arm"
          src="/img/menachem-arm.png"
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
          <img className="team-img" src="/img/team.png" alt="צוות הסוכנים של פלואי" />
        </div>
      </section>

      <footer>
        <div className="container">© Floeey · סוכן קולי לעסקים</div>
      </footer>
    </>
  );
}
