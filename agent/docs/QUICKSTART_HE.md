# תחילת עבודה

לפתוח ב־Codex את vacationAgent כשורש הפרויקט וה־Git. כל פקודות npm רצות מהשורש.

```bash
cp agent/.env.example agent/.env
npm install
npm run init
npm run dashboard
```

ממשק: http://127.0.0.1:4177. בוחרים טיול ברשימה; אין טיול מקובע בקוד.
הפעלה ראשונית רק יוצרת מסד לטיול שנבחר אם חסר; אינה מייבאת או זורעת מחדש טיול היסטורי.

- כניסת ניווט: ../../AGENTS.md.
- הגדרות: ../config/travel-agent.yaml; הרשאות: ../config/permissions.yaml.
- skills נטענים מ־../../.agents/skills ומפנים לתהליכים תחת ../workflows.
- OAuth: ../secrets/google-oauth-client.json ואז `npm run google:auth`.
- בדיקה: `./agent/scripts/check.sh`.
- גיבוי עקבי לטיול: `npm run backup -- --trip <id>`.
- לפתיחת טיול: לקרוא ../workflows/new-trip.md.

אין להגדיר מסד גלובלי משותף. לבדיקות משתמשים ב־TRAVEL_AGENT_TRIPS_DIR בתיקייה זמנית. תאימות TRAVEL_AGENT_DB מחייבת `{tripId}` בנתיב.
