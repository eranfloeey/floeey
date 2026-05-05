# Floeey - Landing Pages + Admin

Next.js 14 (App Router) על Vercel. כולל LP, מערכת לידים, A/B test, ופיקסלים.

## פיתוח לוקאלי

```bash
npm install
npm run dev
```
- LP: http://localhost:3000
- אדמין: http://localhost:3000/admin (סיסמה ברירת מחדל: `123123123`)

ב-dev בלי DATABASE_URL, נתונים נשמרים ב-`data/local.json` (לא נכנס לגיט).

## משתני סביבה (Production)

```
POSTGRES_URL=...           # מ-Vercel Postgres / Neon
ADMIN_PASSWORD=123123123   # סיסמת אדמין
ADMIN_SECRET=...            # סוד לחתימת cookies (32+ תווים)
```

## פריסה ל-Vercel

1. `vercel link` בתיקייה
2. ב-Vercel Dashboard: Storage → Create → Postgres → Connect
3. הגדר `ADMIN_PASSWORD` ו-`ADMIN_SECRET` ב-Environment Variables
4. `git push` → פריסה אוטומטית

## מבנה

- `app/page.tsx` — LP. בוחר variant לפי cookie.
- `app/admin/*` — דשבורד ניהול (לידים / A/B / פיקסלים)
- `app/api/*` — endpoints
- `components/` — Hero, LeadModal, StaticSections, LandingPage
- `lib/db.ts` — שכבת נתונים (Postgres + JSON-fallback)
- `lib/auth.ts` — auth ב-cookie חתום (jose JWT)
- `lib/data.ts` — server-only helpers (variants, pixels)
- `lib/copy.ts` — ברירות מחדל קופי משותפות (server+client)
- `middleware.ts` — מקצה `floeey_uid` cookie לכל מבקר חדש
- `public/img`, `public/fonts` — נכסים סטטיים
