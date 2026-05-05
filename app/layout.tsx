import type { Metadata } from "next";
import "./globals.css";
import { getActivePixels } from "@/lib/data";

export const metadata: Metadata = {
  title: "Floeey - סוכן קולי לעסקים | מנחם עונה לכל לקוח תוך שניות",
  description:
    "סוכן AI שעונה לכל לקוח תוך שניות, 24/7, ולא מפספס אף ליד. השאר פרטים ומנחם כבר מתקשר.",
  icons: { icon: "/img/logo.png" },
  openGraph: {
    title: "Floeey - סוכן קולי לעסקים",
    description: "עונה לכל לקוח תוך שניות, 24/7. לא מפספס אף ליד.",
    images: ["/img/logo.png"],
  },
};

// Inject head/body pixels at runtime via a single inline boot script.
// Lets users paste arbitrary HTML (script/noscript/iframe) into the admin pixel boxes.
function PixelInjector({ head, body }: { head: string; body: string }) {
  if (!head && !body) return null;
  const code = `
    (function () {
      var h = ${JSON.stringify(head || "")};
      var b = ${JSON.stringify(body || "")};
      if (h) document.head.insertAdjacentHTML("beforeend", h);
      if (b) document.body.insertAdjacentHTML("afterbegin", b);
      // Activate any inserted <script> tags (innerHTML doesn't execute them)
      function run(scope) {
        scope.querySelectorAll("script").forEach(function (s) {
          var n = document.createElement("script");
          for (var i = 0; i < s.attributes.length; i++) {
            n.setAttribute(s.attributes[i].name, s.attributes[i].value);
          }
          if (s.src) n.src = s.src;
          else n.text = s.textContent || "";
          s.parentNode.replaceChild(n, s);
        });
      }
      run(document.head);
      run(document.body);
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pixels = await getActivePixels("home").catch(() => ({ head: "", body: "" }));
  return (
    <html lang="he" dir="rtl">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!document.cookie.includes('floeey_uid=')){var u=(self.crypto&&self.crypto.randomUUID)?self.crypto.randomUUID():(Math.random().toString(36).slice(2)+Date.now().toString(36));document.cookie='floeey_uid='+u+'; max-age=31536000; path=/; samesite=lax';}`,
          }}
        />
        <PixelInjector head={pixels.head} body={pixels.body} />
        {children}
      </body>
    </html>
  );
}
