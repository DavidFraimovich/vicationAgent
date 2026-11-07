import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getTripContext, defaultTripId } from "./trips.js";
import { URL } from "node:url";
import { loadConfig } from "./config.js";
import {
  listActions,
  listItinerary,
  listLodging,
  listPlaces,
  listTrips,
  setPlaceStatus,
  upsertItineraryItem,
  upsertLodging,
  upsertPlace,
} from "./db.js";
import { projectRoot } from "./paths.js";
import { validateTrip } from "./validate.js";

const config = loadConfig();
const host = config.dashboard.host;
const port = config.dashboard.port;
const publicDir = path.join(projectRoot, "agent", "public");

function sendJson(res: http.ServerResponse, value: unknown, status = 200): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(value));
}

function sendFile(res: http.ServerResponse, file: string, type: string): void {
  res.statusCode = 200;
  res.setHeader("content-type", type);
  res.end(fs.readFileSync(file));
}

async function body(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createDashboardServer() {
return http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${host}:${port}`);

    if (req.method === "GET" && url.pathname === "/") {
      sendFile(res, path.join(publicDir, "index.html"), "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, { defaultTripId: defaultTripId() });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/trips") {
      sendJson(res, listTrips());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/places") {
      const tripId = url.searchParams.get("tripId") ?? defaultTripId();
      sendJson(res, listPlaces({
        tripId,
        status: url.searchParams.get("status") || undefined,
        priority: url.searchParams.get("priority") || undefined,
        query: url.searchParams.get("query") || undefined,
        limit: 10000,
      }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/itinerary") {
      const tripId = url.searchParams.get("tripId") ?? defaultTripId();
      sendJson(res, listItinerary(tripId, url.searchParams.get("dayDate") || undefined));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/lodging") {
      const tripId = url.searchParams.get("tripId") ?? defaultTripId();
      sendJson(res, listLodging(tripId));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/audit") {
      const tripId = url.searchParams.get("tripId") ?? defaultTripId();
      sendJson(res, listActions(tripId, 500));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/validation") {
      const tripId = url.searchParams.get("tripId") ?? defaultTripId();
      sendJson(res, validateTrip(tripId));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/place") {
      const input = await body(req); requireTrip(input);
      sendJson(res, upsertPlace(input));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/place/status") {
      const input = await body(req); requireTrip(input);
      sendJson(res, setPlaceStatus({
        id: input.placeId,
        tripId: input.tripId ?? defaultTripId(),
        ...input,
      }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/itinerary") {
      const input = await body(req); requireTrip(input);
      sendJson(res, upsertItineraryItem(input));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/lodging") {
      const input = await body(req); requireTrip(input);
      sendJson(res, upsertLodging(input));
      return;
    }

    sendJson(res, { error: "Not found" }, 404);
  } catch (error) {
    sendJson(res, { error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
}

function requireTrip(input: { tripId?: string }): void {
  if (!input.tripId) throw new Error("tripId is required for writes.");
  getTripContext(input.tripId);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const server = createDashboardServer();
server.listen(port, host, () => {
  console.log(`Travel dashboard: http://${host}:${port}`);
});

}
