"use client";

import { useEffect, useRef } from "react";

// Sections below the hero (benefits + how-it-works + final CTA + footer).
// Includes the parallax flying-Menachem hooked to scroll progress.
export default function StaticSections({ onOpenModal }: { onOpenModal: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const flyer = flyerRef.current;
    if (!section || !flyer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      const p = Math.max(0, Math.min(1, traveled / total));
      flyer.style.setProperty("--p", p.toFixed(4));
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
      <section className="block alt flyer-section" ref={sectionRef}>
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

      <section className="final-cta">
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

      <footer>
        <div className="container">© Floeey · סוכן קולי לעסקים</div>
      </footer>
    </>
  );
}
