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
