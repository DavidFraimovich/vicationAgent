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

## Google Calendar

- `calendar_list_events`
- `calendar_preview_event`
- `calendar_apply_event`
- `calendar_delete_event`

פעולות Calendar פועלות רק מול ה־Calendar ID המוגדר ב־`config/travel-agent.yaml`. כתיבה ומחיקה דורשות `confirm: true` לפי מדיניות ברירת המחדל.

שדה תיאור האירוע הוא plain text התואם ל־Apple Calendar: ללא HTML או Markdown, עם מעברי שורה אמיתיים, קישורי `https://` מלאים וגלויים, ומספרי טלפון גלויים בפורמט בינלאומי. כלי ה־preview והכתיבה מנקים תגיות HTML לפני שליחת האירוע.
