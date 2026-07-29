import fs from "node:fs";
import path from "node:path";
import { backupDirectory, loadConfig } from "./config.js";
import { buildCalendarPreview } from "./calendar-preview.js";
import { copyDatabase, getDb, listPlaces, listTrips, upsertTrip, } from "./db.js";
import { exportMyMapsCsv } from "./exports.js";
import { importReviews, importSavedPlaces } from "./importers.js";
import { seedTripPlan } from "./plan-import.js";
import { projectRoot } from "./paths.js";
import { validateTrip } from "./validate.js";
function arg(name) {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function command() {
    return process.argv[2] ?? "help";
}
function seedTrip() {
    const tripFile = path.join(projectRoot, "data", "trips", "dolomites-2026", "trip.json");
    const trip = JSON.parse(fs.readFileSync(tripFile, "utf8"));
    upsertTrip(trip);
}
function init() {
    loadConfig();
    getDb();
    seedTrip();
    console.log("Database initialized.");
    console.log(listTrips());
}
function importProvided() {
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
function validate() {
    const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
    const result = validateTrip(tripId);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok)
        process.exitCode = 2;
}
function exportMaps() {
    const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
    const out = arg("--out");
    console.log(exportMyMapsCsv(tripId, out));
}
function previewCalendar() {
    const tripId = arg("--trip") ?? loadConfig().project.default_trip_id;
    console.log(buildCalendarPreview(tripId, arg("--out")));
}
function backup() {
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
    case "preview-calendar":
        previewCalendar();
        break;
    case "export-plan-html": {
        const { exportDolomitesPlanHtml } = await import("./plan-html.js");
        console.log(JSON.stringify(exportDolomitesPlanHtml(), null, 2));
        break;
    }
    case "backup":
        backup();
        break;
    case "seed-plan":
        console.log(JSON.stringify(seedTripPlan(arg("--file")), null, 2));
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
  npm run export:plan-html
  npm run calendar:preview
  npm run backup
  npm run seed:plan
  node --import tsx src/cli.ts list-places --trip dolomites-2026

Calendar policy:
  .agents/skills/travel-planner/references/calendar-policy.md
  Read and follow it before every Calendar read, preview, create, update, or delete command.
`);
}
