import fs from "node:fs";
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
import { defaultTripId, readTripManifest, tripPath } from "./trips.js";

type PlanFile = {
  trip: Parameters<typeof upsertTrip>[0];
  places: PlaceInput[];
  itinerary: ItineraryInput[];
  lodgingCandidates: LodgingInput[];
};

export function seedTripPlan(
  planFile?: string,
  tripId = defaultTripId(),
): { tripId: string; places: number; itineraryItems: number; lodgingCandidates: number } {
  if (readTripManifest(tripId).status === "completed") throw new Error("Refusing to reseed a completed trip archive.");
  const plan = JSON.parse(fs.readFileSync(planFile ?? tripPath(tripId, "plan.json"), "utf8")) as PlanFile;
  if (plan.trip.id !== tripId || [...plan.places, ...plan.itinerary, ...plan.lodgingCandidates].some((entry) => entry.tripId !== tripId)) {
    throw new Error("Plan entities must all belong to the selected trip.");
  }
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
    if (!planItineraryIds.has(String(existing.id))) deleteItineraryItem(String(existing.id), tripId);
  }
  for (const lodging of plan.lodgingCandidates) upsertLodging(lodging);

  return {
    tripId: String(trip.id),
    places: plan.places.length,
    itineraryItems: plan.itinerary.length,
    lodgingCandidates: plan.lodgingCandidates.length,
  };
}
