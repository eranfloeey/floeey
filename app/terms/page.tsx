import type { Metadata } from "next";
import { Suspense } from "react";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "תקנון ותנאי שימוש | Floeey",
  description: "תקנון, מדיניות פרטיות ומדיניות ביטולים של Floeey.",
};

export default function TermsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0d12" }} />}>
      <TermsClient />
    </Suspense>
  );
}
