import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildAirbnbSearchUrl } from "../src/exports.js";
import { classifyPlace } from "../src/importers.js";

test("Airbnb URL includes dates and adults", () => {
  const url = buildAirbnbSearchUrl({
    location: "Cortina d'Ampezzo",
    checkIn: "2026-09-11",
    checkOut: "2026-09-17",
    adults: 2,
  });
  assert.match(url, /checkin=2026-09-11/);
  assert.match(url, /checkout=2026-09-17/);
  assert.match(url, /adults=2/);
});

test("place classifier identifies food and nature", () => {
  assert.ok(classifyPlace("Rifugio Lago Restaurant").includes("food"));
  assert.ok(classifyPlace("Mountain Lake Park").includes("nature"));
});

test("plan seeding is idempotent and trip-place links stay scoped", { concurrency: false }, async () => {
  const oldDb = process.env.TRAVEL_AGENT_DB;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "travel-agent-test-"));
  const database = path.join(directory, "test.sqlite");
  process.env.TRAVEL_AGENT_DB = database;

  const { loadConfig } = await import("../src/config.js");
  const {
    closeDb,
    getDb,
    listItinerary,
    listLodging,
    listPlaces,
    upsertPlace,
  } = await import("../src/db.js");
  const { seedTripPlan } = await import("../src/plan-import.js");

  try {
    loadConfig(true);
    const first = seedTripPlan();
    const second = seedTripPlan();
    assert.deepEqual(second, first);
    assert.equal(listPlaces({ tripId: "dolomites-2026", limit: 1000 }).length, first.places);
    assert.equal(listItinerary("dolomites-2026").length, first.itineraryItems);
    assert.equal(listLodging("dolomites-2026").length, first.lodgingCandidates);

    upsertPlace({
      id: "library-only",
      tripId: "dolomites-2026",
      name: "Library-only place",
      googleMapsUrl: "https://www.google.com/maps/search/library-only-test-place",
      linkToTrip: false,
    });
    assert.equal(
      listPlaces({ tripId: "dolomites-2026", query: "Library-only", limit: 10 }).length,
      0,
    );

    upsertPlace({
      id: "library-only",
      tripId: "dolomites-2026",
      name: "Library-only place",
      googleMapsUrl: "https://www.google.com/maps/search/library-only-test-place",
      linkToTrip: true,
    });
    assert.equal(
      listPlaces({ tripId: "dolomites-2026", query: "Library-only", limit: 10 }).length,
      1,
    );
    assert.equal(getDb().prepare("PRAGMA quick_check").get()?.quick_check, "ok");
  } finally {
    closeDb();
    if (oldDb === undefined) delete process.env.TRAVEL_AGENT_DB;
    else process.env.TRAVEL_AGENT_DB = oldDb;
    loadConfig(true);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
