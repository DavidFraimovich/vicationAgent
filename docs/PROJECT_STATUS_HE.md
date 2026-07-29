# סטטוס הפרויקט

## קיים ועובד

- Skill מקומי ל־Codex עם ארבעת קבצי המדיניות הקיימים.
- MCP מקומי מבוסס TypeScript.
- SQLite עם trips, places, itinerary, lodging candidates ו־audit log.
- ייבוא Google Takeout של מקומות שמורים וביקורות.
- 394 רשומות מקום יובאו למסד הנתונים.
- Dashboard מקומי לעריכת סטטוס, עדיפות, הערות, מסלול ולינות.
- CSV ל־Google My Maps.
- Google Calendar OAuth connector עם allowlist ליומן `חו״ל`.
- הגנה על אירועי הטיסה LY 289 ו־LY 290.
- Preview/confirm לפני כתיבת Calendar.
- כל פקודות Calendar מפנות למדיניות המחייבת ב־
  `.agents/skills/travel-planner/references/calendar-policy.md`.
- יצירה ועדכון דרך Calendar API גולמי עם plain text,‏ `sendUpdates: none`,
  הסרת המוזמן האישי ואימות חוזר אחרי הכתיבה.
- Google Maps Grounding Lite MCP מוגדר ב־Codex.
- Chrome DevTools MCP מוגדר כ־fallback, כבוי כברירת מחדל.
- URL builder לחיפוש Airbnb.
- validation למסלול ויומן פעולות.
- גיבוי DB.
- Plan A מלא ל־17 ימי הטיול: 26 מקומות מקושרים, 55 פריטי מסלול ו־9 רשומות לינה, כולל לינת Mestre המאושרת.
- רשימת Google Maps פרטית עם 22 מקומות ו־22 הערות תפעוליות קצרות.
- 139 אירועי מסלול פעילים ביומן `חו״ל`, ללא תגיות HTML וללא
  `davidfr97@gmail.com` כמוזמן; שתי הטיסות המוגנות אינן משתנות.
- Chrome מוגבל לחשבון `david04031997@gmail.com` בלבד.

## נשאר לביצוע או אישור

- לזהות חנות מסכות זולה מדויקת לפני שמירתה או יצירת אירוע סופי.
- להחליף את אישור Maps MCP הנוכחי ב־Maps API key תקין או OAuth access token; העבודה ב־Chrome כבר הושלמה.
- לבצע הזמנות/תשלומים רק לאחר אישור מפורש סמוך לפעולה.

## שלב פיתוח הבא המומלץ

1. לבחור לינות מתוך ה־shortlist ולפתוח checkout לאישור מחיר סופי.
2. להזמין חניות/רכבלים כשהחלונות הרשמיים של 2026 ייפתחו.
3. לבצע אימות מזג אוויר ושעות פעילות סמוך לטיול.
