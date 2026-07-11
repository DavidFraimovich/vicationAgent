# מתחילים כאן — סוכן הנסיעות המקומי ל־Codex

התיקייה הזאת היא סביבת העבודה המרכזית של הסוכן. היא כוללת קוד מקור, קונפיגורציה, Skills, כלי MCP, נתוני הטיול, Dashboard ויומן פעולות.

## הפעלה ראשונית

```bash
cp .env.example .env
npm install
npm run init
npm run import:provided
npm run dashboard
```

לאחר מכן פותחים בדפדפן:

```text
http://127.0.0.1:4177
```

## חיבור ל־Codex

1. פתחי את התיקייה כפרויקט ב־Codex App, CLI או IDE.
2. סמני את הפרויקט כ־Trusted כדי ש־Codex יטען את `.codex/config.toml`.
3. הריצי `npm install` לפחות פעם אחת.
4. הפעילי מחדש את Codex.
5. בדקי `/mcp` וחפשי את `travel_local`.

## הפקודה הראשונה המומלצת ל־Codex

```text
קרא את AGENTS.md ואת travel-planner skill.
קרא את מצב הטיול dolomites-2026 דרך travel_local.
אל תבצע כרגע שינויים חיצוניים.
הצג לי מה כבר קיים, מה לא פתור, ומה סדר העבודה המומלץ.
```

## קבצים שמשנים ידנית

- `config/travel-agent.yaml` — ספקים, Calendar ID, browser allowlist והגדרות כלליות.
- `config/permissions.yaml` — הרשאות ומתי נדרש אישור.
- `config/map-categories.yaml` — קטגוריות, אייקונים וסטטוסים.
- `AGENTS.md` — כללי העבודה הקבועים של Codex בפרויקט.
- `.agents/skills/travel-planner/SKILL.md` — workflow של הסוכן.
- `.agents/skills/travel-planner/references/` — הנחיות הטיול הקיימות שלך.
- `.codex/config.toml` — חיבורי MCP והגדרות אישור כלים.

## מידע שמשתנה בזמן העבודה

- `data/travel-agent.sqlite` — מקור האמת המקומי.
- `data/exports/` — CSV ל־My Maps וקבצי export אחרים.
- `data/backups/` — גיבויי DB.
- `data/imports/original/` — קבצי Takeout המקוריים.

## Google Maps MCP

```bash
gcloud services enable mapstools.googleapis.com
export GOOGLE_MAPS_GROUNDING_API_KEY="..."
```

לאחר הפעלה מחדש של Codex, השרת `google_maps` מספק חיפוש מקומות, מסלולי רכב/הליכה ומזג אוויר.

## Google Calendar

שמרי OAuth Desktop Client כאן:

```text
secrets/google-oauth-client.json
```

ואז:

```bash
npm run google:auth
```

ה־connector המקומי מוגבל ליומן `חו״ל` ומגן על שתי הטיסות שהוגדרו.

## Chrome

ב־Codex App עדיף להתקין את plugin הרשמי של Chrome ולהשתמש ב־`@Chrome`.

ב־CLI/IDE ניתן לשנות ב־`.codex/config.toml`:

```toml
[mcp_servers.chrome_devtools]
enabled = true
```

## בדיקה מלאה

```bash
./scripts/check.sh
```

## גיבוי

```bash
npm run backup
```
