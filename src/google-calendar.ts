import fs from "node:fs";
import { google, calendar_v3 } from "googleapis";
import { loadConfig } from "./config.js";
import { getItineraryItem, recordAction, upsertItineraryItem } from "./db.js";
import { resolveProjectPath } from "./paths.js";

function loadOAuthClient(): any {
  const config = loadConfig();
  const clientFile = resolveProjectPath(config.calendar.oauth_client_path);
  if (!fs.existsSync(clientFile)) {
    throw new Error(
      `OAuth client file not found: ${clientFile}. See secrets/README.md`
    );
  }
  const parsed = JSON.parse(fs.readFileSync(clientFile, "utf8"));
  return parsed.installed ?? parsed.web ?? parsed;
}

export function calendarAuthConfigured(): boolean {
  const config = loadConfig();
  return fs.existsSync(resolveProjectPath(config.calendar.oauth_client_path))
    && fs.existsSync(resolveProjectPath(config.calendar.oauth_token_path));
}

export function getCalendarClient(): calendar_v3.Calendar {
  const config = loadConfig();
  const client = loadOAuthClient();
  const redirectUri =
    client.redirect_uris?.find((uri: string) => uri.includes("127.0.0.1")) ??
    "http://127.0.0.1:53682/oauth2callback";
  const oauth2 = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);
  const tokenFile = resolveProjectPath(config.calendar.oauth_token_path);
  if (!fs.existsSync(tokenFile)) {
    throw new Error(`OAuth token not found. Run: npm run google:auth`);
  }
  oauth2.setCredentials(JSON.parse(fs.readFileSync(tokenFile, "utf8")));
  return google.calendar({ version: "v3", auth: oauth2 });
}

function configuredCalendarId(): string {
  return loadConfig().calendar.calendar_id;
}

function isProtectedEvent(event: calendar_v3.Schema$Event): boolean {
  const config = loadConfig();
  const start = event.start?.dateTime ?? event.start?.date ?? "";
  const title = event.summary ?? "";
  return config.calendar.protected_events.some(
    (rule) => title.includes(rule.title_contains) && start.startsWith(rule.date)
  );
}

export async function listCalendarEvents(input: {
  timeMin: string;
  timeMax: string;
  query?: string;
}): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendarClient();
  const response = await calendar.events.list({
    calendarId: configuredCalendarId(),
    timeMin: input.timeMin,
    timeMax: input.timeMax,
    q: input.query,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });
  return response.data.items ?? [];
}

export type CalendarEventInput = {
  summary: string;
  start: string;
  end: string;
  timezone?: string;
  description?: string;
  location?: string;
  itineraryItemId?: string;
  eventId?: string;
};

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
  };
  return value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, key: string) => {
      if (key.startsWith("#x") || key.startsWith("#X")) {
        const codePoint = Number.parseInt(key.slice(2), 16);
        return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
      }
      if (key.startsWith("#")) {
        const codePoint = Number.parseInt(key.slice(1), 10);
        return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
      }
      return named[key.toLowerCase()] ?? entity;
    },
  );
}

function anchorAsPlainText(_match: string, attributes: string, content: string): string {
  const hrefMatch = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = decodeHtmlEntities(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "").trim();
  const label = decodeHtmlEntities(content.replace(/<[^>]+>/g, "")).trim();
  const isTelephone = /^tel:/i.test(href);
  const visibleTarget = isTelephone
    ? href.slice(4)
    : /^mailto:/i.test(href)
      ? href.slice(7)
      : /^https?:\/\//i.test(href)
        ? href
        : "";

  if (!visibleTarget) return label;
  if (!label || label === visibleTarget) return visibleTarget;
  if (isTelephone && label.replace(/\D/g, "") === visibleTarget.replace(/\D/g, "")) return label;
  return `${label}\n${visibleTarget}`;
}

