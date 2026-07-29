import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import {
  getPlace,
  getTrip,
  listActions,
  listItinerary,
  listLodging,
  listPlaces,
  listTrips,
  recordAction,
  setPlaceStatus,
  upsertItineraryItem,
  upsertLodging,
  upsertPlace,
  upsertTrip,
} from "./db.js";
import { buildAirbnbSearchUrl, exportMyMapsCsv } from "./exports.js";
import { evaluateLodgingCandidate } from "./lodging-policy.js";
import {
  applyCalendarEvent,
  CALENDAR_POLICY_FILE,
  calendarAuthConfigured,
  deleteCalendarEvent,
  listCalendarEvents,
  previewCalendarEvent,
} from "./google-calendar.js";
import {
  probeTelegramConnection,
  previewTelegramPush,
  sendTelegramPush,
  telegramConfigured,
} from "./telegram.js";
import { validateTrip } from "./validate.js";

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

const config = loadConfig();
const mapsAuthMode = process.env.GOOGLE_MAPS_OAUTH_ACCESS_TOKEN
  ? "oauth_access_token"
  : (process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_GROUNDING_API_KEY)
    ? "api_key"
    : "none";
const server = new McpServer(
  { name: "travel-local", version: "0.1.0" },
  {
    instructions:
      "Local source of truth for travel planning. Read current trip state before external actions. " +
      "Store planning decisions locally, preview external writes, apply only under configured permissions, " +
      `read and follow ${CALENDAR_POLICY_FILE} before every Calendar command, ` +
      "and record external actions. Never store passwords, raw cookies, full card numbers, or CVV.",
  },
);

server.tool(
  "travel_health",
  "Check local travel store and connector readiness.",
  {},
  async () => result({
    ok: true,
    project: config.project.name,
    defaultTripId: config.project.default_trip_id,
    trips: listTrips().length,
    calendarAuthConfigured: calendarAuthConfigured(),
    telegramConfigured: telegramConfigured(),
    mapsAuthConfigured: mapsAuthMode !== "none",
    mapsAuthMode,
    browserProfileAccount: config.browser.profile_account_email,
    defaultTripPlaces: listPlaces({ tripId: config.project.default_trip_id, limit: 100000 }).length,
  }),
);

server.tool("travel_list_trips", "List local trips.", {}, async () => result(listTrips()));

server.tool(
  "travel_get_trip",
  "Get a trip and its aggregate state.",
  { tripId: z.string() },
  async ({ tripId }) => result({
    trip: getTrip(tripId),
    places: listPlaces({ tripId, limit: 100000 }),
    itinerary: listItinerary(tripId),
    lodging: listLodging(tripId),
    validation: validateTrip(tripId),
  }),
);

server.tool(
  "travel_upsert_trip",
  "Create or update a local trip.",
  {
    id: z.string(),
    name: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timezone: z.string().optional(),
    status: z.string().optional(),
    routeStrategy: z.string().optional(),
    summary: z.string().optional(),
    travelers: z.number().int().positive().optional(),
  },
  async (input) => result(upsertTrip(input)),
);

server.tool(
  "travel_list_places",
  "List/filter local places for a trip.",
  {
    tripId: z.string(),
    status: z.string().optional(),
    priority: z.string().optional(),
    query: z.string().optional(),
    limit: z.number().int().min(1).max(5000).optional(),
  },
  async (input) => result(listPlaces(input)),
);

server.tool(
  "travel_get_place",
  "Get one local place.",
  { placeId: z.string(), tripId: z.string().optional() },
  async ({ placeId, tripId }) => result(getPlace(placeId, tripId)),
);

