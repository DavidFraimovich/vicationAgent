import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import MarkdownIt from "markdown-it";
import { dbPath, exportDirectory } from "./config.js";
import { projectRoot } from "./paths.js";

const tripId = "dolomites-2026";
const planFile = path.join(
  projectRoot,
  "data",
  "trips",
  tripId,
  "plan.json",
);
const markdownFile = path.join(
  projectRoot,
  "docs",
  "DOLOMITES_2026_FULL_PLAN_HE.md",
);
const driveRelativeDirectory = path.join(
  "האחסון שלי",
  "development",
  "תוכנית דולומיטים 2026",
);
const driveFileName = "תוכנית דולומיטים 2026.html";

type PlanFile = {
  trip: {
    id: string;
    startDate: string;
    endDate: string;
    metadata?: {
      planVersion?: unknown;
    };
  };
  itinerary: Array<{
    dayDate: string;
  }>;
};

export type DayNavigationEntry = {
  id: string;
  label: string;
  heading: string;
  month: number;
  day: number;
};

export type PlanDocumentMetadata = {
  title: string;
  planVersion: string;
  updatedDate: string;
  days: DayNavigationEntry[];
};

export type ExportPlanHtmlOptions = {
  cloudStorageRoot?: string;
  driveDirectory?: string;
  localOutputFile?: string;
};

export type PlanHtmlExportResult = {
  planVersion: string;
  days: number;
  itineraryItems: number;
  localFile: string;
  driveFile: string;
  sha256: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]!);
}

function dayId(month: number, day: number): string {
  return `day-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parsePlanDocumentMetadata(markdown: string): PlanDocumentMetadata {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const planVersion = markdown.match(/גרסת מקור:\s*`([^`]+)`/)?.[1]?.trim();
  const updatedDate = markdown.match(/המסמך עודכן:\s*\*\*([^*]+)\*\*/)?.[1]?.trim();

  if (!title) throw new Error("The Markdown plan is missing its H1 title.");
  if (!planVersion) throw new Error("The Markdown plan is missing its source version.");
  if (!updatedDate) throw new Error("The Markdown plan is missing its updated date.");

  const days: DayNavigationEntry[] = [];
  const pattern = /^##\s+(יום[^\n]*?(\d{1,2})\.(\d{1,2})[^\n]*)$/gm;
  for (const match of markdown.matchAll(pattern)) {
    const heading = match[1]!.trim();
    const day = Number(match[2]);
    const month = Number(match[3]);
    days.push({
      id: dayId(month, day),
      label: `${day}.${month}`,
      heading,
      month,
      day,
    });
  }

  if (!days.length) throw new Error("The Markdown plan has no day headings.");
  return { title, planVersion, updatedDate, days };
}

function createMarkdownRenderer(): MarkdownIt {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
  });

  const originalHeadingOpen = markdown.renderer.rules.heading_open;
  markdown.renderer.rules.heading_open = (
    tokens: any[],
    index: number,
    options: any,
    environment: any,
    renderer: any,
  ): string => {
    const token = tokens[index]!;
    const heading = tokens[index + 1]?.content as string | undefined;
    const date = heading?.match(/^יום[^\n]*?(\d{1,2})\.(\d{1,2})/);
    if (token.tag === "h2" && date) {
      token.attrSet("id", dayId(Number(date[2]), Number(date[1])));
    }
    return originalHeadingOpen
      ? originalHeadingOpen(tokens, index, options, environment, renderer)
      : renderer.renderToken(tokens, index, options);
  };

  const originalLinkOpen = markdown.renderer.rules.link_open;
  markdown.renderer.rules.link_open = (
    tokens: any[],
    index: number,
    options: any,
    environment: any,
    renderer: any,
  ): string => {
    tokens[index]!.attrSet("target", "_blank");
    tokens[index]!.attrSet("rel", "noopener noreferrer");
    return originalLinkOpen
      ? originalLinkOpen(tokens, index, options, environment, renderer)
      : renderer.renderToken(tokens, index, options);
  };

  markdown.renderer.rules.table_open = () =>
    "<div class=\"table-wrap\" role=\"region\" aria-label=\"טבלה ניתנת לגלילה\" tabindex=\"0\"><table>\n";
  markdown.renderer.rules.table_close = () => "</table></div>\n";

  return markdown;
}

