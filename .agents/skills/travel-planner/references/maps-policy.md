---
project: Dolomites 2026 Travel Agent for Lena
source_file: vacation_planning_guidelines_dolomites_2026.md
language: he
version: Codex split v6 — Venice 1.5 days, rental car, Braies + Tre Cime early morning Plan A
role: google maps workflow
---

# CODEX 02 — הנחיות עבודה עם Google Maps

## 1. מטרת הקובץ
הקובץ הזה מגדיר איך סוכן Codex צריך לעבוד עם Google Maps עבור הטיול: התחברות, חיפוש מקומות, סימון ברשימות/אייקונים, הבנת הלוגיקה הקיימת, והפיכת מפה לכלי תכנון.

אין להשאיר שאלות ותשובות. אחרי מחקר, כל מקום מקבל סטטוס פעולה: **Plan / Map only / Conditional / Reject as default**.

## 2. עקרון העבודה
Google Maps הוא שכבת עבודה:

1. איסוף מקומות.
2. סיווג לפי משמעות.
3. סימון עדיפות.
4. בדיקת גיאוגרפיה.
5. בחירת מקומות ליום מסוים.
6. העברה ל־Google Calendar רק אחרי שהמקום מתאים למסלול.


### מקומות לוגיסטיקה שחייבים לסמן

- **Rental car pickup point — Venice area / VCE / Mestre** — 🧭 Plan A. לסמן רק אחרי בחירת חברת השכרה/נקודת איסוף מדויקת. הרכב נאסף אחרי שמסיימים את ונציה, לא ביום הנחיתה ולא לפני שיטוט בתוך ונציה.
- **Lago di Braies parking close to lake** — 🧭 Plan A. לחפש ולסמן את החניה הקרובה/הרלוונטית לאגם, ולבדוק אם צריך הזמנה מראש.
- **Lago di Braies boat rental / boathouse** — 🎟 Plan A. לסמן את נקודת הסירות אם מופיעה ב־Maps. הערת עבודה: לתכנן סירה לכ־2 שעות, מחיר עבודה 50€ עד בדיקה עדכנית.

## 3. כניסה והתחברות
כאשר עובדים דרך דפדפן:

1. לפתוח `https://maps.google.com`.
2. לוודא שמחוברים לחשבון Google של המשתמש.
3. לפתוח Saved / שמורים.
4. לבדוק אם קיימות רשימות עם שמות/אייקונים קיימים.
5. לא ליצור רשימה חדשה אם קיימת רשימה מתאימה.
6. אם אין רשימה מתאימה, ליצור רשימה בשם ברור עם האייקון הרלוונטי.

## 4. שיטת הסימון שלכם
המשתמשים מסמנים מקומות לפי משמעות, לא רק לפי “אהבתי”.

| סימון | משמעות | דוגמאות | שימוש בתכנון |
|---|---|---|---|
| ❤️ לב | אוכל כללי, קפה, מסעדה, בייקרי, קינוח | café, trattoria, gelato, bakery, market, hütte, rifugio | ארוחת בוקר/צהריים/קינוח |
| 🥩 סטייק | בשר, סטייק, גריל, המבורגר, BBQ, smoked meat | steakhouse, grill, burger, smokehouse | ערב או צהריים מרכזי |
| 👁 עין | תצפית / נקודת צילום / פנורמה | viewpoint, lookout, pass, belvedere, tower | עוגן נוף, שקיעה, צילום |
| 🏔 טבע | אגם, הר, מפל, מסלול, עמק, רכבל | lago, lake, alm, valley, trail | עוגן יום טבע |
| 🎟 חוויה | כרטיס/אטרקציה/ספא/מוזיאון/פעילות | spa, museum, boat, cable car, experience | דורש שעות/מחיר/הזמנה |
| 🧭 לוגיסטיקה | לינה, חניה, תחנה, שדה, לוקרים, רכב | hostel, airport, parking, station | תפעול, לא עוגן חוויה |
| ??? | מקום מעניין אך מותנה | שביל חשוף, מקום קשה, חניה לא ברורה | לא נכנס ליומן עד בדיקה |

## 5. מקום יכול לקבל כמה משמעויות

- Baita Sofie Hütte = ❤️ אוכל + 👁 תצפית + 🏔 הר.
- Rifugio Scoiattoli / Rifugio Averau = ❤️ אוכל + 👁 תצפית + 🏔 הר.
- Lago di Braies = 🏔 טבע + 👁 תצפית + 🎟 סירה אם עושים שייט.
- Cortina d’Ampezzo = 🧭 בסיס + ❤️ אוכל + שיטוט עירוני.
- Passo Giau / Passo Pordoi / Passo Falzarego = 👁 תצפית + 🏔 טבע + 🧭 עצירת דרך.
- Hostel One = 🧭 לינה בלבד, לא ❤️.

