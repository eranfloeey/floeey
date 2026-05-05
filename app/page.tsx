import { cookies } from "next/headers";
import LandingPage from "@/components/LandingPage";
import { listVariants } from "@/lib/db";
import { pickVariantForUser } from "@/lib/data";

export const dynamic = "force-dynamic"; // We pick a variant per request

export default async function Home() {
  const userId = cookies().get("floeey_uid")?.value || "anon";
  const variants = await listVariants().catch(() => []);
  const v = pickVariantForUser(variants, userId);
  return (
    <LandingPage
      variantId={v?.id || "control"}
      overrides={v?.overrides || {}}
    />
  );
}
