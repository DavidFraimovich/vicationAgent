import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildAirbnbSearchUrl } from "../src/exports.js";
import {
  normalizeCalendarDescription,
  previewCalendarEvent,
} from "../src/google-calendar.js";
import { classifyPlace } from "../src/importers.js";
import { evaluateLodgingCandidate } from "../src/lodging-policy.js";

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

test("lodging policy accepts value stays and rejects expensive or incomplete options", () => {
  const accepted = evaluateLodgingCandidate({
    totalPriceIls: 672.86,
    nights: 1,
    tier: "pamper",
    rentalCarActive: true,
    parkingVerified: true,
    towelsIncluded: true,
    linensIncluded: true,
    privateBathroom: true,
    cleanlinessVerified: true,
    allFeesKnown: true,
    cancellationTermsVerified: true,
    fullRefundCancellationHoursBeforeCheckIn: 24,
    fullRefundIncludesFees: true,
    refundToOriginalPaymentMethod: true,
    spaAvailable: true,
    spaIncluded: true,
    spaPrivate: true,
  });
  assert.equal(accepted.eligible, true);
  assert.equal(accepted.nightlyPriceIls, 672.86);

  const expensive = evaluateLodgingCandidate({
    totalPriceIls: 1_200,
    nights: 1,
    tier: "pamper",
    rentalCarActive: true,
    parkingVerified: true,
    towelsIncluded: true,
    linensIncluded: true,
    privateBathroom: true,
    cleanlinessVerified: true,
    allFeesKnown: true,
    cancellationTermsVerified: true,
    fullRefundCancellationHoursBeforeCheckIn: 24,
    fullRefundIncludesFees: true,
    refundToOriginalPaymentMethod: true,
    spaAvailable: true,
    spaIncluded: true,
  });
  assert.equal(expensive.eligible, false);
  assert.ok(expensive.reasons.some((reason) => reason.includes("absolute maximum")));

  const missingStandards = evaluateLodgingCandidate({
    totalPriceIls: 250,
    nights: 1,
    tier: "simple",
    rentalCarActive: true,
  });
  assert.equal(missingStandards.eligible, false);
  assert.ok(missingStandards.reasons.some((reason) => reason.includes("Towels")));
  assert.ok(missingStandards.reasons.some((reason) => reason.includes("Parking")));
});

test("lodging policy rejects cancellation deadlines earlier than one day", () => {
  const fiveDaysBefore = evaluateLodgingCandidate({
    totalPriceIls: 500,
    nights: 1,
    tier: "standard",
    rentalCarActive: false,
    towelsIncluded: true,
    linensIncluded: true,
    privateBathroom: true,
    cleanlinessVerified: true,
    allFeesKnown: true,
    cancellationTermsVerified: true,
    fullRefundCancellationHoursBeforeCheckIn: 120,
    fullRefundIncludesFees: true,
    refundToOriginalPaymentMethod: true,
  });

  assert.equal(fiveDaysBefore.eligible, false);
  assert.ok(fiveDaysBefore.reasons.some((reason) => reason.includes("24 hours")));
});

test("place classifier identifies food and nature", () => {
  assert.ok(classifyPlace("Rifugio Lago Restaurant").includes("food"));
  assert.ok(classifyPlace("Mountain Lake Park").includes("nature"));
});

test("calendar descriptions are normalized to Apple Calendar-compatible plain text", () => {
  const description = [
    "<h2>לוגיסטיקה</h2>",
    "<p>להגיע מוקדם<br>ולבדוק חניה.</p>",
    "<ul><li><strong>Google Maps</strong>: <a href=\"https://maps.example/place\">פתחו מפה</a></li>",
    "<li>טלפון: <a href=\"tel:+390123456789\">+39 0123 456789</a></li></ul>",
    "<p>Tom &amp; Lena&nbsp;trip</p>",
  ].join("");
  const normalized = normalizeCalendarDescription(description);

  assert.equal(
    normalized,
    [
      "לוגיסטיקה",
      "",
      "להגיע מוקדם",
      "ולבדוק חניה.",
      "",
      "- Google Maps: פתחו מפה",
      "https://maps.example/place",
      "- טלפון: +39 0123 456789",
      "",
      "Tom & Lena trip",
    ].join("\n"),
  );
  assert.doesNotMatch(normalized ?? "", /<[^>]+>|&(?:amp|nbsp);/);

  const preview = previewCalendarEvent({
    summary: "Plain-text description",
    start: "2026-09-12T09:00:00",
    end: "2026-09-12T10:00:00",
    description,
  });
  assert.equal(
    (preview.event as { description?: string }).description,
    normalized,
  );
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
