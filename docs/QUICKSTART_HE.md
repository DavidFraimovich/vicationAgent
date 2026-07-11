# התחלה מהירה

## 1. דרישות

- Node.js 22.5 ומעלה.
- Codex App / Codex CLI / תוסף IDE.
- Chrome עדכני.
- חשבון Google Cloud עם Billing עבור Maps Grounding Lite.
- פרופיל Chrome ייעודי לסוכן.

## 2. התקנה

```bash
cd codex-travel-agent-local
cp .env.example .env
npm run setup
```

הפקודה יוצרת את מסד הנתונים ומייבאת את קבצי Google Takeout שכבר נמצאים ב־`data/imports/original`.

## 3. Dashboard

```bash
npm run dashboard
```

פתח:

```text
http://127.0.0.1:4177
```

מכאן אפשר לראות ולערוך מקומות, סטטוסים, עדיפויות, מסלול, מועמדי לינה ויומן פעולות.

## 4. Google Maps MCP

1. צור/בחר Google Cloud project והפעל Billing.
2. הפעל את השירות:

```bash
gcloud services enable mapstools.googleapis.com
```

3. צור API key המוגבל ל־Maps Grounding Lite, או ספק OAuth access token מתאים.
4. הוסף ל־shell:

```bash
export GOOGLE_MAPS_API_KEY="..."
# או:
export GOOGLE_MAPS_OAUTH_ACCESS_TOKEN="..."
```

5. פתח מחדש את Codex והריץ:

```text
/mcp
```

הקובץ `.codex/config.toml` כבר מכיל את השרת:

```text
https://mapstools.googleapis.com/mcp
```

## 5. Chrome

ב־Codex App עדיף להתקין את plugin הרשמי של Chrome ולהשתמש ב־`@Chrome`.
יש לעבוד רק בסשן המחובר לחשבון `david04031997@gmail.com`; אין לעבור לפרופיל אחר.

עבור CLI/IDE ניתן להפעיל את fallback ב־`.codex/config.toml`:

```toml
[mcp_servers.chrome_devtools]
enabled = true
```

ב־Chrome 144 ומעלה:

1. פתח `chrome://inspect/#remote-debugging`.
2. אפשר חיבורי debugging.
3. הפעל את Chrome בפרופיל הייעודי.
4. Codex יחבר את `chrome-devtools-mcp` עם `--autoConnect`.

## 6. Google Calendar מקומי

1. צור OAuth Client מסוג Desktop app ב־Google Cloud.
2. הורד JSON ל־`secrets/google-oauth-client.json`.
3. הרץ:

```bash
npm run google:auth
```

4. אשר גישה ליומן.
5. בדוק דרך Codex את כלי `calendar_list_events`.
6. פעולות כתיבה דורשות `confirm: true`.

לפני כתיבה אפשר לייצר קובץ תצוגה מקדימה מלא:

```bash
npm run calendar:preview
```

## 7. בניית תוכנית Dolomites 2026

```bash
npm run seed:plan
npm run validate
npm run export:mymaps
npm run calendar:preview
```

## 8. הפעלה בתוך Codex

פתח את התיקייה כפרויקט מהימן והתחל למשל:

```text
קרא את travel-planner skill, בדוק את מצב הטיול dolomites-2026,
פתור את כל המקומות שעדיין לא resolved באמצעות Google Maps,
שמור את התוצאות מקומית בלבד והצג לי diff.
```
