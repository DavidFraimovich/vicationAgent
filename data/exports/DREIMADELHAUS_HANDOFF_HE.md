# Handoff — Dreimädelhaus

המשך את משימת סנכרון Dreimädelhaus בטיול `dolomites-2026`.

## חובה לפני פעולה

1. קרא את `AGENTS.md`.
2. קרא את `.agents/skills/travel-planner/SKILL.md`.
3. לפני Calendar קרא את `.agents/skills/travel-planner/references/calendar-policy.md`.
4. לפני Google Maps קרא את `.agents/skills/travel-planner/references/maps-policy.md`.
5. השתמש רק בחשבון Chrome `david04031997@gmail.com` וביומן `חו״ל`:
   `00da743e003f133d4e2a97203388349337c0584d04ef6bb372d0d6080877f18d@group.calendar.google.com`.

## מה כבר הושלם

- `plan.json`, SQLite והמסמך האנושי עודכנו לגרסה `plan-a-2026-09-05-v25`.
- Google Drive HTML עודכן ואומת: 17 ימים, 147 פריטי מסלול.
- My Maps CSV עודכן ל־89 מקומות.
- `npm run validate`, `npm test` ו־`npm run build` עברו.
- Dreimädelhaus שובצה ב־22.9 אחרי השקיעה:
  - 19:35–20:15 — חזרה לרכב ונסיעה למסעדה.
  - 20:15–21:30 — ארוחת ערב.
  - 21:30–22:15 — נסיעה ללינה ב־Laion.

## המקום

- שם: `Dreimädelhaus`
- כתובת: `Via Coller 10, 39040 Funes BZ, Italy`
- קישור:
  https://www.google.com/maps/place/Dreim%C3%A4delhaus/@46.6465682,11.6881979,17z/data=!4m6!3m5!1s0x477811ae7f59d65b:0x2ddd64b46ae8ec66!8m2!3d46.6465682!4d11.6881979!16s%2Fg%2F11c206ch7r
- הערה מדויקת וקצרה: `המלצה של ליילה`
- טלפון: `+39 0472 840102`
- שעות רשמיות שנבדקו ב־05.09.2026: בשלישי 16:30–22:00; מטבח 17:00–21:00; פיצה 17:00–22:00.
- שולחן טרם הוזמן.

## Google Maps — נותר לבצע

ב־Chrome המחובר לחשבון `david04031997@gmail.com`:

1. פתח את קישור המקום.
2. שמור ברשימת האוכל הקיימת עם סימון הלב; אל תיצור רשימה חדשה אם קיימת רשימת אוכל מתאימה.
3. הוסף את ההערה הקצרה `המלצה של ליילה`.
4. קרא שוב את מצב המקום ואמת שהשמירה וההערה מופיעות בחשבון הנכון.
5. עדכן ב־SQLite את `externalMapSync` ל־`saved` ותעד audit.

## Google Calendar — בוצע חלקית ונדרש אימות גולמי

חמישה אירועים קיימים/נוצרו ביומן `חו״ל` ונקראו בחזרה ללא מוזמנים:

- נשנוש 16:15–17:15 — `5loptrk1lec2pe11leg4p5gq08`
- נסיעה למסעדה 19:35–20:15 — `6vcq7u2v9u9vv1ofoipj73sb30`
- ארוחת ערב 20:15–21:30 — `vuqq9o98nlk2u5auaaogsei95g`
- נסיעה ללינה 21:30–22:15 — `60dm5iserr3rqc4a14k3v66p0g`
- סיום היום 22:15–22:30 — `mmr04vs14mgc4apstsdcu4enlk`

מחבר Calendar עטף תיאורים ב־HTML בתשובת הכתיבה, אף שהקריאה המנורמלת הציגה טקסט רגיל. לכן:

1. אל תמחק ואל תיצור מחדש את האירועים.
2. השתמש ב־Google Calendar API גולמי או ב־Apps Script Advanced Calendar Service.
3. בצע `events.patch` לפי ה־Event IDs הקיימים עם `sendUpdates: none`.
4. תיאור אירוע הארוחה צריך להיות טקסט פשוט וקצר, בלי HTML או Markdown:

   ```text
   Google Maps:
   https://www.google.com/maps/place/Dreim%C3%A4delhaus/@46.6465682,11.6881979,17z/data=!4m6!3m5!1s0x477811ae7f59d65b:0x2ddd64b46ae8ec66!8m2!3d46.6465682!4d11.6881979!16s%2Fg%2F11c206ch7r

   המלצה של ליילה
   מטבח עד 21:00; פיצה עד 22:00.
   שולחן טרם הוזמן.
   ```

5. בצע `events.get` גולמי לכל חמשת האירועים ואמת: Calendar ID נכון, תיאור ללא תגיות, URLs מלאים, אין `davidfr97@gmail.com` ב־attendees.
6. תעד את האימות ב־audit המקומי ועדכן את סטטוס הסנכרון מ־`partial` ל־`completed`.
7. שלח את הודעת Telegram המסכמת הנדרשת לפי `AGENTS.md`, לאחר השלמת כל הפעולות.
