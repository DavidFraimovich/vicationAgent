import fs from "node:fs";
import path from "node:path";
import {
  deleteItineraryItem,
  listItinerary,
  upsertItineraryItem,
  upsertLodging,
  upsertPlace,
  upsertTrip,
  type ItineraryInput,
  type LodgingInput,
  type PlaceInput,
} from "./db.js";
import { projectRoot } from "./paths.js";

type PlanFile = {
  trip: Parameters<typeof upsertTrip>[0];
  places: PlaceInput[];
  itinerary: ItineraryInput[];
  lodgingCandidates: LodgingInput[];
};

export function seedTripPlan(
  planFile = path.join(projectRoot, "data", "trips", "dolomites-2026", "plan.json"),
): { tripId: string; places: number; itineraryItems: number; lodgingCandidates: number } {
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8")) as PlanFile;
  const trip = upsertTrip(plan.trip);
  const existingItinerary = new Map(
    listItinerary(String(trip.id)).map((item) => [String(item.id), item]),
  );
  const planItineraryIds = new Set(plan.itinerary.map((item) => String(item.id)));

  for (const place of plan.places) upsertPlace(place);
  for (const item of plan.itinerary) {
    const existing = item.id ? existingItinerary.get(String(item.id)) : undefined;
    const calendarEventId = item.calendarEventId
      ?? (typeof existing?.calendarEventId === "string" ? existing.calendarEventId : undefined);
    upsertItineraryItem({ ...item, calendarEventId });
  }
  for (const existing of existingItinerary.values()) {
    if (!planItineraryIds.has(String(existing.id))) deleteItineraryItem(String(existing.id));
  }
  for (const lodging of plan.lodgingCandidates) upsertLodging(lodging);

  return {
    tripId: String(trip.id),
    places: plan.places.length,
    itineraryItems: plan.itinerary.length,
    lodgingCandidates: plan.lodgingCandidates.length,
  };
}
