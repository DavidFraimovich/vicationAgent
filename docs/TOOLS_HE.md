# כלי MCP מקומיים

## מצב וטיולים

- `travel_health`
- `travel_list_trips`
- `travel_get_trip`
- `travel_upsert_trip`

## מקומות

- `travel_list_places`
- `travel_get_place`
- `travel_upsert_place`
- `travel_set_place_status`
- `travel_export_mymaps_csv`

## מסלול

- `travel_list_itinerary`
- `travel_upsert_itinerary_item`
- `travel_validate_trip`

## לינה

- `lodging_build_airbnb_search_url`
- `lodging_evaluate_candidate`
- `lodging_upsert_candidate`
- `lodging_list_candidates`

## יומן פעולות

- `travel_record_external_action`
- `travel_get_audit_log`

## Telegram Push

- `telegram_health` — בדיקת `getMe` ו־`getChat` קריאה־בלבד, ללא שליחת הודעה.
- `telegram_preview_push` — תצוגה מקדימה של הודעת טקסט.
- `telegram_send_push` — שליחה לקבוצה שמוגדרת ב־`TELEGRAM_CHAT_ID`.

יש לבצע preview לפני שליחה. הכלי `telegram_send_push` דורש `confirm: true`,
שולח רק ליעד הקבוע בקובץ `.env`, ושומר ביומן הפעולות רק מטא־דאטה כגון אורך
ההודעה ומזהה ההודעה — לא את הטוקן ולא את תוכן ההודעה. הודעות מוגבלות ל־4,096
תווים כולל הכותרת, בפורמט plain text.

משתמשים ב־Push עבור תשובה חדשה מספק/מארח, דדליין, סיכון מהותי במסלול,
השלמה או כשל של משימה מתוזמנת, או פעולה חיצונית שהמשתמש צריך לראות במהירות.
לא שולחים התקדמות שגרתית, כפילויות, לוגים גולמיים או מידע סודי.

### מתי השליחה חובה

- לאחר הצלחה או כשל של פעולה הקשורה להזמנה, אישור, ביטול, החזר, תשלום,
  כרטיס, השכרה, חניה, צ׳ק־אין/אאוט או הודעה לספק/מארח.
- לאחר קבלת אישור חדש או שינוי מהותי בתאריך, מחיר, תנאי החזר או סטטוס.
- בסיום כל הרצת Scheduler — גם כאשר לא נמצאו שינויים.

בכל הרצת Scheduler שולחים הודעה אחת בלבד עם אחד מהסטטוסים:
`completed`,‏ `no changes`,‏ `action required` או `failed`. הרשאת המשתמש
המתמשכת מאפשרת `confirm: true` עבור הודעות יידוע אלה בלי בקשת אישור נוספת,
אך אינה מאשרת את פעולת ההזמנה, התשלום, הביטול או המענה למארח עצמה.

חיפוש, preview או טיוטה ידניים אינם מחייבים Push, אלא אם הם תוצאת משימת
Scheduler. אין לכלול סודות, קוד אישור/הזמנה מלא, פרטי תשלום, לוגים גולמיים
או מידע אישי שאינו נחוץ.

## Google Calendar

- `calendar_list_events`
- `calendar_preview_event`
- `calendar_apply_event`
- `calendar_delete_event`

פעולות Calendar פועלות רק מול ה־Calendar ID המוגדר ב־`config/travel-agent.yaml`. כתיבה ומחיקה דורשות `confirm: true` לפי מדיניות ברירת המחדל.

שדה תיאור האירוע הוא plain text התואם ל־Apple Calendar: ללא HTML או Markdown, עם מעברי שורה אמיתיים, קישורי `https://` מלאים וגלויים, ומספרי טלפון גלויים בפורמט בינלאומי. כלי ה־preview והכתיבה מנקים תגיות HTML לפני שליחת האירוע.

לינות Airbnb מנוהלות קודם כול מתוך מיילי האישור שמגיעים אל
`david04031997@gmail.com`. אירוע שנוצר אוטומטית מהמייל או מהספק מועדף על
אירוע יזום. ה־preview המקומי משמיט אירועי לינה, וכתיבה ידנית שלהם נעצרת אלא
אם המשתמש ביקש אותה במפורש לאחר בדיקת כפילות במייל וביומן.