export function normalizeCalendarDescription(description?: string): string | undefined {
  if (description === undefined) return undefined;

  return decodeHtmlEntities(
    description
      .replace(/\r\n?/g, "\n")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
      .replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, anchorAsPlainText)
      .replace(/<br\b[^>]*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<\/(?:li|tr)\s*>/gi, "\n")
      .replace(/<\/(?:div|h[1-6]|ol|p|table|ul)\s*>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function previewCalendarEvent(input: CalendarEventInput): Record<string, unknown> {
  const config = loadConfig();
  return {
    calendarId: config.calendar.calendar_id,
    action: input.eventId ? "update" : "create",
    eventId: input.eventId,
    event: {
      summary: input.summary,
      start: { dateTime: input.start, timeZone: input.timezone ?? config.calendar.trip_timezone },
      end: { dateTime: input.end, timeZone: input.timezone ?? config.calendar.trip_timezone },
      description: normalizeCalendarDescription(input.description),
      location: input.location,
      extendedProperties: {
        private: {
          travelAgent: "codex-travel-agent-local",
          itineraryItemId: input.itineraryItemId ?? "",
        },
      },
    },
  };
}

export async function applyCalendarEvent(input: CalendarEventInput & {
  confirm: boolean;
  tripId?: string;
}): Promise<Record<string, unknown>> {
  const config = loadConfig();
  const preview = previewCalendarEvent(input);
  if (config.calendar.require_confirmation_for_write && !input.confirm) {
    recordAction({
      tripId: input.tripId,
      provider: "google_calendar",
      action: input.eventId ? "update_event" : "create_event",
      entityType: "itinerary_item",
      entityId: input.itineraryItemId,
      status: "preview",
      dryRun: true,
      payload: preview,
    });
    return { applied: false, reason: "confirm_required", preview };
  }

  const calendar = getCalendarClient();
  const requestBody = (preview.event ?? {}) as calendar_v3.Schema$Event;
  const response = input.eventId
    ? await calendar.events.update({
        calendarId: configuredCalendarId(),
        eventId: input.eventId,
        requestBody,
        sendUpdates: "none",
      })
    : await calendar.events.insert({
        calendarId: configuredCalendarId(),
        requestBody,
        sendUpdates: "none",
      });

  if (input.itineraryItemId) {
    const existing = getItineraryItem(input.itineraryItemId);
    if (existing) {
      upsertItineraryItem({
        id: existing.id as string,
        tripId: existing.tripId as string,
        dayDate: existing.dayDate as string,
        startTime: existing.startTime as string | undefined,
        endTime: existing.endTime as string | undefined,
        title: existing.title as string,
        itemType: existing.itemType as string,
        placeId: existing.placeId as string | undefined,
        description: existing.description as string | undefined,
        status: "scheduled",
        source: existing.source as string | undefined,
        calendarEventId: response.data.id ?? undefined,
        sortOrder: existing.sortOrder as number,
        metadata: existing.metadata as Record<string, unknown>,
      });
    }
  }

  const result = {
    applied: true,
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    summary: response.data.summary,
  };
  recordAction({
    tripId: input.tripId,
    provider: "google_calendar",
    action: input.eventId ? "update_event" : "create_event",
    entityType: "itinerary_item",
    entityId: input.itineraryItemId,
    status: "success",
    dryRun: false,
    payload: preview,
    result,
  });
  return result;
}

export async function deleteCalendarEvent(input: {
  eventId: string;
  confirm: boolean;
  tripId?: string;
}): Promise<Record<string, unknown>> {
  const config = loadConfig();
  const calendar = getCalendarClient();
  const existing = await calendar.events.get({
    calendarId: configuredCalendarId(),
    eventId: input.eventId,
  });

  if (isProtectedEvent(existing.data)) {
    throw new Error("Refusing to delete a protected flight event.");
  }

  const preview = {
    calendarId: configuredCalendarId(),
    action: "delete",
    eventId: input.eventId,
    summary: existing.data.summary,
    start: existing.data.start,
  };

  if (config.calendar.require_confirmation_for_delete && !input.confirm) {
    recordAction({
      tripId: input.tripId,
      provider: "google_calendar",
      action: "delete_event",
      entityType: "calendar_event",
      entityId: input.eventId,
      status: "preview",
      dryRun: true,
      payload: preview,
    });
    return { applied: false, reason: "confirm_required", preview };
  }

  await calendar.events.delete({
    calendarId: configuredCalendarId(),
    eventId: input.eventId,
    sendUpdates: "none",
  });
  recordAction({
    tripId: input.tripId,
    provider: "google_calendar",
    action: "delete_event",
    entityType: "calendar_event",
    entityId: input.eventId,
    status: "success",
    dryRun: false,
    payload: preview,
  });
  return { applied: true, eventId: input.eventId };
}