אם Google Maps מאפשר רק שמירה ברשימה אחת, לבחור את הרשימה הדומיננטית ולהוסיף הערה בשם/בתיאור אם אפשר.

## 6. עדיפות פעולה
לכל מקום לקבוע עדיפות וסטטוס:

| עדיפות | משמעות |
|---|---|
| A | חובה לתכנון ראשוני אם מזג אוויר ולוגיסטיקה מאפשרים |
| B | רצוי אם נמצאים באזור |
| C | השראה/אופציה, לא מתכננים סביבו |
| Conditional | מתאים רק ביום מסוים/מזג אוויר טוב/אם רוצים יותר מסלול |
| Reject as default | לא מתאים כברירת מחדל, אבל אפשר לשמור במפה כהשראה אם המשתמש רוצה |

שם/הערה מומלצים:

```text
[A][🏔👁] Seceda — short cable-car day + hut, not hard trek
[B][👁🧭] Passo Pordoi / Sass Pordoi — scenic transfer option, cable-car weather check
[Conditional][🏔] Lago di Sorapis — narrow/cables, only strong route day
[Reject-default][🏔] Rifugio Puez overnight traverse — not for default itinerary
```

## 7. סדר עבודה לסימון מקום חדש
כאשר המשתמש שולח שם מקום / צילום מסך / לינק TikTok / מסלול Gemini:

1. לחלץ את שם המקום המדויק.
2. לחפש אותו ב־Google Maps.
3. לוודא שזה המקום הנכון לפי מדינה/אזור/תמונה.
4. לבדוק אם הוא כבר שמור.
5. אם שמור — לא לשמור כפול; רק לעדכן הערה/עדיפות אם אפשר.
6. אם לא שמור — לשמור ברשימה הנכונה.
7. להוסיף עדיפות A/B/C/Conditional/Reject-default.
8. להעתיק Google Maps URL נקי לתיעוד.
9. להוסיף סטטוס תכנון:
   - `Map only`
   - `Candidate for day`
   - `Calendar anchor`
   - `Conditional`
   - `Rejected as default`

## 8. איך לזהות קטגוריה אוטומטית

### אוכל ❤️
```text
restaurant, trattoria, osteria, cafe, caffè, bakery, gelato, bar, bistro, market, hütte, rifugio, alm, lunch, dinner
```

### בשר 🥩
```text
steak, grill, burger, bbq, smoke, smoked, meat, macelleria, salumificio, steakhouse
```

### תצפית 👁
```text
viewpoint, lookout, mirador, panorama, pass, skywalk, belvedere, tower, church viewpoint, sunset, terrace
```

### טבע 🏔
```text
lago, lake, alm, valley, val, pass, waterfall, gorge, cave, trail, hut, rifugio, dolomites, meadow, marmolada, pordoi
```

### לוגיסטיקה 🧭
```text
airport, hostel, hotel, parking, station, terminal, lockers, rental car, cable car station, passo, road, toll road
```

## 9. מקומות חובה לסימון במפה — ונציה

```text
[A][🧭] Hostel One — לינה מחוץ לוונציה, להשתמש במקום שכבר מסומן במפה.
[A][👁] Piazza San Marco / San Marco Square — עוגן רומנטי.
[A][🎟👁] Murano — 2 שעות באי עצמו + זמן שיט.
[A][🎟] La Bauta — החנות הראשית לקניית מסכה; 4.8/5 מתוך 334 ביקורות Google, עבודת יד ודגמים פשוטים סביב €15–€25 לפי הקטלוג הרשמי.
[B][🎟] Ca’ Macana Original — גיבוי בדורסודורו; 4.7/5 מתוך 913 ביקורות, עבודת יד ומבחר רחב.
[B][🎟] Kartaruga Atelier — גיבוי ליד San Marco/Castello; 4.7/5 מתוך 124 ביקורות ודגמים ייחודיים. לבדוק שעות סמוך לביקור.
[B][👁❤️] Romantic wandering spots in Venice — 4 שעות שיטוט בין המקומות שכבר מסומנים.
[A][🧭] Rental car pickup point — נקודת איסוף רכב אחרי סיום ונציה בלבד.
```

