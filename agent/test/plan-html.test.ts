import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createTripProject } from "../src/trips.js";
import {
  parsePlanDocumentMetadata,
  renderPlanHtml,
  resolveDrivePlanDirectory,
} from "../src/plan-html.js";

const sampleMarkdown = `# התוכנית המלאה — בדיקה

> גרסת מקור: \`plan-test-v1\` | המסמך עודכן: **29.07.2026**

## יום רביעי, 9.9 — התחלה

| שעה | תוכנית |
|---|---|
| 09:00 | [מפה](https://maps.example/place) |

<script>alert("unsafe")</script>

## יום חמישי, 10.9 — המשך

טקסט רגיל.
`;

test("plan HTML metadata extracts the version and every day", () => {
  const metadata = parsePlanDocumentMetadata(sampleMarkdown);
  assert.equal(metadata.title, "התוכנית המלאה — בדיקה");
  assert.equal(metadata.planVersion, "plan-test-v1");
  assert.equal(metadata.updatedDate, "29.07.2026");
  assert.deepEqual(
    metadata.days.map((day) => ({ id: day.id, label: day.label })),
    [
      { id: "day-09-09", label: "9.9" },
      { id: "day-09-10", label: "10.9" },
    ],
  );
});

test("plan HTML is mobile friendly, wraps tables, and escapes raw HTML", () => {
  const html = renderPlanHtml(sampleMarkdown);
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /id="day-09-09"/);
  assert.match(html, /class="table-wrap"/);
  assert.match(html, /overflow-x: auto/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
});

test("Google Drive destination resolution requires one exact trip folder", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "travel-plan-drive-"));
  const oldRoot = process.env.TRAVEL_AGENT_TRIPS_DIR;
  process.env.TRAVEL_AGENT_TRIPS_DIR = path.join(root, "trips");
  createTripProject({ id: "sample-trip", name: "Sample", timezone: "UTC", exports: { driveRelativeDirectory: "האחסון שלי/development/Example trip plan" } });
  try {
    assert.throws(
      () => resolveDrivePlanDirectory({ cloudStorageRoot: root, tripId: "sample-trip" }),
      /No Google Drive destination found/,
    );

    const expected = path.join(
      root,
      "GoogleDrive-test@example.com",
      "האחסון שלי",
      "development",
      "Example trip plan",
    );
    fs.mkdirSync(expected, { recursive: true });
    assert.equal(
      resolveDrivePlanDirectory({ cloudStorageRoot: root, tripId: "sample-trip" }),
      expected,
    );

    const second = path.join(
      root,
      "GoogleDrive-other@example.com",
      "האחסון שלי",
      "development",
      "Example trip plan",
    );
    fs.mkdirSync(second, { recursive: true });
    assert.throws(
      () => resolveDrivePlanDirectory({ cloudStorageRoot: root, tripId: "sample-trip" }),
      /Multiple Google Drive destinations found/,
    );
  } finally {
    if (oldRoot === undefined) delete process.env.TRAVEL_AGENT_TRIPS_DIR;
    else process.env.TRAVEL_AGENT_TRIPS_DIR = oldRoot;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
