# ארכיטקטורה

```text
Codex
├── AGENTS.md
├── travel-planner Skill
├── Google Maps Grounding Lite MCP
├── @Chrome / Chrome DevTools MCP
└── travel_local MCP
    ├── SQLite
    ├── Google Calendar connector
    ├── My Maps export
    ├── Airbnb URL builder
    ├── itinerary validation
    └── audit log
```

## למה יש גם Skill וגם MCP?

- **Skill** מגדיר איך לחשוב ולעבוד: סדר פעולות, כללי תכנון, בטיחות ותבניות.
- **MCP** מבצע פעולות: קורא/כותב נתונים, יוצר אירועים, מייצא CSV ומתעד פעולות.
- **SQLite** הוא מקור האמת למצב המשתנה.
- **YAML/Markdown** הם מקור האמת למדיניות הניתנת לעריכה.
- עבור כל פקודת Calendar, מקור האמת המחייב הוא
  `.agents/skills/travel-planner/references/calendar-policy.md`. שכבת ה־MCP,
  סוכני Codex והתיעוד מפנים אליו ואינם מגדירים מסלול כתיבה חלופי.

## מסלול כתיבת Calendar

```text
calendar-policy.md
→ קריאת מצב קיים ו-preview
→ Google Calendar API גולמי
→ עדכון במקום לפי Event ID עם sendUpdates: none
→ events.get ואימות plain text / URLs / attendees
→ audit מקומי
```

Advanced Calendar Service של Apps Script הוא fallback ל־API כאשר המחבר
המקומי אינו יכול לחשוף או לאמת מידע גולמי. Google Calendar rich-text editor
ו־Apple Calendar אינם משטחי כתיבה או ניקוי.

## מה נשאר חיצוני?

- Google Maps Grounding Lite הוא MCP מנוהל של Google.
- Chrome הוא plugin רשמי של Codex או MCP של Chrome DevTools.
- אתרים כמו Airbnb מופעלים דרך Chrome המחובר לחשבון הייעודי.

## עיקרון שקיפות

כל פעולה חיצונית מקבלת רשומת audit הכוללת:

- ספק;
- סוג פעולה;
- ישות מקומית;
- payload מרודד ללא סודות;
- תוצאה;
- dry-run או apply;
- timestamp.