## 10. מקומות חובה/מומלצים לסימון במפה — דולומיטים מזרחיים

### A — לסמן ולכוון לתכנון

```text
[A][🧭❤️] Cortina d’Ampezzo — בסיס מזרחי/עיירה/אוכל.
[A/B][🏔👁] Lago di Pieve di Cadore — עצירת דרך מוונציה לקורטינה, לא עוגן יום.
[A][🏔👁🧭] Tre Cime di Lavaredo / Drei Zinnen / שלושת השיניים — עוגן חובה. לסמן מסלול/נקודת התחלה Rifugio Auronzo, חניה/כביש אגרה, נקודת תצפית Locatelli/Lavaredo, ונקודת קניית סנדוויצ׳ים לפני העלייה. לתכנן הגעה 07:30–08:00 כדי לא להיתקע בפקק/תור ארוך; מסלול כ־10 ק״מ / 4–5 שעות; לא להסתמך על Rifugi לאוכל.
[A][🧭🏔] Rifugio Auronzo — חניה/כביש אגרה/נקודת התחלה ל־Tre Cime; יעד הגעה 07:30–08:00. לסמן גם חניה/שער/נקודת כניסה לכביש אם מופיעה ב־Maps.
[A/B][❤️👁🏔] Rifugio Locatelli / Drei Zinnen Hütte — יעד תצפית/צהריים במסלול יום; לא לינה כברירת מחדל.
[A][🏔👁🎟🧭] Lago di Braies / Pragser Wildsee — לתכנן ולסמן במפה: האגם, חניה קרובה, ונקודת סירות. להגיע מוקדם בבוקר. סירה 2 שעות לפי מחיר עבודה 50€. לולאה סביב האגם מתוכננת לשעתיים. סך בלוק 4–5 שעות. לבדוק סמוך לטיול מחיר/זמינות סירות, חניה והגבלות גישה.
[A/B][🏔👁🎟] Cinque Torri — תצפית, רכבל/גישה, WWI open-air museum, בקתות.
[A/B][❤️👁🏔] Rifugio Scoiattoli — צהריים/קפה ביום Cinque Torri.
[A/B][❤️👁🏔] Rifugio Averau — תוספת טובה ליום Cinque Torri/Passo Giau אם פתוח.
[A/B][👁🏔] Passo Giau — עצירת נוף/שקיעה/מעבר.
```

### B — לסמן ולשלב אם מתאים לאזור

```text
[B][🏔👁] Lago di Misurina — עצירת אגם ליד Tre Cime.
[B][🏔👁❤️] Prato Piazza / Plätzwiese — חלופה רגועה יחסית לבראייס/טרי צ׳ימה.
[B][👁🏔🧭] Passo Falzarego — מעבר נופי/דרך בין Cortina ו־Val Gardena.
[B][🎟👁❤️] Lagazuoi / Rifugio Lagazuoi — רכבל, תצפית, אוכל; לא מסלול מלחמה קשה בלי החלטה.
[B][🏔👁] Lago Federa / Rifugio Croda da Lago — מועמד טוב רק ליום Cortina פנוי.
```

## 11. מקומות חובה/מומלצים לסימון במפה — דולומיטים מערביים

### A — לסמן ולכוון לתכנון

```text
[A][🧭❤️] Ortisei / Val Gardena — בסיס מערבי/עיירה/אוכל.
[A][🏔👁] Seceda — רכבל, תצפית, מסלול קצר רשמי, לא יום קשה.
[A/B][❤️🏔👁] Baita Sofie Hütte — אוכל/קפה ביום Seceda אם פתוח ומתאים.
[A][🏔👁] Alpe di Siusi / Seiser Alm — אחו אלפיני, הליכה קלה/e-bike, גישה ברכבל/תחבורה.
[A][🏔👁] Val di Funes / Villnöß — לסמן גם כעמק עצמאי, לא רק כנסיות.
[A/B][👁] San Giovanni Church — נקודת צילום.
[A/B][👁] Santa Maddalena Church — נקודת צילום/שקיעה.
```

### B — לסמן ולשלב אם מתאים לאזור

