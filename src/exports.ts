import fs from "node:fs";
import path from "node:path";
import { exportDirectory } from "./config.js";
import { listPlaces } from "./db.js";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportMyMapsCsv(tripId: string, outputFile?: string): {
  file: string;
  count: number;
} {
  const places = listPlaces({ tripId, limit: 100000 });
  const rows = [
    [
      "name", "latitude", "longitude", "address", "category",
      "priority", "planning_status", "google_maps_url", "notes",
    ].map(csvCell).join(","),
    ...places.map((place) => [
      place.name,
      place.latitude,
      place.longitude,
      place.address,
      place.categories,
      place.priority,
      place.planningStatus,
      place.googleMapsUrl,
      place.notes,
    ].map(csvCell).join(",")),
  ];
  const file = outputFile
    ? path.resolve(outputFile)
    : path.join(exportDirectory(), `${tripId}-mymaps.csv`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${rows.join("\n")}\n`, "utf8");
  return { file, count: places.length };
}

export function buildAirbnbSearchUrl(input: {
  location: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
}): string {
  const slug = encodeURIComponent(input.location.trim()).replaceAll("%20", "-");
  const params = new URLSearchParams({
    checkin: input.checkIn,
    checkout: input.checkOut,
    adults: String(input.adults ?? 2),
  });
  params.append("refinement_paths[]", "/homes");
  return `https://www.airbnb.com/s/${slug}/homes?${params.toString()}`;
}