export function renderPlanHtml(markdownSource: string): string {
  const metadata = parsePlanDocumentMetadata(markdownSource);
  const markdown = createMarkdownRenderer();
  const markdownWithoutTitle = markdownSource.replace(/^#\s+[^\n]+\n+/, "");
  const content = markdown.render(markdownWithoutTitle);
  const navigation = metadata.days.map((entry) =>
    `<a href="#${entry.id}" aria-label="${escapeHtml(entry.heading)}">${entry.label}</a>`
  ).join("\n");

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(metadata.title)}</title>
  <style>
    :root {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #20312b;
      background: #f4f1e9;
      font-synthesis: none;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
    body { margin: 0; min-width: 0; background: #f4f1e9; line-height: 1.65; }
    .hero {
      padding: max(22px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 20px max(16px, env(safe-area-inset-left));
      color: #fff;
      background: linear-gradient(135deg, #173f35, #2e6b58);
      box-shadow: 0 2px 14px rgb(13 42 34 / 18%);
    }
    .hero-inner, main { width: min(100%, 920px); margin-inline: auto; }
    .eyebrow { margin: 0 0 4px; color: #cce7dc; font-size: .82rem; font-weight: 700; letter-spacing: .04em; }
    .hero h1 { margin: 0; font-size: clamp(1.65rem, 7vw, 2.7rem); line-height: 1.2; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .meta span { padding: 5px 10px; border: 1px solid rgb(255 255 255 / 35%); border-radius: 999px; background: rgb(255 255 255 / 10%); font-size: .88rem; }
    .day-nav { display: flex; gap: 8px; margin-top: 18px; padding-bottom: 3px; overflow-x: auto; scrollbar-width: thin; }
    .day-nav a { flex: 0 0 auto; min-width: 50px; padding: 8px 10px; border-radius: 10px; color: #173f35; background: #fff; font-weight: 750; text-align: center; text-decoration: none; }
    .day-nav a:focus-visible { outline: 3px solid #ffd166; outline-offset: 2px; }
    main { padding: 18px max(16px, env(safe-area-inset-right)) max(56px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); font-size: 1.04rem; }
    h2, h3, h4 { color: #173f35; line-height: 1.3; }
    h2 { margin: 42px 0 14px; padding: 14px 16px; border-radius: 14px; background: #e1ece6; scroll-margin-top: 12px; }
    h3 { margin-top: 30px; }
    p, li { overflow-wrap: anywhere; }
    a { color: #075f8f; text-underline-offset: 3px; }
    blockquote { margin: 18px 0; padding: 8px 14px; border-right: 4px solid #c18c36; border-radius: 8px 0 0 8px; background: #fff9e9; }
    code { padding: 2px 5px; border-radius: 5px; background: #e8e5dd; direction: ltr; unicode-bidi: isolate; }
    pre { padding: 14px; border-radius: 10px; overflow-x: auto; background: #202722; color: #f7f8f2; direction: ltr; text-align: left; }
    pre code { padding: 0; background: transparent; }
    .table-wrap { width: 100%; margin: 16px 0 24px; overflow-x: auto; border: 1px solid #cbd8d1; border-radius: 12px; background: #fff; -webkit-overflow-scrolling: touch; }
    .table-wrap:focus-visible { outline: 3px solid #2e6b58; outline-offset: 2px; }
    table { width: 100%; min-width: 660px; border-collapse: collapse; font-size: .93rem; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #dbe4df; vertical-align: top; text-align: right; }
    th { color: #fff; background: #285747; }
    tr:last-child td { border-bottom: 0; }
    hr { margin: 36px 0; border: 0; border-top: 1px solid #cbd4cf; }
    img { max-width: 100%; height: auto; }
    @media (min-width: 720px) {
      .hero { padding-block: 34px 28px; }
      main { padding-top: 28px; font-size: 1.08rem; }
      th, td { padding: 12px 14px; }
    }
    @media print {
      body { background: #fff; }
      .hero { color: #111; background: #fff; box-shadow: none; }
      .eyebrow, .day-nav { display: none; }
      .meta span { border-color: #777; background: transparent; }
      main { width: 100%; max-width: none; padding: 0; }
      h2 { break-after: avoid; background: #eee; }
      .table-wrap { overflow: visible; }
      table { min-width: 0; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <p class="eyebrow">התוכנית המעודכנת לצפייה</p>
      <h1>${escapeHtml(metadata.title)}</h1>
      <div class="meta">
        <span>גרסה: ${escapeHtml(metadata.planVersion)}</span>
        <span>עודכן: ${escapeHtml(metadata.updatedDate)}</span>
      </div>
      <nav class="day-nav" aria-label="ניווט בין ימי הטיול">
        ${navigation}
      </nav>
    </div>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>
`;
}

function parsePlan(): PlanFile {
  return JSON.parse(fs.readFileSync(planFile, "utf8")) as PlanFile;
}

function readDatabaseState(databaseFile: string): {
  planVersion: string;
  itineraryItems: number;
} {
  const database = new DatabaseSync(databaseFile, { readOnly: true });
  try {
    const trip = database.prepare(
      "SELECT metadata_json FROM trips WHERE id = ?",
    ).get(tripId) as { metadata_json?: string } | undefined;
    if (!trip?.metadata_json) throw new Error(`Trip ${tripId} is missing from SQLite.`);
    const metadata = JSON.parse(trip.metadata_json) as { planVersion?: unknown };
    const itinerary = database.prepare(
      "SELECT COUNT(*) AS count FROM itinerary_items WHERE trip_id = ?",
    ).get(tripId) as { count: number };
    return {
      planVersion: String(metadata.planVersion ?? ""),
      itineraryItems: Number(itinerary.count),
    };
  } finally {
    database.close();
  }
}

function assertSourcesAreSynchronized(
  markdownMetadata: PlanDocumentMetadata,
  plan: PlanFile,
  database: { planVersion: string; itineraryItems: number },
): void {
  const jsonVersion = String(plan.trip.metadata?.planVersion ?? "");
  const versions = new Set([
    markdownMetadata.planVersion,
    jsonVersion,
    database.planVersion,
  ]);
  if (versions.size !== 1 || !jsonVersion) {
    throw new Error(
      `Plan version mismatch: Markdown=${markdownMetadata.planVersion}, JSON=${jsonVersion || "missing"}, SQLite=${database.planVersion || "missing"}.`,
    );
  }

  if (plan.itinerary.length !== database.itineraryItems) {
    throw new Error(
      `Itinerary count mismatch: JSON=${plan.itinerary.length}, SQLite=${database.itineraryItems}.`,
    );
  }

  const itineraryDates = new Set(plan.itinerary.map((item) => item.dayDate));
  const planYear = Number(plan.trip.startDate.slice(0, 4));
  const markdownDates = new Set(markdownMetadata.days.map((entry) =>
    `${planYear}-${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`
  ));
  const missingDates = [...itineraryDates].filter((date) => !markdownDates.has(date));
  if (missingDates.length || itineraryDates.size !== markdownDates.size) {
    throw new Error(
      `Day mismatch between itinerary and Markdown. Missing in Markdown: ${missingDates.join(", ") || "none"}; JSON days=${itineraryDates.size}, Markdown days=${markdownDates.size}.`,
    );
  }
}

function writeFileAtomically(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(
    path.dirname(file),
    `.${path.basename(file)}.${process.pid}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, file);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

export function resolveDrivePlanDirectory(input: {
  cloudStorageRoot?: string;
  driveDirectory?: string;
} = {}): string {
  if (input.driveDirectory) {
    const explicit = path.resolve(input.driveDirectory);
    if (!fs.existsSync(explicit) || !fs.statSync(explicit).isDirectory()) {
      throw new Error(`Configured Google Drive directory does not exist: ${explicit}`);
    }
    return explicit;
  }

  const cloudStorageRoot = input.cloudStorageRoot
    ?? path.join(os.homedir(), "Library", "CloudStorage");
  if (!fs.existsSync(cloudStorageRoot)) {
    throw new Error(`Google Drive CloudStorage root does not exist: ${cloudStorageRoot}`);
  }

  const candidates = fs.readdirSync(cloudStorageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("GoogleDrive-"))
    .map((entry) => path.join(cloudStorageRoot, entry.name, driveRelativeDirectory))
    .filter((candidate) =>
      fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()
    );

  if (candidates.length === 0) {
    throw new Error(
      `No Google Drive destination found under ${cloudStorageRoot}/${driveRelativeDirectory}.`,
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple Google Drive destinations found; set TRAVEL_AGENT_DRIVE_PLAN_DIR explicitly: ${candidates.join(", ")}`,
    );
  }
  return candidates[0]!;
}

export function exportDolomitesPlanHtml(
  options: ExportPlanHtmlOptions = {},
): PlanHtmlExportResult {
  const markdownSource = fs.readFileSync(markdownFile, "utf8");
  const markdownMetadata = parsePlanDocumentMetadata(markdownSource);
  const plan = parsePlan();
  const database = readDatabaseState(dbPath());
  assertSourcesAreSynchronized(markdownMetadata, plan, database);

  const html = renderPlanHtml(markdownSource);
  const localFile = options.localOutputFile
    ? path.resolve(options.localOutputFile)
    : path.join(exportDirectory(), `${tripId}-plan.html`);
  const driveDirectory = resolveDrivePlanDirectory({
    cloudStorageRoot: options.cloudStorageRoot,
    driveDirectory: options.driveDirectory
      ?? process.env.TRAVEL_AGENT_DRIVE_PLAN_DIR,
  });
  const driveFile = path.join(driveDirectory, driveFileName);

  writeFileAtomically(localFile, html);
  writeFileAtomically(driveFile, html);

  const localContent = fs.readFileSync(localFile);
  const driveContent = fs.readFileSync(driveFile);
  if (!localContent.equals(driveContent)) {
    throw new Error("The Google Drive HTML does not match the local export.");
  }
  if (!driveContent.toString("utf8").includes(markdownMetadata.planVersion)) {
    throw new Error("The Google Drive HTML does not contain the current plan version.");
  }

  return {
    planVersion: markdownMetadata.planVersion,
    days: markdownMetadata.days.length,
    itineraryItems: plan.itinerary.length,
    localFile,
    driveFile,
    sha256: crypto.createHash("sha256").update(driveContent).digest("hex"),
  };
}
