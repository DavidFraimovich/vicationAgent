import fs from "node:fs";
import path from "node:path";
import { backupDirectory, loadConfig } from "./config.js";
import {
  copyDatabase,
  getDb,
  listPlaces,
  listTrips,
  upsertTrip,
} from "./db.js";
import { exportMyMapsCsv } from "./exports.js";
import { importReviews, importSavedPlaces } from "./importers.js";
import { projectRoot } from "./paths.js";
import { validateTrip } from "./validate.js";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function command(): string {
  return process.argv[2] ?? "help";
}

function seedTrip(): void {
  const tripFile = path.join(projectRoot, "data", "trips", "dolomites-2026", "trip.json");
  const trip = JSON.parse(fs.readFileSync(tripFile, "utf8"));
  upsertTrip(trip);
}

function init(): void {
  loadConfig();
  getDb();
  seedTrip();
  console.log("Database initialized.");
  console.log(listTrips());
}

function importProvided(): void {
  seedTrip();
  const tripId = "dolomites-2026";
  const original = path.join(projectRoot, "data", "imports", "original");
  const saved = path.join(original, "מקומות שמורים.json");
  const reviews = path.join(original, "ביקורות.json");

  if (fs.existsSync(saved)) {
    console.log("Saved places:", importSavedPlaces(saved, tripId));
  }
  if (fs.existsSync(reviews)) {
    console.log("Reviews:", importReviews(reviews, tripId));
  }
  console.log(`Total places: ${listPlaces({ tripId, limit: 100000 }).length}`);
}

function validate(): void {
  const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
  const result = validateTrip(tripId);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
}

function exportMaps(): void {
  const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
  const out = arg("--out");
  console.log(exportMyMapsCsv(tripId, out));
}

function backup(): void {
  getDb();
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const out = path.join(backupDirectory(), `travel-agent-${stamp}.sqlite`);
  copyDatabase(out);
  console.log(out);
}

switch (command()) {
  case "init":
    init();
    break;
  case "import-provided":
    importProvided();
    break;
  case "validate":
    validate();
    break;
  case "export-mymaps":
    exportMaps();
    break;
  case "backup":
    backup();
    break;
  case "list-places": {
    const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
    console.log(JSON.stringify(listPlaces({
      tripId,
      status: arg("--status"),
      priority: arg("--priority"),
      query: arg("--query"),
      limit: Number(arg("--limit") ?? 100),
    }), null, 2));
    break;
  }
  default:
    console.log(`
Commands:
  npm run init
  npm run import:provided
  npm run validate
  npm run export:mymaps
  npm run backup
  npx tsx src/cli.ts list-places --trip dolomites-2026
`);
}
