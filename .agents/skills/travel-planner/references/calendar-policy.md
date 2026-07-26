---
project: Dolomites 2026 Travel Agent for Lena
source_file: vacation_planning_guidelines_dolomites_2026.md
language: he
version: Codex split v6 — Venice 1.5 days, rental car, Braies + Tre Cime early morning Plan A
role: google calendar workflow
---

# CODEX 03 — הנחיות עבודה עם Google Calendar

## 1. מטרת הקובץ
הקובץ הזה מגדיר איך סוכן Codex צריך לעבוד עם Google Calendar עבור טיול Venice + Dolomites 2026: יצירה, עדכון, מחיקה, פורמט אירועים, תיאור חובה, ושימוש נכון ביומן **חו״ל**.

## 2. Calendar ID
לעבוד מול יומן Google Calendar בשם **חו״ל** לפי ה־ID הבא:

```text
00da743e003f133d4e2a97203388349337c0584d04ef6bb372d0d6080877f18d@group.calendar.google.com
```

אין ליצור אירועים ביומן אחר אלא אם המשתמש מבקש במפורש.

## 3. טיסות קיימות — לא לערוך בלי אישור

```text
09.09.2026 18:00–21:50 — טיסה LY 289 מ־TLV אל VCE
25.09.2026 13:05–16:25 — טיסה LY 290 מ־VCE אל TLV
```

לא להכניס מספר אישור טיסה לקבצי ההנחיות. אם הוא כבר נמצא באירוע פרטי ביומן — לא לגעת בו.

## 4. סדר מסלול ברירת מחדל אחרי בדיקת Gemini
ברירת המחדל המעודכנת היא East-first:

```text
09.09 — נחיתה VCE + Hostel One.
10.09 — Venice romantic full day.
11.09 — חצי ונציה רגוע אם מסתדר / איסוף רכב שכור רק אחרי סיום ונציה / נסיעה ל־Cortina area.
12–16.09 — בסיס מזרחי: Cortina / Misurina / Dobbiaco.
17.09 — מעבר נופי מזרח→מערב דרך מעברי הרים, עם 1–2 עצירות בלבד.
18–23.09 — בסיס מערבי: Val Gardena / Ortisei.
24.09 — חזרה ל־Mestre / Conegliano / Venice area / VCE.
25.09 — טיסה חזרה.
```

לא ליצור ביום 09.09 נסיעה ארוכה לקורטינה. לא ליצור בבוקר 25.09 פעילות שאינה לוגיסטית.

## 5. תבנית תיאור חובה לכל אירוע
כל אירוע שאינו טיסה חייב לכלול תיאור מובנה. אין ליצור אירוע ריק.

### פורמט טכני — Apple Calendar

שדה `description` נכתב תמיד כ־**טקסט פשוט (plain text) התואם ל־Apple Calendar**.

- אסור להשתמש בתגיות HTML, כולל `<br>`, `<p>`, `<div>`, `<b>`, `<strong>`, `<ul>`, `<li>` או `<a>`.
- אסור להשתמש בעיצוב Markdown כגון `**מודגש**`, כותרות `#` או קישורים מהצורה `[טקסט](https://example.com)`.
- ריווח ופסקאות נוצרים באמצעות מעברי שורה אמיתיים; אין לכתוב `<br>` או את התווים המילוליים `\n`.
- רשימות נכתבות עם `- ` בתחילת כל שורה.
- קישור לחיץ נכתב ככתובת מלאה וגלויה, רצוי בשורה נפרדת: `https://example.com/path`.
- מספר טלפון נכתב כמספר גלוי, רצוי בפורמט בינלאומי ובשורה נפרדת: `+39 0123 456789`. אפשר להוסיף תווית טקסט לפניו.
- אין להסתיר URL או מספר טלפון מאחורי טקסט קישור.
- לפני preview או כתיבה יש לוודא שלא נשארו בתיאור תגיות או ישויות HTML.

דוגמה:

```text
Google Maps:
https://maps.google.com/...

טלפון:
+39 0123 456789

מה לראות / לעשות:
- להגיע מוקדם.
- לבדוק חניה יום קודם.
```

