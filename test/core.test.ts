import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildAirbnbSearchUrl } from "../src/exports.js";
import {
  assertCalendarEventIsPlainText,
  calendarAttendeesWithoutPersonalInvite,
  normalizeCalendarDescription,
  previewCalendarEvent,
} from "../src/google-calendar.js";
import {
  isLikelyLodgingCalendarEvent,
  isProviderManagedLodgingItem,
} from "../src/calendar-policy.js";
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

test("calendar writes remove only the personal invite and reject stored HTML", () => {
  assert.deepEqual(
    calendarAttendeesWithoutPersonalInvite([
      { email: "DAVIDFR97@GMAIL.COM", responseStatus: "accepted" },
      { email: "travel-partner@example.com", responseStatus: "tentative" },
    ]),
    [
      {
        email: "travel-partner@example.com",
        responseStatus: "tentative",
        optional: undefined,
        comment: undefined,
        additionalGuests: undefined,
      },
    ],
  );

  assert.doesNotThrow(() =>
    assertCalendarEventIsPlainText(
      {
        description: "Google Maps:\nhttps://maps.example/place",
        attendees: [],
      },
      "Google Maps:\nhttps://maps.example/place",
    ),
  );
  assert.throws(
    () =>
      assertCalendarEventIsPlainText({
        description: "Google Maps:<br>https://maps.example/place",
        attendees: [],
      }),
    /still contains HTML/,
  );
  assert.throws(
    () =>
      assertCalendarEventIsPlainText({
        description: "Plain text",
        attendees: [{ email: "davidfr97@gmail.com" }],
      }),
    /personal calendar is still invited/,
  );
});

test("calendar commands and configuration point to the authoritative policy", () => {
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const policyPath =
    ".agents/skills/travel-planner/references/calendar-policy.md";
  const policy = fs.readFileSync(path.join(projectRoot, policyPath), "utf8");
  const tools = fs.readFileSync(path.join(projectRoot, "src/mcp-server.ts"), "utf8");
  const config = fs.readFileSync(
    path.join(projectRoot, "config/travel-agent.yaml"),
    "utf8",
  );
  const instructions = fs.readFileSync(
    path.join(projectRoot, "AGENTS.md"),
    "utf8",
  );
  const calendarInstructionEntryPoints = [
    "README.md",
    "AGENTS.md",
    ".agents/skills/travel-planner/SKILL.md",
    ".agents/skills/travel-planner/references/general-policy.md",
    ".agents/skills/travel-planner/references/lodging-policy.md",
    ".agents/skills/travel-planner/references/maps-policy.md",
    ".agents/skills/travel-planner/references/manifest.md",
    ".codex/agents/travel-operator.toml",
    ".codex/agents/travel-researcher.toml",
    "config/permissions.yaml",
    "config/travel-agent.yaml",
    "docs/ARCHITECTURE_HE.md",
    "docs/QUICKSTART_HE.md",
    "docs/TOOLS_HE.md",
    "src/cli.ts",
    "src/mcp-server.ts",
  ];

  assert.match(policy, /חוזה ביצוע מחייב לכל פקודת Calendar/);
  assert.match(policy, /sendUpdates: none/);
  assert.match(policy, /events\.get/);
  assert.match(policy, /davidfr97@gmail\.com/);
  assert.match(tools, /CALENDAR_POLICY_FILE/);
  assert.match(tools, /calendar_apply_event/);
  assert.match(tools, /calendar_delete_event/);
  assert.match(config, new RegExp(`policy_path: ${policyPath.replaceAll(".", "\\.")}`));
  assert.match(instructions, new RegExp(policyPath.replaceAll(".", "\\.")));
  for (const file of calendarInstructionEntryPoints) {
    const content = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert.match(
      content,
      /calendar-policy\.md|CALENDAR_POLICY_FILE/,
      `${file} must reference the authoritative Calendar policy`,
    );
  }
});

test("Airbnb and check-in lodging items are provider-managed calendar entries", () => {
  assert.equal(
    isProviderManagedLodgingItem({
      itemType: "lodging",
      title: "Check-in — a&o Venezia Mestre",
    }),
    true,
  );
  assert.equal(
    isProviderManagedLodgingItem({
      itemType: "base",
      title: "Ortisei check-in and orientation",
    }),
    true,
  );
  assert.equal(
    isLikelyLodgingCalendarEvent({ summary: "Airbnb — Cortina apartment stay" }),
    true,
  );
  assert.equal(
    isProviderManagedLodgingItem({
      itemType: "transfer",
      title: "Drive — Venice area → Cortina",
      source: "user_confirmed_airbnb",
    }),
    false,
  );
  assert.equal(
    isProviderManagedLodgingItem({
      itemType: "transfer",
      title: "Chiusa → Laion lodging",
      source: "user_confirmed_west_airbnb_v21",
    }),
    false,
  );
  assert.equal(
    isLikelyLodgingCalendarEvent({
      summary: "Chiusa → Laion lodging",
      itineraryItem: {
        itemType: "transfer",
        title: "Chiusa → Laion lodging",
        source: "user_confirmed_west_airbnb_v21",
      },
    }),
    false,
  );
  assert.equal(
    isProviderManagedLodgingItem({
      itemType: "logistics",
      title: "Early wake-up and checkout",
      source: "user_confirmed_west_airbnb_v21",
    }),
    false,
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
