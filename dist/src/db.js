import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dbPath } from "./config.js";
import { ensureParent } from "./paths.js";
let singleton;
function now() {
    return new Date().toISOString();
}
function json(value) {
    return JSON.stringify(value ?? null);
}
function parseJson(value, fallback) {
    if (typeof value !== "string" || value.length === 0)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
export function getDb() {
    if (singleton)
        return singleton;
    const file = dbPath();
    ensureParent(file);
    singleton = new DatabaseSync(file);
    singleton.exec("PRAGMA foreign_keys = ON;");
    singleton.exec("PRAGMA journal_mode = WAL;");
    migrate(singleton);
    return singleton;
}
export function closeDb() {
    singleton?.close();
    singleton = undefined;
}
export function migrate(db = getDb()) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
      status TEXT NOT NULL DEFAULT 'planning',
      route_strategy TEXT,
      summary TEXT,
      travelers INTEGER NOT NULL DEFAULT 2,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      source_id TEXT,
      google_place_id TEXT,
      name TEXT NOT NULL,
      address TEXT,
      country_code TEXT,
      latitude REAL,
      longitude REAL,
      google_maps_url TEXT,
      categories_json TEXT NOT NULL DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'C',
      planning_status TEXT NOT NULL DEFAULT 'discovered',
      notes TEXT,
      source TEXT,
      last_verified_at TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_places_trip ON places(trip_id);
    CREATE INDEX IF NOT EXISTS idx_places_status ON places(trip_id, planning_status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_places_trip_url
      ON places(trip_id, google_maps_url)
      WHERE google_maps_url IS NOT NULL AND google_maps_url <> '';

    CREATE TABLE IF NOT EXISTS trip_places (
      trip_id TEXT NOT NULL,
      place_id TEXT NOT NULL,
      categories_json TEXT NOT NULL DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'C',
      planning_status TEXT NOT NULL DEFAULT 'discovered',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (trip_id, place_id),
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_trip_places_status
      ON trip_places(trip_id, planning_status, priority);

    CREATE TABLE IF NOT EXISTS itinerary_items (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      day_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      title TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'activity',
      place_id TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      source TEXT,
      calendar_event_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_itinerary_trip_day
      ON itinerary_items(trip_id, day_date, sort_order);

    CREATE TABLE IF NOT EXISTS lodging_candidates (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      base_name TEXT,
      check_in TEXT,
      check_out TEXT,
      provider TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      total_price REAL,
      currency TEXT,
      rating REAL,
      latitude REAL,
      longitude REAL,
      parking INTEGER,
      cancellation TEXT,
      status TEXT NOT NULL DEFAULT 'candidate',
      notes TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lodging_trip
      ON lodging_candidates(trip_id, base_name, status);

    CREATE TABLE IF NOT EXISTS external_actions (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      provider TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      status TEXT NOT NULL,
      dry_run INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL DEFAULT '{}',
      result_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_actions_trip
      ON external_actions(trip_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_runs (
      id TEXT PRIMARY KEY,
      source_file TEXT NOT NULL,
      source_type TEXT NOT NULL,
      trip_id TEXT,
      imported_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      errors_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);
}
export function upsertTrip(input) {
    const db = getDb();
    const t = now();
    db.prepare(`
    INSERT INTO trips (
      id, name, start_date, end_date, timezone, status, route_strategy,
      summary, travelers, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      start_date=excluded.start_date,
      end_date=excluded.end_date,
      timezone=excluded.timezone,
      status=excluded.status,
      route_strategy=excluded.route_strategy,
      summary=excluded.summary,
      travelers=excluded.travelers,
      metadata_json=excluded.metadata_json,
      updated_at=excluded.updated_at
  `).run(input.id, input.name, input.startDate ?? null, input.endDate ?? null, input.timezone ?? "Europe/Rome", input.status ?? "planning", input.routeStrategy ?? null, input.summary ?? null, input.travelers ?? 2, json(input.metadata ?? {}), t, t);
    return getTrip(input.id);
}
function normalizeTrip(row) {
    return {
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        timezone: row.timezone,
        status: row.status,
        routeStrategy: row.route_strategy,
        summary: row.summary,
        travelers: row.travelers,
        metadata: parseJson(row.metadata_json, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function listTrips() {
    return getDb().prepare("SELECT * FROM trips ORDER BY start_date, name").all().map(normalizeTrip);
}
export function getTrip(id) {
    const row = getDb().prepare("SELECT * FROM trips WHERE id = ?").get(id);
    return row ? normalizeTrip(row) : undefined;
}
export function findPlaceByUrl(tripId, url) {
    if (!url)
        return undefined;
    const row = getDb().prepare("SELECT * FROM places WHERE google_maps_url = ? LIMIT 1").get(url);
    return row ? normalizePlace(row) : undefined;
}
export function upsertPlace(input) {
    const db = getDb();
    const existingByUrl = input.id ? undefined : findPlaceByUrl(input.tripId, input.googleMapsUrl);
    const id = input.id ?? existingByUrl?.id ?? randomUUID();
    const t = now();
    db.prepare(`
    INSERT INTO places (
      id, trip_id, source_id, google_place_id, name, address, country_code,
      latitude, longitude, google_maps_url, categories_json, priority,
      planning_status, notes, source, last_verified_at, metadata_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source_id=COALESCE(excluded.source_id, places.source_id),
      google_place_id=COALESCE(excluded.google_place_id, places.google_place_id),
      name=excluded.name,
      address=COALESCE(excluded.address, places.address),
      country_code=COALESCE(excluded.country_code, places.country_code),
      latitude=COALESCE(excluded.latitude, places.latitude),
      longitude=COALESCE(excluded.longitude, places.longitude),
      google_maps_url=COALESCE(excluded.google_maps_url, places.google_maps_url),
      categories_json=excluded.categories_json,
      priority=excluded.priority,
      planning_status=excluded.planning_status,
      notes=COALESCE(excluded.notes, places.notes),
      source=COALESCE(excluded.source, places.source),
      last_verified_at=COALESCE(excluded.last_verified_at, places.last_verified_at),
      metadata_json=excluded.metadata_json,
      updated_at=excluded.updated_at
  `).run(id, input.tripId, input.sourceId ?? null, input.googlePlaceId ?? null, input.name, input.address ?? null, input.countryCode ?? null, input.latitude ?? null, input.longitude ?? null, input.googleMapsUrl ?? null, json(input.categories ?? []), input.priority ?? existingByUrl?.priority ?? "C", input.planningStatus ?? existingByUrl?.planningStatus ?? "discovered", input.notes ?? null, input.source ?? null, input.lastVerifiedAt ?? null, json(input.metadata ?? existingByUrl?.metadata ?? {}), t, t);
    if (input.linkToTrip !== false) {
        db.prepare(`
      INSERT INTO trip_places (
        trip_id, place_id, categories_json, priority, planning_status,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(trip_id, place_id) DO UPDATE SET
        categories_json=excluded.categories_json,
        priority=excluded.priority,
        planning_status=excluded.planning_status,
        notes=COALESCE(excluded.notes, trip_places.notes),
        updated_at=excluded.updated_at
    `).run(input.tripId, id, json(input.categories ?? existingByUrl?.categories ?? []), input.priority ?? existingByUrl?.priority ?? "C", input.planningStatus ?? existingByUrl?.planningStatus ?? "discovered", input.notes ?? null, t, t);
    }
    return getPlace(id, input.tripId) ?? getPlace(id);
}
function normalizePlace(row) {
    return {
        id: row.id,
        tripId: row.linked_trip_id ?? row.trip_id,
        sourceId: row.source_id,
        googlePlaceId: row.google_place_id,
        name: row.name,
        address: row.address,
        countryCode: row.country_code,
        latitude: row.latitude,
        longitude: row.longitude,
        googleMapsUrl: row.google_maps_url,
        categories: parseJson(row.trip_categories_json ?? row.categories_json, []),
        priority: row.trip_priority ?? row.priority,
        planningStatus: row.trip_planning_status ?? row.planning_status,
        notes: row.trip_notes ?? row.notes,
        source: row.source,
        lastVerifiedAt: row.last_verified_at,
        metadata: parseJson(row.metadata_json, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function getPlace(id, tripId) {
    const row = tripId
        ? getDb().prepare(`
        SELECT p.*, tp.trip_id AS linked_trip_id,
          tp.categories_json AS trip_categories_json,
          tp.priority AS trip_priority,
          tp.planning_status AS trip_planning_status,
          tp.notes AS trip_notes
        FROM places p
        JOIN trip_places tp ON tp.place_id = p.id
        WHERE p.id = ? AND tp.trip_id = ?
      `).get(id, tripId)
        : getDb().prepare("SELECT * FROM places WHERE id = ?").get(id);
    return row ? normalizePlace(row) : undefined;
}
export function listPlaces(input) {
    const clauses = ["tp.trip_id = ?"];
    const params = [input.tripId];
    if (input.status) {
        clauses.push("tp.planning_status = ?");
        params.push(input.status);
    }
    if (input.priority) {
        clauses.push("tp.priority = ?");
        params.push(input.priority);
    }
    if (input.query) {
        clauses.push("(p.name LIKE ? OR p.address LIKE ? OR tp.notes LIKE ?)");
        const q = `%${input.query}%`;
        params.push(q, q, q);
    }
    params.push(input.limit ?? 500, input.offset ?? 0);
    const rows = getDb().prepare(`
    SELECT p.*, tp.trip_id AS linked_trip_id,
      tp.categories_json AS trip_categories_json,
      tp.priority AS trip_priority,
      tp.planning_status AS trip_planning_status,
      tp.notes AS trip_notes
    FROM places p
    JOIN trip_places tp ON tp.place_id = p.id
    WHERE ${clauses.join(" AND ")}
    ORDER BY
      CASE tp.priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3
        WHEN 'Conditional' THEN 4 ELSE 5 END,
      p.name
    LIMIT ? OFFSET ?
  `).all(...params);
    return rows.map(normalizePlace);
}
export function setPlaceStatus(input) {
    const current = getPlace(input.id, input.tripId);
    if (!current)
        throw new Error(`Place not found: ${input.id}`);
    getDb().prepare(`
    UPDATE trip_places SET
      categories_json = ?, priority = ?, planning_status = ?, notes = ?, updated_at = ?
    WHERE trip_id = ? AND place_id = ?
  `).run(json(input.categories ?? current.categories), input.priority ?? current.priority, input.planningStatus ?? current.planningStatus, input.notes ?? current.notes ?? null, now(), input.tripId, input.id);
    return getPlace(input.id, input.tripId);
}
export function upsertItineraryItem(input) {
    const db = getDb();
    const id = input.id ?? randomUUID();
    const t = now();
    db.prepare(`
    INSERT INTO itinerary_items (
      id, trip_id, day_date, start_time, end_time, title, item_type,
      place_id, description, status, source, calendar_event_id, sort_order,
      metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      day_date=excluded.day_date,
      start_time=excluded.start_time,
      end_time=excluded.end_time,
      title=excluded.title,
      item_type=excluded.item_type,
      place_id=excluded.place_id,
      description=excluded.description,
      status=excluded.status,
      source=excluded.source,
      calendar_event_id=excluded.calendar_event_id,
      sort_order=excluded.sort_order,
      metadata_json=excluded.metadata_json,
      updated_at=excluded.updated_at
  `).run(id, input.tripId, input.dayDate, input.startTime ?? null, input.endTime ?? null, input.title, input.itemType ?? "activity", input.placeId ?? null, input.description ?? null, input.status ?? "draft", input.source ?? null, input.calendarEventId ?? null, input.sortOrder ?? 0, json(input.metadata ?? {}), t, t);
    return getItineraryItem(id);
}
function normalizeItinerary(row) {
    return {
        id: row.id,
        tripId: row.trip_id,
        dayDate: row.day_date,
        startTime: row.start_time,
        endTime: row.end_time,
        title: row.title,
        itemType: row.item_type,
        placeId: row.place_id,
        description: row.description,
        status: row.status,
        source: row.source,
        calendarEventId: row.calendar_event_id,
        sortOrder: row.sort_order,
        metadata: parseJson(row.metadata_json, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function getItineraryItem(id) {
    const row = getDb().prepare("SELECT * FROM itinerary_items WHERE id = ?").get(id);
    return row ? normalizeItinerary(row) : undefined;
}
export function listItinerary(tripId, dayDate) {
    const rows = dayDate
        ? getDb().prepare(`
        SELECT * FROM itinerary_items
        WHERE trip_id = ? AND day_date = ?
        ORDER BY COALESCE(start_time, '99:99'), sort_order, title
      `).all(tripId, dayDate)
        : getDb().prepare(`
        SELECT * FROM itinerary_items
        WHERE trip_id = ?
        ORDER BY day_date, COALESCE(start_time, '99:99'), sort_order, title
      `).all(tripId);
    return rows.map(normalizeItinerary);
}
export function deleteItineraryItem(id) {
    getDb().prepare("DELETE FROM itinerary_items WHERE id = ?").run(id);
}
export function upsertLodging(input) {
    const db = getDb();
    const id = input.id ?? randomUUID();
    const t = now();
    db.prepare(`
    INSERT INTO lodging_candidates (
      id, trip_id, base_name, check_in, check_out, provider, title, url,
      total_price, currency, rating, latitude, longitude, parking,
      cancellation, status, notes, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      base_name=excluded.base_name,
      check_in=excluded.check_in,
      check_out=excluded.check_out,
      provider=excluded.provider,
      title=excluded.title,
      url=excluded.url,
      total_price=excluded.total_price,
      currency=excluded.currency,
      rating=excluded.rating,
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      parking=excluded.parking,
      cancellation=excluded.cancellation,
      status=excluded.status,
      notes=excluded.notes,
      metadata_json=excluded.metadata_json,
      updated_at=excluded.updated_at
  `).run(id, input.tripId, input.baseName ?? null, input.checkIn ?? null, input.checkOut ?? null, input.provider, input.title, input.url ?? null, input.totalPrice ?? null, input.currency ?? null, input.rating ?? null, input.latitude ?? null, input.longitude ?? null, input.parking === undefined ? null : Number(input.parking), input.cancellation ?? null, input.status ?? "candidate", input.notes ?? null, json(input.metadata ?? {}), t, t);
    return getLodging(id);
}
function normalizeLodging(row) {
    return {
        id: row.id,
        tripId: row.trip_id,
        baseName: row.base_name,
        checkIn: row.check_in,
        checkOut: row.check_out,
        provider: row.provider,
        title: row.title,
        url: row.url,
        totalPrice: row.total_price,
        currency: row.currency,
        rating: row.rating,
        latitude: row.latitude,
        longitude: row.longitude,
        parking: row.parking === null ? null : Boolean(row.parking),
        cancellation: row.cancellation,
        status: row.status,
        notes: row.notes,
        metadata: parseJson(row.metadata_json, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function getLodging(id) {
    const row = getDb().prepare("SELECT * FROM lodging_candidates WHERE id = ?").get(id);
    return row ? normalizeLodging(row) : undefined;
}
export function listLodging(tripId) {
    return getDb().prepare(`
    SELECT * FROM lodging_candidates
    WHERE trip_id = ?
    ORDER BY base_name, status, total_price
  `).all(tripId).map(normalizeLodging);
}
export function recordAction(input) {
    const id = randomUUID();
    const createdAt = now();
    getDb().prepare(`
    INSERT INTO external_actions (
      id, trip_id, provider, action, entity_type, entity_id,
      status, dry_run, payload_json, result_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.tripId ?? null, input.provider, input.action, input.entityType ?? null, input.entityId ?? null, input.status, Number(input.dryRun ?? true), json(input.payload ?? {}), json(input.result ?? {}), createdAt);
    return {
        id, tripId: input.tripId, provider: input.provider, action: input.action,
        entityType: input.entityType, entityId: input.entityId, status: input.status,
        dryRun: input.dryRun ?? true, payload: input.payload ?? {},
        result: input.result ?? {}, createdAt,
    };
}
export function listActions(tripId, limit = 200) {
    const rows = tripId
        ? getDb().prepare(`
        SELECT * FROM external_actions
        WHERE trip_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(tripId, limit)
        : getDb().prepare(`
        SELECT * FROM external_actions
        ORDER BY created_at DESC LIMIT ?
      `).all(limit);
    return rows.map((row) => ({
        id: row.id,
        tripId: row.trip_id,
        provider: row.provider,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        status: row.status,
        dryRun: Boolean(row.dry_run),
        payload: parseJson(row.payload_json, {}),
        result: parseJson(row.result_json, {}),
        createdAt: row.created_at,
    }));
}
export function setSetting(key, value) {
    getDb().prepare(`
    INSERT INTO settings(key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json=excluded.value_json,
      updated_at=excluded.updated_at
  `).run(key, json(value), now());
}
export function getSetting(key, fallback) {
    const row = getDb().prepare("SELECT value_json FROM settings WHERE key = ?").get(key);
    return row ? parseJson(row.value_json, fallback) : fallback;
}
export function recordImportRun(input) {
    getDb().prepare(`
    INSERT INTO import_runs(
      id, source_file, source_type, trip_id, imported_count,
      skipped_count, errors_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), input.sourceFile, input.sourceType, input.tripId ?? null, input.importedCount, input.skippedCount, json(input.errors), now());
}
export function dbFileExists() {
    return fs.existsSync(dbPath());
}
export function copyDatabase(destination) {
    const source = dbPath();
    if (!fs.existsSync(source))
        throw new Error(`Database does not exist: ${source}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}
