import fs from "node:fs";
import path from "node:path";
import { exportDirectory, loadConfig } from "./config.js";
import {
  getPlace,
  getTrip,
  listItinerary,
  recordAction,
  type JsonObject,
} from "./db.js";
import { isProviderManagedLodgingItem } from "./calendar-policy.js";
import { previewCalendarEvent, type CalendarEventInput } from "./google-calendar.js";

function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function duration(start?: unknown, end?: unknown): string {
  if (typeof start !== "string" || typeof end !== "string") return "לפי הצורך";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const value = (eh! * 60 + em!) - (sh! * 60 + sm!);
  if (value <= 0) return "לפי הצורך";
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${hours ? `${hours} ש׳` : ""}${hours && mins ? " " : ""}${mins ? `${mins} דק׳` : ""}`;
}

function calendarDescription(item: JsonObject, place?: JsonObject): string {
  const metadata = (item.metadata ?? {}) as JsonObject;
  const mapUrl = String(place?.googleMapsUrl ?? mapsSearch(String(place?.name ?? item.title)));
  const placeNote = typeof place?.notes === "string" ? place.notes : undefined;
  const fallback = typeof metadata.fallback === "string"
    ? metadata.fallback
    : "לקצר, לדחות ליום הגיבוי או לבחור עיירה/קפה קרובים לפי מזג האוויר והאנרגיה.";
  const reservation = typeof metadata.reservation === "string"
    ? metadata.reservation
    : "לבדוק יום קודם אם נדרשת הזמנה, חניה או כרטיס.";

  return [
    "Google Maps:",
    mapUrl,
    "",
    "מה זה המקום:",
    String(item.description ?? item.title),
    "",
    "מה לראות / לעשות:",
    `- לבצע את בלוק ${item.title} בקצב רגוע.`,
    placeNote ? `- לשים לב: ${placeNote}` : "- לבדוק תנאים בפועל לפני היציאה.",
    "",
    "למה זה מתאים לטיול שלנו:",
    "חלק מ־Plan A המאוזן בין עוגן מרכזי, אוכל ומנוחה; ניתן לקצר לפי מזג האוויר והאנרגיה.",
    "",
    "לוגיסטיקה:",
    `- שעה מתוכננת: ${item.startTime ?? "גמיש"}–${item.endTime ?? "גמיש"}.`,
    `- משך ביקור מתוכנן: ${duration(item.startTime, item.endTime)}.`,
    `- חניה / רכבל / כרטיס: ${reservation}`,
    `- רמת קושי: ${["hike", "mountain", "nature", "walk"].includes(String(item.itemType)) ? "קל־בינוני עד בינוני" : "קל / לוגיסטי"}.`,
    "",
    "אוכל:",
    item.itemType === "lunch"
      ? "זהו עוגן הצהריים; לבחור מקום זמין קרוב למסלול ולשמור נשנוש גיבוי."
      : "לשאת מים ונשנוש; עוגן הצהריים מופיע כאירוע נפרד ביום.",
    "",
    "Fallback:",
    fallback,
  ].join("\n");
}

export function buildCalendarPreview(tripId: string, outputFile?: string): {
  file: string;
  count: number;
  excludedProtectedFlights: number;
  excludedDraftItems: number;
  excludedProviderManagedLodging: number;
} {
  const trip = getTrip(tripId);
  if (!trip) throw new Error(`Trip not found: ${tripId}`);
  const timezone = String(trip.timezone ?? loadConfig().calendar.trip_timezone);
  const allItems = listItinerary(tripId);
  const protectedItems = allItems.filter((item) =>
    item.itemType === "flight" || (item.metadata as JsonObject | undefined)?.calendarSync === false
  );
  const draftItems = allItems.filter((item) => item.status === "draft");
  const providerManagedLodging = allItems.filter(isProviderManagedLodgingItem);
  const excludedIds = new Set(
    [...protectedItems, ...draftItems, ...providerManagedLodging].map((item) => item.id),
  );
  const items = allItems.filter((item) => !excludedIds.has(item.id));

  const events = items.map((item) => {
    if (!item.startTime || !item.endTime) {
      throw new Error(`Calendar item requires start and end times: ${item.id}`);
    }
    const place = item.placeId ? getPlace(String(item.placeId), tripId) : undefined;
    const input: CalendarEventInput = {
      summary: String(item.title),
      start: `${item.dayDate}T${item.startTime}:00`,
      end: `${item.dayDate}T${item.endTime}:00`,
      timezone,
      description: calendarDescription(item, place),
      location: String(place?.address ?? place?.name ?? item.title),
      itineraryItemId: String(item.id),
      eventId: typeof item.calendarEventId === "string" ? item.calendarEventId : undefined,
    };
    return previewCalendarEvent(input);
  });

  const output = {
    generatedAt: new Date().toISOString(),
    tripId,
    calendarName: loadConfig().calendar.calendar_name,
    timezone,
    dryRun: true,
    protectedFlights: {
      excluded: protectedItems.length,
      policy: "Existing flight events are protected and are not recreated or modified.",
    },
    unresolvedDrafts: {
      excluded: draftItems.length,
      items: draftItems.map((item) => ({ id: item.id, title: item.title })),
      policy: "Draft items without a verified exact place are not published.",
    },
    providerManagedLodging: {
      excluded: providerManagedLodging.length,
      items: providerManagedLodging.map((item) => ({ id: item.id, title: item.title })),
      policy:
        "Airbnb lodging is kept locally but not proactively published. Prefer the event created from the confirmation email and deduplicate before any explicitly requested manual write.",
    },
    events,
  };
  const file = outputFile
    ? path.resolve(outputFile)
    : path.join(exportDirectory(), `${tripId}-calendar-preview.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  recordAction({
    tripId,
    provider: "google_calendar",
    action: "build_trip_preview",
    entityType: "trip",
    entityId: tripId,
    status: "preview",
    dryRun: true,
    payload: {
      file,
      eventCount: events.length,
      excludedProtectedFlights: protectedItems.length,
      excludedDraftItems: draftItems.length,
      excludedProviderManagedLodging: providerManagedLodging.length,
    },
  });
  return {
    file,
    count: events.length,
    excludedProtectedFlights: protectedItems.length,
    excludedDraftItems: draftItems.length,
    excludedProviderManagedLodging: providerManagedLodging.length,
  };
}