```text
[B][❤️🏔👁] Geisler Alm / Rifugio delle Odle — רק אם עושים מסלול מרכזי ולא עוד יום עמוס.
[B][🎟👁] Resciesa / Rasciesa — פוניקולר מ־Ortisei, יום קל־בינוני.
[B][👁🏔🧭] Passo Sella — כביש נוף/עצירת צילום/יום מעבר.
[B][👁🏔🧭] Passo Pordoi — כביש נוף/יום מעבר.
[B][🎟👁] Sass Pordoi — “Terrace” נופית ברכבל, רק אם פתוח ומזג האוויר טוב.
[B][🏔👁] Lago di Carezza — עצירה קלה ביום מעבר/חזרה.
[B][🏔👁] Lago Fedaia / Marmolada viewpoint — נוף חזק, לשלב רק אם לא עמוס.
[B/Conditional][🏔👁] Viel dal Pan — מסלול פנורמי טוב אך יום הליכה אמיתי; לא אחרי יום קשה.
[B][🧭❤️] Canazei — נקודת דרך/אוכל/לינה חלופית, לא בסיס ברירת מחדל.
```

## 12. מקומות חזרה/לילה אחרון

```text
[B][🧭❤️] Mestre / Venice mainland — לילה אחרון נוח לשדה.
[B][🧭❤️👁] Conegliano — אופציית לילה/עצירה בדרך חזרה, אם רוצים אווירת עיירה/יין ולא ונציה עמוסה.
[A][🧭] Venice Marco Polo Airport / VCE — החזרת רכב וטיסה, לא לסמן כלב.
```

## 13. Conditional / Reject-default — לסמן בזהירות, לא להכניס אוטומטית ליומן

```text
[Conditional][👁] Cadini di Misurina viewpoint — רק אם אין רוח/גשם ויש נוחות עם חשיפה.
[Conditional][🏔] Lago di Sorapis — יום מסלול חזק, שבילים צרים/כבלים; לא ברירת מחדל.
[Conditional][🏔❤️] Lago Federa / Rifugio Croda da Lago — יום Cortina פנוי, לא עם Tre Cime/Sorapis.
[Conditional][🏔👁] Sassolungo / Sassopiatto full loop — מסלול מלא; להעדיף עצירת Passo Sella או גרסה קצרה.
[Reject-default][🏔] Rifugio Puez overnight / Seceda→Puez→Val Lunga — לא מתאים כברירת מחדל.
[Reject-default][🏔] Rifugio Pian di Cengia overnight — לא מתאים כברירת מחדל.
[Reject-default][🏔] Rifugio Biella from Lago di Braies — לא לשלב עם Braies ביום רגיל.
[Conditional][❤️] Krapfen place from video — לזהות קודם שם מדויק.
```

## 14. עבודה עם מקומות שכבר מסומנים במפה
אם המשתמש אומר “כבר מסומן במפה”:

1. לפתוח Saved Places.
2. לחפש לפי שם/אזור.
3. לוודא התאמה לפי תמונות/כתובת.
4. לא ליצור כפילות.
5. להוסיף לתכנון אם הוא מתאים ליום.
6. אם יש כמה תוצאות דומות, לבחור לפי סימון קיים/מיקום במסלול; לשאול רק אם לא ניתן להכריע.

## 15. מתי מקום עובר ממפה ליומן
מקום עובר ל־Google Calendar רק אם מתקיימים התנאים הבאים:

- הוא נמצא באזור הלינה/יום הנסיעה.
- זמן ההגעה והשהייה הגיוניים.
- הקושי מתאים או נבחר במפורש כ־Conditional.
- יש מידע על חניה/רכבל/שעות אם נדרש.
- יש אוכל או fallback סביבו.
- יש קישור Google Maps ישיר.

מקום שנראה טוב אבל לא מתאים ליום נשאר במפה בלבד.
המעבר עצמו, כולל preview, יצירה ועדכון, מתבצע רק לאחר קריאת
`calendar-policy.md` ובהתאם לחוזה ה־Calendar API והאימות שמוגדר בו.

## 16. סיכום אחרי סבב סימון
להוציא סיכום פעולות, לא Q&A:

```text
נוספו/אומתו במפה:
- [A/❤️/👁] שם — למה חשוב
- [B/🏔] שם — איפה משתלב

נשארו כ־Conditional:
- שם — ייכנס רק אם מזג אוויר/אנרגיה/רצון למסלול מתאים

Rejected as default:
- שם — למה לא מתאים כברירת מחדל
```

## 17. איסורים

- לא לסמן כתובות בית או מקומות אישיים כיעדי טיול.
- לא לסמן לינה/חניה/שדה כלב; הם 🧭.
- לא להכניס ל־Calendar מקום Conditional לפני בדיקת התאמה ליום.
- לא למחוק מקומות שמורים בלי אישור מפורש.
- לא להשאיר רשימת שאלות פתוחות במקום החלטת פעולה.
