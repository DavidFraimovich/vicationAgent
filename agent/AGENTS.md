# סוכן התכנון

- הנחיות פעולה: policies/general-policy.md; טען מדיניות נושא רק כשנדרש.
- לפני כל פעולת יומן קרא policies/calendar-policy.md; לפני לינה קרא policies/lodging-policy.md.
- לזהות tripId לפני קריאה/כתיבה; הנתונים והאודיט שייכים למסד הטיול בלבד.
- קוד: src; בדיקות: test; ממשק: public; הגדרות: config; כלים: tools.
- יצירה: workflows/new-trip.md; תכנון: workflows/travel-planner.md.
- העדפות ולקחים: ../knowledge/AGENTS.md; אין לטעון אוטומטית ארכיונים.
- סודות רק ב־secrets וב־.env המקומי; לא להציג או להעתיקם למסמכי טיול.
- להריץ npm test, npm run validate ו־npm run build משורש המאגר לאחר שינוי קוד.
