import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { projectRoot, resolveProjectPath } from "./paths.js";

export type TripManifest = {
  id: string;
  name: string;
  timezone: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  planningStage?: string;
  travelers?: number;
  routeStrategy?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  calendar?: { protected_events?: Array<{ title_contains?: string; date?: string; event_id?: string }> };
  browser?: { allowed_domains?: string[] };
  exports?: { markdown?: string; driveRelativeDirectory?: string; driveDirectory?: string; driveFileName?: string };
};

export type TripContext = {
  tripId: string;
  directory: string;
  timezone: string;
  databasePath: string;
  exportDirectory: string;
  backupDirectory: string;
  manifest: TripManifest;
};

export function defaultTripId(): string {
  return process.env.TRAVEL_AGENT_TRIP ?? loadConfig().project.default_trip_id;
}

export function tripsDirectory(): string {
  return resolveProjectPath(process.env.TRAVEL_AGENT_TRIPS_DIR ?? loadConfig().storage.trips_directory);
}

export function tripDirectory(tripId: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tripId)) throw new Error(`Invalid trip ID: ${tripId}`);
  return path.join(tripsDirectory(), tripId);
}

export function readTripManifest(tripId = defaultTripId()): TripManifest {
  const file = path.join(tripDirectory(tripId), "trip.json");
  if (!fs.existsSync(file)) throw new Error(`Trip not found: ${tripId}`);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as TripManifest;
  validateManifest(manifest);
  if (manifest.id !== tripId) throw new Error(`Trip ID mismatch: ${tripId}`);
  return manifest;
}

export function listTripManifests(): TripManifest[] {
  const root = tripsDirectory();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, "trip.json")))
    .map((entry) => readTripManifest(entry.name))
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "") || a.name.localeCompare(b.name));
}

export function validateManifest(input: TripManifest): void {
  tripDirectory(input.id);
  if (!input.name?.trim()) throw new Error("Trip name is required.");
  new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
  if (!input.timezone) throw new Error("Trip timezone is required.");
  for (const date of [input.startDate, input.endDate]) {
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
      throw new Error(`Invalid trip date: ${date}`);
    }
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) throw new Error("Trip end is before start.");
}

export function getTripContext(tripId = defaultTripId()): TripContext {
  const manifest = readTripManifest(tripId);
  const directory = tripDirectory(tripId);
  const override = process.env.TRAVEL_AGENT_DB;
  if (override && !override.includes("{tripId}")) {
    throw new Error("TRAVEL_AGENT_DB must contain {tripId}; use TRAVEL_AGENT_TRIPS_DIR for isolated workspaces.");
  }
  return {
    tripId, directory, timezone: manifest.timezone, manifest,
    databasePath: override ? resolveProjectPath(override.replaceAll("{tripId}", tripId)) : path.join(directory, "data", "travel-agent.sqlite"),
    exportDirectory: path.join(directory, "exports"),
    backupDirectory: path.join(directory, "backups"),
  };
}

export function tripPath(tripId: string, relative: string): string {
  const root = tripDirectory(tripId);
  const result = path.resolve(root, relative);
  if (!result.startsWith(root + path.sep)) throw new Error("Trip path must stay inside its project.");
  return result;
}

export function createTripProject(input: TripManifest): TripManifest {
  validateManifest(input);
  const directory = tripDirectory(input.id);
  if (fs.existsSync(directory)) throw new Error(`Trip project already exists: ${input.id}`);
  const manifest = { status: "planning", planningStage: "draft", ...input };
  fs.mkdirSync(directory, { recursive: true });
  try {
    for (const folder of ["data", "docs", "research", "documents", "exports", "backups"]) {
      fs.mkdirSync(path.join(directory, folder));
      fs.writeFileSync(path.join(directory, folder, "AGENTS.md"), `# ${folder} — ${input.id}\n\nOnly this trip. Read ../AGENTS.md; preserve sources and do not publish private booking details.\n`);
    }
    fs.writeFileSync(path.join(directory, "trip.json"), JSON.stringify(manifest, null, 2) + "\n");
    fs.writeFileSync(path.join(directory, "plan.json"), JSON.stringify({ trip: manifest, places: [], itinerary: [], lodgingCandidates: [] }, null, 2) + "\n");
    fs.writeFileSync(path.join(directory, "AGENTS.md"), `# ${input.name}\n\n- Context: trip.json; tripId: ${input.id}; timezone: ${input.timezone}.\n- Plan: plan.json and docs/PLAN_HE.md; live state: data/travel-agent.sqlite.\n- Read ../../agent/AGENTS.md before operations; use explicit tripId.\n- This is a draft; missing activities are unplanned, not confirmed.\n- Record actual outcomes and lessons in retrospective.md.\n`);
    const template = fs.readFileSync(path.join(projectRoot, "agent/templates/plan-he.md"), "utf8");
    fs.writeFileSync(path.join(directory, "docs/PLAN_HE.md"), template.replaceAll("{{name}}", input.name).replaceAll("{{tripId}}", input.id).replaceAll("{{updatedDate}}", new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())));
    fs.writeFileSync(path.join(directory, "retrospective.md"), `# תחקיר — ${input.name}\n\nטרם נאסף משוב. אין להסיק ביצוע מתוכנית או מאירועי יומן.\n`);
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  return manifest;
}
