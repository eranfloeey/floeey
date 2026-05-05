import { cookies, headers } from "next/headers";
import LandingPage from "@/components/LandingPage";
import { listVariants } from "@/lib/db";
import { pickVariantForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Stable user id without middleware: cookie if present, else IP+UA hash.
  const cookieUid = cookies().get("floeey_uid")?.value;
  const h = headers();
  const fingerprint =
    cookieUid ||
    `${h.get("x-forwarded-for") || "0"}::${h.get("user-agent") || "ua"}`;

  const variants = await listVariants().catch(() => []);
  const v = pickVariantForUser(variants, fingerprint);
  return (
    <LandingPage
      variantId={v?.id || "control"}
      overrides={v?.overrides || {}}
    />
  );
}
