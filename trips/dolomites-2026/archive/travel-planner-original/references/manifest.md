# Codex Travel Agent Dolomites 2026 — Manifest

Version: **v6 — mandatory raw Calendar API policy**

Active files:

1. `codex_01_general_travel_agent.md` — מדיניות תכנון כללית, סגנון, טיסות, ונציה, סדר מסלול East-first, שאלות בחירה מותרות.
2. `codex_02_google_maps_workflow.md` — עבודה עם Google Maps, התחברות, סימונים, עדיפויות, רשימת סימון מלאה כולל תוספות Gemini.
3. `calendar-policy.md` — מקור האמת המחייב לכל קריאה, preview,
   יצירה/עדכון/עריכה/מחיקה ב־Google Calendar, כולל Calendar ID, plain text,
   `sendUpdates: none`, הסרת המוזמן האישי ואימות גולמי אחרי כתיבה.
4. `codex_04_places_backlog_dolomites_venice.md` — רשימת המקומות לתכנון וסימון, מחולקת ל־Plan A / Plan B / Conditional / Reject as default.

Removed from active architecture:

- `codex_05_research_answers_and_decisions.md` — הוסר בכוונה. החלטות המחקר הוטמעו בקבצים 01–04 כדי לא להשאיר קובץ שאלות ותשובות.

Calendar ID:

```text
00da743e003f133d4e2a97203388349337c0584d04ef6bb372d0d6080877f18d@group.calendar.google.com
```

Default route after Gemini review and Venice/rental-car update:

```text
Venice / Hostel One, 1.5 days → pick up rental car → Cortina/Misurina/Dobbiaco → scenic transfer → Ortisei/Val Gardena → Mestre/Conegliano/VCE
```

Allowed remaining open choices:

- עוד מסלול/תצפית או יום ספא/מנוחה.
- בחירה לפי מזג אוויר בפועל.
- בחירה לפי אנרגיה באותו יום.

Everything else is an execution task for the agent: check Maps, check web/source, verify cable cars/parking/tickets, then update Calendar.


Braies detailed rule:

```text
Lago di Braies / Pragser Wildsee is Plan A: early morning, reserved close parking, a shared wooden boat for about 45 minutes using €20 as the verified 2026 price, then an easy circular lake walk. Keep a total block of 4–5 hours for parking, boat, walking, photos and a snack. Re-check parking and boat operations close to travel.
```


## Tre Cime early morning update

- Tre Cime / Drei Zinnen is a Plan A mandatory anchor.
- Arrival target: 07:30–08:00 at Rifugio Auronzo/start point.
- Route: about 10 km, 4–5 hours.
- Bring sandwiches/snacks/water; do not rely on Rifugi being open.
