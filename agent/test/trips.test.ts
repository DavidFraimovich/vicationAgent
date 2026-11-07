import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createTripProject, getTripContext, listTripManifests, tripPath } from "../src/trips.js";
import { closeDb, copyDatabase, getDb, getItineraryItem, getLodging, getPlace, getSetting,
  listActions, listItinerary, listPlaces, listTrips, recordAction, setSetting,
  upsertItineraryItem, upsertLodging, upsertPlace, upsertTrip } from "../src/db.js";
import { exportMyMapsCsv } from "../src/exports.js";
import { buildCalendarPreview } from "../src/calendar-preview.js";
import { isProtectedEvent, previewCalendarEvent } from "../src/google-calendar.js";
import { exportTripPlanHtml } from "../src/plan-html.js";
import { seedTripPlan } from "../src/plan-import.js";
import { validateTrip } from "../src/validate.js";
import { projectRoot } from "../src/paths.js";
import { createDashboardServer } from "../src/dashboard.js";

async function workspace(work: (directory: string) => Promise<void> | void): Promise<void> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vacation-trips-"));
  const keys = ["TRAVEL_AGENT_TRIPS_DIR", "TRAVEL_AGENT_TRIP", "TRAVEL_AGENT_DB"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  closeDb();
  process.env.TRAVEL_AGENT_TRIPS_DIR = directory;
  process.env.TRAVEL_AGENT_TRIP = "alpha";
  delete process.env.TRAVEL_AGENT_DB;
  try { await work(directory); }
  finally {
    closeDb();
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
function make(id: string, timezone = "Europe/Bucharest") {
  return createTripProject({ id, name: `Trip ${id}`, timezone, startDate: "2026-12-29", endDate: "2027-01-02" });
}

// Same entity IDs across trips are intentional: these catch accidental use of a global database.
test("parallel operations keep places, itineraries, lodging, settings and audit in their own databases", async () => workspace(async () => {
  make("alpha"); make("beta", "Europe/Rome");
  await Promise.all(["alpha", "beta"].map(async (tripId) => {
    upsertPlace({ id: "same-place", tripId, name: tripId, googleMapsUrl: "https://maps.example/shared" });
    await new Promise((resolve) => setTimeout(resolve, tripId === "alpha" ? 10 : 1));
    upsertItineraryItem({ id: "same-item", tripId, dayDate: "2026-12-30", title: tripId });
    upsertLodging({ id: "same-lodging", tripId, title: tripId, provider: "test" });
    setSetting("same-setting", tripId, tripId);
    recordAction({ tripId, provider: "test", action: "local-only", status: tripId });
    await Promise.resolve();
    assert.equal(getPlace("same-place", tripId)?.name, tripId);
    assert.equal(getItineraryItem("same-item", tripId)?.title, tripId);
    assert.equal(getLodging("same-lodging", tripId)?.title, tripId);
    assert.equal(getSetting("same-setting", "missing", tripId), tripId);
    assert.equal(listActions(tripId).length, 1);
    assert.equal(listActions(tripId)[0]?.status, tripId);
  }));
  assert.notEqual(getDb("alpha"), getDb("beta"));
}));

test("new trip scaffolding and trip discovery are independent of database contents", async () => workspace((root) => {
  make("alpha");
  const manifest = make("beta");
  assert.equal(fs.existsSync(getTripContext("beta").databasePath), false);
  assert.deepEqual(listTrips().map((trip) => trip.id), ["alpha", "beta"]);
  const plan = JSON.parse(fs.readFileSync(tripPath("beta", "plan.json"), "utf8"));
  assert.deepEqual(plan.itinerary, []);
  assert.deepEqual(plan.places, []);
  assert.deepEqual(plan.lodgingCandidates, []);
  assert.equal(plan.trip.id, manifest.id);
  assert.equal(plan.trip.calendar, undefined);
  for (const dir of ["data", "docs", "research", "documents", "exports", "backups"]) assert.ok(fs.existsSync(path.join(root, "beta", dir, "AGENTS.md")));
  assert.throws(() => make("beta"), /already exists/);
  assert.equal(listTripManifests().length, 2);
}));

test("invalid trip IDs, dates, zones and unscoped database overrides fail before creating data", async () => workspace((root) => {
  for (const id of ["../escape", "../alpha", "Alpha", "/tmp/escape"]) assert.throws(() => make(id), /Invalid trip ID/);
  assert.throws(() => make("alpha", "not-a-timezone"));
  assert.throws(() => createTripProject({ id: "alpha", name: "Bad", timezone: "UTC", startDate: "2027-02-30" }), /Invalid trip date/);
  assert.deepEqual(fs.readdirSync(root), []);
  make("alpha");
  assert.throws(() => tripPath("alpha", "../beta/plan.json"), /inside/);
  process.env.TRAVEL_AGENT_DB = path.join(root, "shared.sqlite");
  assert.throws(() => getDb("alpha"), /must contain/);
}));

test("consistent SQLite backup includes committed WAL data without closing the live database", async () => workspace((root) => {
  make("alpha");
  upsertPlace({ id: "latest", tripId: "alpha", name: "Uncheckpointed place" });
  const file = path.join(root, "snapshot.sqlite");
  copyDatabase(file, "alpha");
  const snapshot = new DatabaseSync(file, { readOnly: true });
  try {
    assert.equal(snapshot.prepare("SELECT name FROM places WHERE id = 'latest'").get()?.name, "Uncheckpointed place");
    assert.equal(snapshot.prepare("PRAGMA integrity_check").get()?.integrity_check, "ok");
  } finally { snapshot.close(); }
  assert.throws(() => copyDatabase(file, "alpha"), /already exists/);
}));

test("draft validation reports all five unplanned dates across New Year as warnings", async () => workspace(() => {
  make("alpha");
  const result = validateTrip("alpha");
  assert.equal(result.ok, true);
  assert.equal(result.summary.tripDays, 5);
  assert.equal(result.summary.daysPlanned, 0);
  assert.equal(result.issues.filter((issue) => issue.code === "UNPLANNED_TRIP_DAY").length, 5);
  assert.ok(result.issues.every((issue) => issue.severity === "warning"));
}));

test("CSV and Calendar preview use selected trip, timezone and export directory", async () => workspace(() => {
  make("alpha"); make("beta", "Europe/Rome");
  upsertPlace({ id: "site", tripId: "alpha", name: "Only alpha", googleMapsUrl: "https://maps.example/alpha" });
  upsertPlace({ id: "site", tripId: "beta", name: "Only beta", googleMapsUrl: "https://maps.example/beta" });
  const csv = exportMyMapsCsv("beta");
  assert.ok(csv.file.startsWith(getTripContext("beta").exportDirectory + path.sep));
  assert.match(fs.readFileSync(csv.file, "utf8"), /Only beta/);
  assert.doesNotMatch(fs.readFileSync(csv.file, "utf8"), /Only alpha/);
  upsertItineraryItem({ id: "item", tripId: "beta", dayDate: "2026-12-30", startTime: "09:00", endTime: "10:00", title: "Beta activity", status: "planned" });
  const preview = buildCalendarPreview("beta");
  const data = JSON.parse(fs.readFileSync(preview.file, "utf8"));
  assert.equal(data.timezone, "Europe/Rome");
  assert.equal(data.events[0].event.start.timeZone, "Europe/Rome");
  assert.equal(listActions("alpha").length, 0);
  assert.equal(listActions("beta").length, 1);
  const event = previewCalendarEvent({ tripId: "alpha", summary: "Preview only", start: "2026-12-30T10:00:00", end: "2026-12-30T11:00:00" }) as any;
  assert.equal(event.event.start.timeZone, "Europe/Bucharest");
}));

test("HTML export matches December and January to their actual years and supports local-only output", async () => workspace(() => {
  const trip = { ...make("alpha"), metadata: { planVersion: "test-v1" } };
  const days = ["2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"];
  const plan = { trip, places: [], lodgingCandidates: [], itinerary: days.map((dayDate, index) => ({ id: `item-${index}`, tripId: trip.id, dayDate, title: `Day ${index}` })) };
  fs.writeFileSync(tripPath("alpha", "plan.json"), JSON.stringify(plan));
  seedTripPlan(undefined, "alpha");
  const markdown = "# New Year\n\n> גרסת מקור: `test-v1` | המסמך עודכן: **07.11.2026**\n\n" + days.map((day) => `## יום, ${Number(day.slice(8))}.${Number(day.slice(5, 7))}.${day.slice(0, 4)}\n\nטיוטה\n`).join("\n");
  fs.writeFileSync(tripPath("alpha", "docs/PLAN_HE.md"), markdown);
  const html = exportTripPlanHtml("alpha", { localOnly: true });
  assert.equal(html.days, 5);
  assert.equal(html.driveFile, undefined);
  assert.match(fs.readFileSync(html.localFile, "utf8"), /day-01-02/);
  assert.throws(() => exportTripPlanHtml("alpha"), /No Google Drive destination configured/);
}));

test("completed archives cannot be reseeded and cross-trip plans are rejected before mutation", async () => workspace(() => {
  createTripProject({ ...makeInput("alpha"), status: "completed" });
  upsertItineraryItem({ id: "preserve", tripId: "alpha", dayDate: "2026-12-30", title: "Historical" });
  assert.throws(() => seedTripPlan(undefined, "alpha"), /completed trip archive/);
  assert.equal(listItinerary("alpha").length, 1);
  make("beta");
  const plan = JSON.parse(fs.readFileSync(tripPath("beta", "plan.json"), "utf8"));
  plan.places.push({ tripId: "alpha", name: "Wrong scope" });
  fs.writeFileSync(tripPath("beta", "plan.json"), JSON.stringify(plan));
  assert.throws(() => seedTripPlan(undefined, "beta"), /all belong/);
  assert.equal(listPlaces({ tripId: "alpha" }).length, 0);
  assert.equal(listPlaces({ tripId: "beta" }).length, 0);
}));
function makeInput(id: string) { return { id, name: id, timezone: "UTC" }; }

test("flight protection resolves every trip manifest even when another trip is active", async () => workspace(() => {
  make("alpha");
  createTripProject({ ...makeInput("beta"), calendar: { protected_events: [{ event_id: "flight-id" }, { title_contains: "TEST 123", date: "2027-01-02" }] } });
  assert.equal(isProtectedEvent({ id: "flight-id" }), true);
  assert.equal(isProtectedEvent({ summary: "Flight TEST 123", start: { date: "2027-01-02" } }), true);
  assert.equal(isProtectedEvent({ id: "other" }), false);
}));

test("dashboard accepts parallel trip requests and rejects writes without explicit tripId", async () => workspace(async () => {
  make("alpha"); make("beta");
  const server = createDashboardServer();
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await Promise.all(["alpha", "beta"].map(async (tripId) => {
      const response = await fetch(origin + "/api/place", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "same", tripId, name: tripId }) });
      assert.equal(response.status, 200);
      const rows = await (await fetch(origin + `/api/places?tripId=${tripId}`)).json();
      assert.equal(rows[0].name, tripId);
    }));
    const invalid = await fetch(origin + "/api/place", { method: "POST", body: JSON.stringify({ id: "bad", name: "No trip" }) });
    assert.equal(invalid.status, 400);
    const trips = await (await fetch(origin + "/api/trips")).json();
    assert.equal(trips.length, 2);
    const configuration = await (await fetch(origin + "/api/config")).json();
    assert.equal(configuration.defaultTripId, "alpha");
    const page = await (await fetch(origin)).text();
    assert.match(page, /id="tripSelect"/);
  } finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
}));

