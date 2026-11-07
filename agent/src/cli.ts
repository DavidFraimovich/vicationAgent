import fs from "node:fs";
import path from "node:path";
import { backupDirectory } from "./config.js";
import { buildCalendarPreview } from "./calendar-preview.js";
import { closeDb, copyDatabase, getDb, listPlaces, listTrips } from "./db.js";
import { exportMyMapsCsv } from "./exports.js";
import { importReviews, importSavedPlaces } from "./importers.js";
import { seedTripPlan } from "./plan-import.js";
import { createTripProject, defaultTripId, tripPath } from "./trips.js";
import { validateTrip } from "./validate.js";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function required(name: string): string {
  const value = arg(name);
  if (!value || value.startsWith("--")) throw new Error(`${name} is required.`);
  return value;
}
const tripId = arg("--trip") ?? defaultTripId();
const command = process.argv[2] ?? "help";
try {
  switch (command) {
    case "init":
      getDb(tripId);
      console.log(JSON.stringify({ initialized: tripId, trips: listTrips() }, null, 2));
      break;
    case "new-trip": {
      const manifest = createTripProject({ id: required("--trip"), name: required("--name"),
        timezone: required("--timezone"), startDate: arg("--start"), endDate: arg("--end") });
      getDb(manifest.id);
      console.log(JSON.stringify(manifest, null, 2));
      break;
    }
    case "list-trips":
      console.log(JSON.stringify(listTrips(), null, 2));
      break;
    case "import-provided": {
      getDb(tripId);
      const original = tripPath(tripId, "imports/original");
      for (const [name, importer] of [["מקומות שמורים.json", importSavedPlaces], ["ביקורות.json", importReviews]] as const) {
        const file = path.join(original, name);
        if (fs.existsSync(file)) console.log(JSON.stringify(importer(file, tripId)));
      }
      break;
    }
    case "validate": {
      const results = (process.argv.includes("--all") ? listTrips().map((trip) => String(trip.id)) : [tripId]).map(validateTrip);
      console.log(JSON.stringify(process.argv.includes("--all") ? results : results[0], null, 2));
      if (results.some((result) => !result.ok)) process.exitCode = 2;
      break;
    }
    case "export-mymaps":
      console.log(JSON.stringify(exportMyMapsCsv(tripId, arg("--out")), null, 2));
      break;
    case "preview-calendar":
      console.log(JSON.stringify(buildCalendarPreview(tripId, arg("--out")), null, 2));
      break;
    case "export-plan-html": {
      const { exportTripPlanHtml } = await import("./plan-html.js");
      console.log(JSON.stringify(exportTripPlanHtml(tripId, { localOnly: process.argv.includes("--local-only"), localOutputFile: arg("--out") }), null, 2));
      break;
    }
    case "backup": {
      const out = path.join(backupDirectory(tripId), `travel-agent-${new Date().toISOString().replaceAll(":", "-")}.sqlite`);
      copyDatabase(out, tripId);
      console.log(out);
      break;
    }
    case "seed-plan":
      console.log(JSON.stringify(seedTripPlan(arg("--file"), tripId), null, 2));
      break;
    case "list-places":
      console.log(JSON.stringify(listPlaces({ tripId, status: arg("--status"), priority: arg("--priority"), query: arg("--query"), limit: Number(arg("--limit") ?? 100) }), null, 2));
      break;
    default:
      console.log(`VacationAgent — run from the repository root.
Commands: init, new-trip, list-trips, import-provided, validate, export-mymaps,
  preview-calendar, export-plan-html, backup, seed-plan, list-places.
All trip commands accept --trip <id>. validate also accepts --all.
new-trip requires --trip <id> --name <name> --timezone <IANA>; optional --start/--end YYYY-MM-DD.
export-plan-html --local-only writes only the local mirror.
Read agent/policies/calendar-policy.md before any Calendar operation.
Creating or initializing a trip does not publish to external providers.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  closeDb();
}
