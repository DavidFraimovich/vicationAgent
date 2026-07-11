import { getTrip, listItinerary, listPlaces } from "./db.js";
function minutes(time) {
    if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time))
        return undefined;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
function dateRange(startDate, endDate) {
    const dates = [];
    const cursor = new Date(`${startDate}T12:00:00Z`);
    const end = new Date(`${endDate}T12:00:00Z`);
    while (cursor <= end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
}
export function validateTrip(tripId) {
    const trip = getTrip(tripId);
    if (!trip)
        throw new Error(`Trip not found: ${tripId}`);
    const places = listPlaces({ tripId, limit: 100000 });
    const items = listItinerary(tripId);
    const issues = [];
    for (const place of places) {
        if (!place.googleMapsUrl && !place.googlePlaceId) {
            issues.push({
                severity: "warning",
                code: "PLACE_UNRESOLVED",
                message: `Place lacks a Google Maps URL or Place ID: ${place.name}`,
                entityId: place.id,
            });
        }
        if ((place.planningStatus === "calendar_anchor" || place.planningStatus === "scheduled")
            && !place.latitude && !place.googleMapsUrl) {
            issues.push({
                severity: "error",
                code: "ANCHOR_WITHOUT_LOCATION",
                message: `Calendar anchor has no usable location: ${place.name}`,
                entityId: place.id,
            });
        }
    }
    const byDay = new Map();
    for (const item of items) {
        const list = byDay.get(item.dayDate) ?? [];
        list.push(item);
        byDay.set(item.dayDate, list);
        if (!item.description && item.itemType !== "flight") {
            issues.push({
                severity: "warning",
                code: "EMPTY_DESCRIPTION",
                message: `Itinerary item has no description: ${item.title}`,
                entityId: item.id,
            });
        }
        if (typeof trip.startDate === "string" && typeof trip.endDate === "string"
            && (String(item.dayDate) < trip.startDate || String(item.dayDate) > trip.endDate)) {
            issues.push({
                severity: "error",
                code: "ITEM_OUTSIDE_TRIP_RANGE",
                message: `${item.title} is scheduled outside the trip date range.`,
                entityId: item.id,
            });
        }
        const start = minutes(item.startTime);
        const end = minutes(item.endTime);
        if (start !== undefined && end !== undefined && end <= start) {
            issues.push({
                severity: "error",
                code: "INVALID_TIME_RANGE",
                message: `${item.title} ends at or before its start time.`,
                entityId: item.id,
            });
        }
    }
    if (typeof trip.startDate === "string" && typeof trip.endDate === "string") {
        for (const day of dateRange(trip.startDate, trip.endDate)) {
            if (!byDay.has(day)) {
                issues.push({
                    severity: "error",
                    code: "UNPLANNED_TRIP_DAY",
                    message: `${day} has no itinerary items.`,
                });
            }
        }
    }
    for (const [day, dayItems] of byDay.entries()) {
        const timedItems = dayItems
            .filter((item) => minutes(item.startTime) !== undefined && minutes(item.endTime) !== undefined)
            .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
        for (let index = 1; index < timedItems.length; index += 1) {
            const previous = timedItems[index - 1];
            const current = timedItems[index];
            const lunchOverlap = previous.itemType === "lunch" || current.itemType === "lunch";
            if (!lunchOverlap && minutes(current.startTime) < minutes(previous.endTime)) {
                issues.push({
                    severity: "error",
                    code: "OVERLAPPING_ITEMS",
                    message: `${day} overlaps: ${previous.title} and ${current.title}.`,
                    entityId: current.id,
                });
            }
        }
        const walkingAnchors = dayItems.filter((item) => ["nature", "hike", "mountain"].includes(String(item.itemType)));
        if (walkingAnchors.length > 2) {
            issues.push({
                severity: "warning",
                code: "OVERLOADED_NATURE_DAY",
                message: `${day} has ${walkingAnchors.length} nature/hike anchors.`,
            });
        }
        const lunch = dayItems.find((item) => String(item.title).toLowerCase().includes("lunch") ||
            String(item.itemType).toLowerCase() === "lunch");
        if (lunch) {
            const start = minutes(lunch.startTime);
            if (start !== undefined && (start < 12 * 60 || start > 14 * 60 + 30)) {
                issues.push({
                    severity: "warning",
                    code: "LUNCH_OUTSIDE_WINDOW",
                    message: `${day} lunch begins at ${lunch.startTime}, outside 12:00–14:30.`,
                    entityId: lunch.id,
                });
            }
        }
        else if (day !== trip.startDate && day !== trip.endDate) {
            issues.push({
                severity: "warning",
                code: "MISSING_LUNCH_ANCHOR",
                message: `${day} has no explicit lunch anchor.`,
            });
        }
    }
    return {
        tripId,
        ok: !issues.some((issue) => issue.severity === "error"),
        issues,
        summary: {
            places: places.length,
            unresolvedPlaces: issues.filter((issue) => issue.code === "PLACE_UNRESOLVED").length,
            itineraryItems: items.length,
            daysPlanned: byDay.size,
            tripDays: typeof trip.startDate === "string" && typeof trip.endDate === "string"
                ? dateRange(trip.startDate, trip.endDate).length
                : null,
            errors: issues.filter((issue) => issue.severity === "error").length,
            warnings: issues.filter((issue) => issue.severity === "warning").length,
        },
    };
}