```text
Google Maps:
[קישור ישיר למיקום בגוגל מפות]

מה זה המקום:
[תיאור קצר של המקום בשפה פשוטה]

מה לראות / לעשות:
- [דבר 1]
- [דבר 2]
- [דבר 3 אם רלוונטי]

למה זה מתאים לטיול שלנו:
[המלצה מתוך מחקר אינטרנט / סיבה תכנונית: נוף, רומנטי, קל־בינוני, מתאים ליום מעבר, אוכל טוב, וכו׳]

לוגיסטיקה:
- הגעה מ: [מקום קודם]
- זמן נסיעה משוער: [אם ידוע]
- חניה / רכבל / כרטיס: [מה צריך לבדוק או להזמין]
- משך ביקור מתוכנן: [משך]
- רמת קושי: [קל / קל־בינוני / בינוני / Conditional]

אוכל:
[איפה אוכלים / האם צריך גיבוי]

Fallback:
[מה עושים אם מזג האוויר רע / אין כוח / המקום סגור]
```

## 6. כותרות אירועים — פורמט אחיד

### לינה
```text
Check-in — Hostel One / Venice area
Check-out — Hostel One / Venice area
Check-in — Cortina area base
Check-in — Ortisei / Val Gardena base
Last night near VCE — Mestre/Conegliano/Venice area
```

### נסיעות
```text
Pick up rental car — Venice area / VCE / Mestre
Drive — Venice area → Cortina area
Scenic transfer — Cortina → Val Gardena via passes
Drive — Val Gardena → Venice area / VCE
Return car — Venice Marco Polo Airport
```

### טבע / תצפית
```text
Tre Cime — early morning 10 km loop from Rifugio Auronzo
Lago di Braies — early morning boat + lake loop
Cinque Torri — towers + WWI open-air museum + rifugio
Seceda — viewpoint + short hike + hut
Alpe di Siusi — easy alpine meadow day
Val di Funes — churches + valley viewpoints
```

### אוכל
```text
Lunch — Baita Sofie Hütte
Lunch — Rifugio Scoiattoli / Rifugio Averau
Coffee / cake — [place]
Dinner — [restaurant]
```

### בחירה בזמן אמת
```text
Choice block — route or spa depending on weather
Weather fallback — town/spa/cafe
```

## 7. ונציה — אירועים שחייבים להיכנס

### 09.09.2026
- טיסה קיימת — לא לערוך.
- אירוע הגעה ללינה: Hostel One.
- אוכל קל ליד הלינה רק אם רלוונטי.

### 10.09.2026
אירועים מומלצים:

1. שיטוט בוקר רומנטי / קפה.
2. **Piazza San Marco / San Marco Square**.
3. **La Bauta — קניית מסכה**; Ca’ Macana Original ו־Kartaruga נשארות כגיבויי Map only.
4. **Murano — 2 שעות באי עצמו**.
5. בלוק שיטוט חופשי של כ־4 שעות בין מקומות שכבר שמורים במפה.
6. ערב רומנטי / אוכל קרוב למסלול.

### 11.09.2026
- חצי יום ונציה אם מתאים, כדי להשלים יום וחצי רומנטיים בעיר.
- איסוף רכב שכור רק אחרי שסיימנו את ונציה.
- ליצור אירוע נפרד: Pick up rental car — Venice area / VCE / Mestre.
- ליצור לאחר מכן נסיעה לכיוון Cortina area כברירת מחדל.
- עצירה אחת בדרך בלבד: **Pieve di Cadore / Lago di Pieve di Cadore** אם מסתדר.
- צ׳ק־אין באזור Cortina / Misurina / Dobbiaco.

## 8. דולומיטים — אירועי עוגן לתכנון ראשוני
ליצור אירועים רק אחרי בדיקת תאריך/שעות/מזג אוויר/חניה. אלה לא שאלות למשתמש, אלא משימות ביצוע של הסוכן.

### בסיס מזרחי: Cortina / Misurina / Dobbiaco

