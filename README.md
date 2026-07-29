# vicationAgent
this is a vication planning agent created to help me plan and handle all the planning work

# Codex Travel Agent Local

A local-first, inspectable travel-agent workspace for Codex.

## What is included

- project-scoped Codex MCP configuration;
- a reusable `travel-planner` skill;
- local SQLite state;
- a local MCP server;
- Google Calendar OAuth connector restricted to one allowlisted calendar;
- Google Maps Grounding Lite MCP configuration;
- Chrome execution policy and optional Chrome DevTools MCP;
- Google Takeout importers;
- My Maps CSV export;
- Airbnb search URL builder;
- local dashboard;
- audit log;
- the supplied Dolomites 2026 planning policies and exports.

Start with [docs/QUICKSTART_HE.md](docs/QUICKSTART_HE.md).

לקריאה, הערות ועדכון של הטיול עצמו: [התוכנית המלאה בעברית](docs/DOLOMITES_2026_FULL_PLAN_HE.md).

## Dolomites 2026 — current execution state

- complete local Plan A for 2026-09-09 through 2026-09-25;
- 26 trip-linked places, 55 itinerary items and 9 lodging records (including the confirmed Mestre stay);
- private Google Maps list with 22 verified saves and one short operational note per save;
- browser automation restricted to `david04031997@gmail.com`;
- Calendar dry-run export available; the two existing flights and the unresolved mask-shop draft are excluded.

Run the deterministic workflow with:

```bash
npm run seed:plan
npm run validate
npm run export:mymaps
npm run calendar:preview
```

Before any Calendar read, preview, create, update, edit, or delete command,
read and follow
`.agents/skills/travel-planner/references/calendar-policy.md`. Calendar writes
use the raw Google Calendar API workflow defined there: in-place Event ID
updates, canonical plain-text descriptions, `sendUpdates: none`, itinerary
events only in `חו״ל` without the personal account as an attendee, and a raw
post-write verification. Do not use rich-text Calendar editing or delete and
recreate events to repair formatting.
