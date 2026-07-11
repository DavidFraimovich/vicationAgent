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
- Google Maps Grounding Lite MCP מוגדר ב־Codex.
- Chrome DevTools MCP מוגדר כ־fallback, כבוי כברירת מחדל.
- URL builder לחיפוש Airbnb.
- validation למסלול ויומן פעולות.
- גיבוי DB.

## דורש הגדרה במחשב שלך

- API key ל־Google Maps Grounding Lite.
- Google OAuth Desktop client ל־Calendar.
- התקנת Chrome plugin ב־Codex App, או הפעלת Chrome DevTools MCP.
- התחברות ידנית ראשונית לחשבונות בפרופיל Chrome הייעודי.

## שלב פיתוח הבא המומלץ

1. לפתור Place IDs לכל המקומות הרלוונטיים לדולומיטים.
2. לבנות itinerary מקומי מלא בלי לפרסם ל־Calendar.
3. להוסיף Browser workflow לשמירה ברשימות Google Maps.
4. לחפש ולדרג לינות לפי בסיסי הטיול.
5. לפרסם ל־Calendar לאחר diff ואישור.