- **Cortina d’Ampezzo** — בסיס/עיירה/אוכל.
- **Lago di Pieve di Cadore** — עצירת דרך ביום Venice→Cortina.
- **Tre Cime / Drei Zinnen / שלושת השיניים** — ליצור כאירוע Plan A מוקדם מאוד: יציאה כך שב־07:30–08:00 כבר נמצאים ב־Rifugio Auronzo/נקודת התחלה. לתאר מסלול מעגלי של כ־10 ק״מ / 4–5 שעות הליכה. להכניס בתיאור אזהרה לא להסתמך על Rifugi לאוכל; להביא סנדוויצ׳ים/מים/נשנושים או לקנות בדרך לפני העלייה. Locatelli/Lavaredo הם נקודות תצפית/עצירה, לא לינה ולא מקור אוכל מובטח.
- **Lago di Braies / Pragser Wildsee** — ליצור כאירוע Plan A מפורט של 4–5 שעות: להגיע מוקדם בבוקר, חניה קרובה ומוזמנת, סירת עץ משותפת לכ־45 דקות לפי מחיר 2026 מאומת של 20€, מסלול מעגלי סביב האגם, תמונות וקפה/נשנוש. לציין שחובה לבדוק סמוך לטיול זמינות סירות, חניה והגבלות גישה.
- **Lago di Misurina** — עצירה קלה ליד Tre Cime.
- **Prato Piazza** — חלופה רגועה יחסית או יום גשם חלקי.
- **Cinque Torri** — תצפית + WWI open-air museum + בקתה.
- **Rifugio Scoiattoli / Rifugio Averau** — צהריים/קפה ביום Cinque Torri.
- **Passo Giau** — עצירת נוף/שקיעה/מעבר.
- **Lagazuoi** — רכבל/תצפית/רפיוג׳יו אם פתוח.

### יום מעבר מזרח→מערב

לבנות יום מעבר עם 1–2 עצירות בלבד מתוך:

- **Passo Falzarego**.
- **Passo Giau**.
- **Passo Pordoi / Sass Pordoi** — רק אם מזג האוויר והרכבל מתאימים.
- **Passo Sella**.
- **Canazei** — קפה/אוכל/עצירת דרך.

לא להכניס באותו יום גם מסלול הליכה מלא וגם 3 מעברי הרים.

### בסיס מערבי: Val Gardena / Ortisei

- **Ortisei / Val Gardena** — בסיס לינה/שיטוט/אוכל.
- **Seceda** — גרסה קל־בינוני: רכבל + תצפית + הליכה קצרה + בקתה.
- **Baita Sofie Hütte / Odles Hut** — צהריים/קפה אם פתוח.
- **Alpe di Siusi** — יום אחו אלפיני, הליכה קלה/e-bike/רכבל.
- **Val di Funes** — San Giovanni + Santa Maddalena; Geisler Alm רק אם רוצים מסלול מרכזי.
- **Resciesa / Rasciesa** — יום קל־בינוני/התאוששות באזור Ortisei.
- **Lago di Carezza** — עצירת חזרה או יום מעבר.
- **Lago Fedaia / Viel dal Pan** — Plan B/Conditional, רק אם רוצים יום פנורמי ארוך יותר.

### חזרה ל־VCE

- **24.09.2026** — לחזור לכיוון Venice area / Mestre / Conegliano / VCE. לא להשאיר נסיעה ארוכה לבוקר הטיסה.
- **25.09.2026** — החזרת רכב, שדה, אוכל קל, טיסה.

## 9. Conditional / Reject-default — לא ליצור ביומן כברירת מחדל

לא ליצור אירועים כברירת מחדל עבור:

- **Cadini di Misurina viewpoint** — רק אם רוצים נקודת צילום חשופה ומזג האוויר טוב.
- **Lago di Sorapis** — יום מסלול חזק, לא ברירת מחדל.
- **Lago Federa** — יום Cortina פנוי, לא לשלב עם Tre Cime/Sorapis.
- **Sassolungo / Sassopiatto full loop** — רק אם נבחר יום הליכה מלא.
- **Rifugio Locatelli overnight** — לא ברירת מחדל; Locatelli יכול להופיע כיעד יום בלבד.
- **Rifugio Pian di Cengia overnight** — לא ברירת מחדל.
- **Rifugio Puez overnight / Puez traverse** — לא ברירת מחדל.
- **Rifugio Biella from Braies** — לא לשלב ביום Braies רגיל.
- **Marmolada / Viel dal Pan** — רק אם מזג האוויר טוב ורוצים יום ארוך יותר.
- **Krapfen place** — רק אחרי זיהוי מקום מדויק.