test("CLI new-trip scaffolds an isolated project and CLI exports select it", async () => workspace((root) => {
  const args = ["--import", "tsx", "agent/src/cli.ts"];
  const run = (...commands: string[]) => spawnSync(process.execPath, [...args, ...commands], { cwd: projectRoot, env: process.env, encoding: "utf8" });
  const created = run("new-trip", "--trip", "alpha", "--name", "CLI trip", "--timezone", "Europe/Bucharest", "--start", "2026-12-29", "--end", "2027-01-02");
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).id, "alpha");
  assert.equal(run("validate", "--trip", "alpha").status, 0);
  const exported = run("export-mymaps", "--trip", "alpha");
  assert.equal(exported.status, 0, exported.stderr);
  assert.ok(JSON.parse(exported.stdout).file.startsWith(path.join(root, "alpha", "exports")));
  assert.equal(run("new-trip", "--trip", "alpha", "--name", "Duplicate", "--timezone", "UTC").status, 1);
}));

test("MCP creates and reads independent trip projects over the actual stdio transport", async () => workspace(async () => {
  const transport = new StdioClientTransport({ command: process.execPath,
    args: ["--import", "tsx", "agent/src/mcp-server.ts"], cwd: projectRoot,
    env: Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)), stderr: "pipe" });
  const client = new Client({ name: "vacation-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    for (const id of ["alpha", "beta"]) {
      const created = await client.callTool({ name: "travel_create_trip", arguments: { id, name: id, timezone: "UTC" } });
      assert.equal(created.isError, undefined);
    }
    await Promise.all(["alpha", "beta"].map(async (tripId) => {
      await client.callTool({ name: "travel_upsert_place", arguments: { id: "same", tripId, name: tripId } });
      const response = await client.callTool({ name: "travel_get_trip", arguments: { tripId } });
      const payload = JSON.parse((response.content as Array<{ text: string }>)[0]!.text);
      assert.equal(payload.trip.id, tripId);
      assert.equal(payload.places[0].name, tripId);
    }));
  } finally { await client.close(); }
}));


test("trip metadata updates preserve richer database metadata and reject invalid timezone changes", async () => workspace(() => {
  make("alpha");
  getDb("alpha").prepare("UPDATE trips SET metadata_json = ? WHERE id = ?").run(JSON.stringify({ planVersion: "keep-me", operationalNote: "retained" }), "alpha");
  upsertTrip({ id: "alpha", name: "Renamed" });
  const result = getDb("alpha").prepare("SELECT metadata_json FROM trips WHERE id = ?").get("alpha");
  assert.deepEqual(JSON.parse(String(result?.metadata_json)), { planVersion: "keep-me", operationalNote: "retained" });
  assert.throws(() => upsertTrip({ id: "alpha", name: "Invalid update", timezone: "Bad/Zone" }));
  assert.equal(getTripContext("alpha").timezone, "Europe/Bucharest");
}));
