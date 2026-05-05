# Floeey — Landing Pages

עמודי נחיתה לסוכן הקולי של פלואי. סטטי לחלוטין (HTML/CSS/JS), נפרס על Vercel.

## מבנה

- `index.html` — עמוד הנחיתה הראשי (קמפיין "מנחם")
- `styles.css` — עיצוב, צבעי מותג, פונט מונופולי
- `assets/fonts/` — FbMonopoly (עברית, 5 משקלים)
- `assets/img/` — לוגו ונכסים גרפיים
- `reference/` — נכסי קמפיין לעיון בלבד (לא חלק מהאתר)
- `vercel.json` — cache headers לפונטים ונכסים

## פיתוח לוקאלי

```bash
python3 -m http.server 8080
```
פתח: http://localhost:8080

## פריסה

מחובר ל-Vercel — כל push ל-`main` נפרס אוטומטית.