## 10. יצירת אירוע — פרוטוקול
לפני יצירת אירוע:

1. לוודא שהוא לא קיים כבר ביומן.
2. לוודא מיקום ב־Google Maps.
3. לוודא שעה הגיונית מול נסיעות.
4. לבדוק אם המקום צריך רכבל/חניה/כרטיס.
5. להכניס תיאור לפי התבנית.
6. לוודא שהתיאור הוא plain text בלבד, ללא HTML או Markdown, ושהקישורים ומספרי הטלפון גלויים.
7. להוסיף fallback.
8. לא ליצור אירוע Conditional אם אין החלטה שמתאימה לאותו יום.

## 11. עדכון אירוע — פרוטוקול
כאשר מעדכנים אירוע:

1. לקרוא את האירוע הקיים.
2. לשמר מידע חשוב שכבר נמצא בתיאור.
3. להוסיף/לתקן Google Maps link אם חסר.
4. להוסיף “מה לראות / לעשות” אם חסר.
5. להוסיף המלצה מתוך מחקר אם חסרה.
6. לא למחוק פרטי לוגיסטיקה בלי סיבה.
7. להמיר תגיות HTML קיימות לטקסט פשוט תוך שמירת התוכן, הקישורים ומספרי הטלפון.
8. אם האירוע נהיה לא מתאים — לסמן כ־Optional או להחליף, לא למחוק בלי אישור.

## 12. מחיקת אירוע — פרוטוקול
למחוק אירוע רק אם:

- המשתמש ביקש במפורש.
- זה אירוע שנוצר בטעות.
- זה כפול ברור.

לא למחוק טיסות, לינה או אירועים עם מידע פרטי בלי אישור מפורש.

## 13. בניית יום ביומן
לכל יום ליצור מבנה הגיוני:

```text
07:30–08:30 בוקר/יציאה
09:00–12:30 עוגן טבע/עיר מרכזי
12:30–13:45 צהריים
14:00–16:30 עוגן קל/שיטוט/תצפית
17:00–18:30 חזרה/מנוחה/check-in
19:00–20:30 ערב
```

לא להכניס 3 מסלולים ביום אחד.

## 14. בחירות שנשארות פתוחות ביומן
מותר להשאיר placeholder רק לבחירות אמיתיות:

```text
בחירה לפי מזג אוויר: הרים / עיירה / ספא
בחירה לפי אנרגיה: עוד מסלול / יום מנוחה
```

לא להשאיר placeholder מסוג “צריך לבדוק מה זה המקום” אם אפשר לבדוק לבד.

## 15. פרטיות
לא להכניס לתיאור ציבורי:

- מספר אישור טיסה.
- קודי צ׳ק־אין.
- סיסמאות Wi‑Fi.
- כתובות בית.
- מספרי טלפון פרטיים.
- קישורי הזמנה פרטיים.

אם המשתמש מבקש להכניס פרט פרטי, לשים אותו רק באירוע הפרטי הרלוונטי, לא בקבצי ההנחיות.


## Template — Tre Cime early morning event

כותרת מומלצת:

```text
Tre Cime / Drei Zinnen — early 10 km loop
```

זמן מומלץ ביומן:

```text
07:30–13:00/13:30 — Tre Cime loop
```

כללי תיאור חובה לאירוע:

```text
Google Maps: [Rifugio Auronzo / Tre Cime start link]
Route: circular Tre Cime route, about 10 km, expected 4–5 hours walking at our pace.
Arrival rule: be at the parking/start point by 07:30–08:00 to avoid long entrance/parking queues.
Food: bring sandwiches, snacks and water, or buy them before the mountain road. Do not rely on Rifugi being open; huts may be closed or overcrowded.
What to see: classic Drei Zinnen / Tre Cime views, Lavaredo viewpoint, Locatelli/Dreizinnenhütte viewpoint if conditions and energy allow.
Fallback: if weather is bad or road/parking is not manageable, switch to Misurina / Cortina / Prato Piazza / spa day.
```
