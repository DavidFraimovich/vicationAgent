import { getTrip, listItinerary, listPlaces, type JsonObject } from "./db.js";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  entityId?: string;
};

function minutes(time?: unknown): number | undefined {
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function validateTrip(tripId: string): {
  tripId: string;
  ok: boolean;
  issues: ValidationIssue[];
  summary: JsonObject;
} {
  const trip = getTrip(tripId);
  if (!trip) throw new Error(`Trip not found: ${tripId}`);

  const places = listPlaces({ tripId, limit: 100000 });
  const items = listItinerary(tripId);
  const issues: ValidationIssue[] = [];

  for (const place of places) {
    if (!place.googleMapsUrl && !place.googlePlaceId) {
      issues.push({
        severity: "warning",
        code: "PLACE_UNRESOLVED",
        message: `Place lacks a Google Maps URL or Place ID: ${place.name}`,
        entityId: place.id as string,
      });
    }
    if ((place.planningStatus === "calendar_anchor" || place.planningStatus === "scheduled")
      && !place.latitude && !place.googleMapsUrl) {
      issues.push({
        severity: "error",
        code: "ANCHOR_WITHOUT_LOCATION",
        message: `Calendar anchor has no usable location: ${place.name}`,
        entityId: place.id as string,
      });
    }
  }

  const byDay = new Map<string, JsonObject[]>();
  for (const item of items) {
    const list = byDay.get(item.dayDate as string) ?? [];
    list.push(item);
    byDay.set(item.dayDate as string, list);

    if (!item.description && item.itemType !== "flight") {
      issues.push({
        severity: "warning",
        code: "EMPTY_DESCRIPTION",
        message: `Itinerary item has no description: ${item.title}`,
        entityId: item.id as string,
      });
    }
  }

  for (const [day, dayItems] of byDay.entries()) {
    const walkingAnchors = dayItems.filter((item) =>
      ["nature", "hike", "mountain"].includes(String(item.itemType))
    );
    if (walkingAnchors.length > 2) {
      issues.push({
        severity: "warning",
        code: "OVERLOADED_NATURE_DAY",
        message: `${day} has ${walkingAnchors.length} nature/hike anchors.`,
      });
    }

    const lunch = dayItems.find((item) =>
      String(item.title).toLowerCase().includes("lunch") ||
      String(item.itemType).toLowerCase() === "lunch"
    );
    if (lunch) {
      const start = minutes(lunch.startTime);
      if (start !== undefined && (start < 12 * 60 || start > 14 * 60 + 30)) {
        issues.push({
          severity: "warning",
          code: "LUNCH_OUTSIDE_WINDOW",
          message: `${day} lunch begins at ${lunch.startTime}, outside 12:00–14:30.`,
          entityId: lunch.id as string,
        });
      }
    }
  }

  return {
    tripId,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    summary: {
      places: places.length,
      unresolvedPlaces: issues.filter((issue) => issue.code === "PLACE_UNRESOLVED").length,
      itineraryItems: items.length,
      daysPlanned: byDay.size,
    },
  };
}
