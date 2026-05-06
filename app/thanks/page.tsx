import Link from "next/link";

// Post-submit confirmation. Reached after the lead modal POST resolves with
// ok:true. The flying Menachem PNG floats with a CSS keyframe (defined in
// app/globals.css under .thanks-art).
export const metadata = {
  title: "תודה! | Floeey",
};

export default function ThanksPage() {
  return (
    <main className="thanks-page">
      <div className="thanks-art">
        <img src="/img/menachem-flying-v2.png" alt="" aria-hidden="true" />
      </div>
      <h1 className="thanks-title">
        וואו! מרגש!
        <br />
        אני כבר מרים את השפופרת ומצלצל..
      </h1>
      <Link href="/" className="thanks-back">
        חזרה לעמוד הבית
      </Link>
    </main>
  );
}
