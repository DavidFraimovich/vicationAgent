import assert from "node:assert/strict";
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