server.tool(
  "travel_upsert_place",
  "Create or update a local place. Use after resolving with Google Maps.",
  {
    id: z.string().optional(),
    tripId: z.string(),
    googlePlaceId: z.string().optional(),
    name: z.string(),
    address: z.string().optional(),
    countryCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    googleMapsUrl: z.string().optional(),
    categories: z.array(z.string()).optional(),
    priority: z.string().optional(),
    planningStatus: z.string().optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    lastVerifiedAt: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  async (input) => result(upsertPlace(input)),
);

server.tool(
  "travel_set_place_status",
  "Update a place's priority, planning status, categories, or notes.",
  {
    placeId: z.string(),
    tripId: z.string(),
    planningStatus: z.string().optional(),
    priority: z.string().optional(),
    categories: z.array(z.string()).optional(),
    notes: z.string().optional(),
  },
  async ({ placeId, ...updates }) => result(setPlaceStatus({ id: placeId, ...updates })),
);

server.tool(
  "travel_list_itinerary",
  "List itinerary items, optionally for one day.",
  { tripId: z.string(), dayDate: z.string().optional() },
  async ({ tripId, dayDate }) => result(listItinerary(tripId, dayDate)),
);

server.tool(
  "travel_upsert_itinerary_item",
  "Create or update a local itinerary item before Calendar publication.",
  {
    id: z.string().optional(),
    tripId: z.string(),
    dayDate: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    title: z.string(),
    itemType: z.string().optional(),
    placeId: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    calendarEventId: z.string().optional(),
    sortOrder: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  async (input) => result(upsertItineraryItem(input)),
);

server.tool(
  "travel_validate_trip",
  "Validate unresolved places, itinerary descriptions, lunch windows, and overload.",
  { tripId: z.string() },
  async ({ tripId }) => result(validateTrip(tripId)),
);

server.tool(
  "travel_export_mymaps_csv",
  "Export trip places to a Google My Maps compatible CSV.",
  { tripId: z.string(), outputFile: z.string().optional() },
  async ({ tripId, outputFile }) => result(exportMyMapsCsv(tripId, outputFile)),
);

server.tool(
  "lodging_build_airbnb_search_url",
  "Build an Airbnb search URL for use in the signed-in Chrome profile.",
  {
    location: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    adults: z.number().int().positive().optional(),
  },
  async (input) => result({ url: buildAirbnbSearchUrl(input) }),
);

server.tool(
  "lodging_evaluate_candidate",
  "Apply the personal all-in ILS lodging budget and amenity gate before shortlisting.",
  {
    totalPriceIls: z.number().nonnegative(),
    nights: z.number().int().positive(),
    tier: z.enum(["simple", "standard", "pamper"]),
    rentalCarActive: z.boolean(),
    parkingVerified: z.boolean().optional(),
    parkingCostIls: z.number().nonnegative().optional(),
    towelsIncluded: z.boolean().optional(),
    linensIncluded: z.boolean().optional(),
    privateBathroom: z.boolean().optional(),
    cleanlinessVerified: z.boolean().optional(),
    allFeesKnown: z.boolean().optional(),
    cancellationTermsVerified: z.boolean().optional(),
    fullRefundCancellationHoursBeforeCheckIn: z.number().nonnegative().optional(),
    fullRefundIncludesFees: z.boolean().optional(),
    refundToOriginalPaymentMethod: z.boolean().optional(),
    spaAvailable: z.boolean().optional(),
    spaIncluded: z.boolean().optional(),
    spaExtraCostIls: z.number().nonnegative().optional(),
    spaPrivate: z.boolean().optional(),
  },
  async (input) => result(evaluateLodgingCandidate(input)),
);

server.tool(
  "lodging_upsert_candidate",
  "Create or update a lodging candidate in the local shortlist.",
  {
    id: z.string().optional(),
    tripId: z.string(),
    baseName: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    provider: z.string(),
    title: z.string(),
    url: z.string().optional(),
    totalPrice: z.number().optional(),
    currency: z.string().optional(),
    rating: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    parking: z.boolean().optional(),
    cancellation: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  },
  async (input) => result(upsertLodging(input)),
);

server.tool(
  "lodging_list_candidates",
  "List lodging candidates.",
  { tripId: z.string() },
  async ({ tripId }) => result(listLodging(tripId)),
);

server.tool(
  "travel_record_external_action",
  "Record a Google Maps, Chrome, Airbnb, Booking, or other external action.",
  {
    tripId: z.string().optional(),
    provider: z.string(),
    action: z.string(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    status: z.string(),
    dryRun: z.boolean().optional(),
    payload: z.record(z.unknown()).optional(),
    result: z.record(z.unknown()).optional(),
  },
  async (input) => result(recordAction(input)),
);

server.tool(
  "travel_get_audit_log",
  "Read recent external action records.",
  { tripId: z.string().optional(), limit: z.number().int().min(1).max(1000).optional() },
  async ({ tripId, limit }) => result(listActions(tripId, limit)),
);

server.tool(
  "calendar_list_events",
  `List events from the allowlisted Google Calendar. Read and follow ${CALENDAR_POLICY_FILE} before use; Calendar reads are the required preflight for create, update, and delete commands.`,
  {
    timeMin: z.string(),
    timeMax: z.string(),
    query: z.string().optional(),
  },
  async (input) => result(await listCalendarEvents(input)),
);

server.tool(
  "calendar_preview_event",
  `Preview a Google Calendar create/update payload without writing. Read and follow ${CALENDAR_POLICY_FILE} before use. Descriptions are normalized to canonical Apple Calendar-compatible plain text.`,
  {
    summary: z.string(),
    start: z.string(),
    end: z.string(),
    timezone: z.string().optional(),
    description: z.string().optional().describe(
      "Plain text only: use real line breaks, visible full URLs, and visible phone numbers; do not use HTML or Markdown.",
    ),
    location: z.string().optional(),
    itineraryItemId: z.string().optional(),
    eventId: z.string().optional(),
  },
  async (input) => result(previewCalendarEvent(input)),
);

server.tool(
  "calendar_apply_event",
  `Create or update an event in the allowlisted calendar. Read and follow ${CALENDAR_POLICY_FILE} before use. Update in place by Event ID, keep itinerary events only in חו״ל, remove the personal-calendar attendee, use sendUpdates=none, and verify the raw stored event after writing. Descriptions are canonical Apple Calendar-compatible plain text. confirm=true is required by policy.`,
  {
    summary: z.string(),
    start: z.string(),
    end: z.string(),
    timezone: z.string().optional(),
    description: z.string().optional().describe(
      "Plain text only: use real line breaks, visible full URLs, and visible phone numbers; do not use HTML or Markdown.",
    ),
    location: z.string().optional(),
    itineraryItemId: z.string().optional(),
    eventId: z.string().optional(),
    allowLodgingWriteAfterDedupe: z.boolean().optional().describe(
      "Use only after the user explicitly requests a manual lodging event and the matching confirmation email and Calendar range have been checked for duplicates.",
    ),
    tripId: z.string().optional(),
    confirm: z.boolean(),
  },
  async (input) => result(await applyCalendarEvent(input)),
);

server.tool(
  "calendar_delete_event",
  `Delete a non-protected event. Read and follow ${CALENDAR_POLICY_FILE} before use. Read the exact Event ID first, refuse protected flights, require target-specific confirmation for provider/lodging events, use sendUpdates=none, and verify absence after deletion. confirm=true is required by policy.`,
  {
    eventId: z.string(),
    tripId: z.string().optional(),
    confirm: z.boolean(),
  },
  async (input) => result(await deleteCalendarEvent(input)),
);

server.tool(
  "telegram_health",
  "Verify that the configured Telegram bot and destination chat are reachable. Makes read-only getMe and getChat requests and does not send a message.",
  {},
  async () => result(await probeTelegramConnection()),
);

server.tool(
  "telegram_preview_push",
  "Preview a relevant project notification before sending it to the configured Telegram chat. Use concise plain text and never include credentials, cookies, payment details, or raw private data.",
  {
    message: z.string().min(1).max(4096),
    title: z.string().min(1).max(160).optional(),
    silent: z.boolean().optional(),
    messageThreadId: z.number().int().positive().optional(),
  },
  async (input) => result(previewTelegramPush(input)),
);

server.tool(
  "telegram_send_push",
  "Send a relevant, concise project notification to the Telegram chat configured in TELEGRAM_CHAT_ID. Preview first. confirm=true is required. Never send credentials, cookies, payment details, or unreviewed private data.",
  {
    message: z.string().min(1).max(4096),
    title: z.string().min(1).max(160).optional(),
    silent: z.boolean().optional(),
    messageThreadId: z.number().int().positive().optional(),
    tripId: z.string().optional(),
    confirm: z.boolean(),
  },
  async ({ tripId, confirm, ...input }) => {
    if (!confirm) {
      throw new Error("telegram_send_push requires confirm=true after reviewing the preview.");
    }
    let sent: Awaited<ReturnType<typeof sendTelegramPush>>;
    try {
      sent = await sendTelegramPush(input);
    } catch (error) {
      try {
        recordAction({
          tripId,
          provider: "telegram",
          action: "send_push",
          entityType: "telegram_message",
          status: "failed",
          dryRun: false,
          payload: {
            characterCount: previewTelegramPush(input).characterCount,
            silent: input.silent ?? false,
            messageThreadId: input.messageThreadId,
          },
          result: {
            error: error instanceof Error ? error.message : "Unknown Telegram error",
          },
        });
      } catch {
        // Preserve the original Telegram failure even if the local audit write also fails.
      }
      throw error;
    }

    try {
      recordAction({
        tripId,
        provider: "telegram",
        action: "send_push",
        entityType: "telegram_message",
        entityId: sent.messageId?.toString(),
        status: "sent",
        dryRun: false,
        payload: {
          characterCount: sent.characterCount,
          silent: sent.silent,
          messageThreadId: sent.messageThreadId,
        },
        result: {
          messageId: sent.messageId,
          sentAt: sent.sentAt,
        },
      });
      return result({ ...sent, auditRecorded: true });
    } catch {
      // The push already succeeded. Report that accurately so a retry cannot duplicate it.
      return result({ ...sent, auditRecorded: false });
    }
  },
);

await server.connect(new StdioServerTransport());
