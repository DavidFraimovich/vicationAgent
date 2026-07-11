import fs from "node:fs";
import path from "node:path";
import {
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

  for (const place of plan.places) upsertPlace(place);
  for (const item of plan.itinerary) upsertItineraryItem(item);
  for (const lodging of plan.lodgingCandidates) upsertLodging(lodging);

  return {
    tripId: String(trip.id),
    places: plan.places.length,
    itineraryItems: plan.itinerary.length,
    lodgingCandidates: plan.lodgingCandidates.length,
  };
}
