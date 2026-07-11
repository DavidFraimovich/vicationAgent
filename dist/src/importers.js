import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { recordImportRun, upsertPlace } from "./db.js";
function stableId(parts) {
    return createHash("sha256")
        .update(parts.filter(Boolean).join("|"))
        .digest("hex")
        .slice(0, 32);
}
const categoryRules = {
    food: ["restaurant", "trattoria", "osteria", "cafe", "caffè", "bakery", "gelato", "bar", "bistro", "market", "hütte", "rifugio", "alm"],
    meat: ["steak", "grill", "burger", "bbq", "smoke", "meat", "macelleria", "salumificio"],
    viewpoint: ["viewpoint", "lookout", "mirador", "panorama", "passo", "belvedere", "tower", "sunset", "terrace"],
    nature: ["lago", "lake", "valley", "waterfall", "gorge", "cave", "trail", "dolomites", "meadow", "park", "mountain"],
    activity: ["museum", "boat", "cable car", "spa", "experience", "tour", "attraction", "cinema"],
    logistics: ["airport", "hostel", "hotel", "parking", "station", "terminal", "lockers", "rental", "road"],
};
export function classifyPlace(name, address = "") {
    const haystack = `${name} ${address}`.toLocaleLowerCase();
    const categories = Object.entries(categoryRules)
        .filter(([, words]) => words.some((word) => haystack.includes(word)))
        .map(([category]) => category);
    return categories.length ? categories : ["uncategorized"];
}
export function importSavedPlaces(file, tripId) {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const features = parsed.features ?? [];
    let imported = 0;
    let skipped = 0;
    const errors = [];
    for (const [index, feature] of features.entries()) {
        try {
            const properties = feature?.properties ?? {};
            const location = properties.location ?? {};
            const coordinates = feature?.geometry?.coordinates ?? [];
            const url = properties.google_maps_url;
            const name = location.name ??
                (properties.Comment ? `Unresolved saved place ${index + 1}` : undefined);
            if (!name && !url) {
                skipped += 1;
                continue;
            }
            const lng = Number(coordinates[0]);
            const lat = Number(coordinates[1]);
            const validCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
            upsertPlace({
                id: stableId([tripId, url, name]),
                tripId,
                sourceId: properties.date,
                name: name ?? "Unnamed saved place",
                address: location.address,
                countryCode: location.country_code,
                latitude: validCoordinates ? lat : null,
                longitude: validCoordinates ? lng : null,
                googleMapsUrl: url,
                categories: classifyPlace(name ?? "", location.address ?? ""),
                priority: "C",
                planningStatus: "discovered",
                notes: properties.Comment,
                source: "google_takeout_saved_places",
                metadata: {
                    savedAt: properties.date,
                    unresolvedCoordinates: !validCoordinates,
                    originalProperties: properties,
                },
            });
            imported += 1;
        }
        catch (error) {
            errors.push(`Feature ${index}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    recordImportRun({
        sourceFile: path.basename(file),
        sourceType: "google_saved_places",
        tripId,
        importedCount: imported,
        skippedCount: skipped,
        errors,
    });
    return { imported, skipped, errors };
}
export function importReviews(file, tripId) {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const features = parsed.features ?? [];
    let imported = 0;
    let skipped = 0;
    const errors = [];
    for (const [index, feature] of features.entries()) {
        try {
            const properties = feature?.properties ?? {};
            const location = properties.location ?? {};
            const coordinates = feature?.geometry?.coordinates ?? [];
            const url = properties.google_maps_url;
            const name = location.name;
            if (!name && !url) {
                skipped += 1;
                continue;
            }
            const lng = Number(coordinates[0]);
            const lat = Number(coordinates[1]);
            const validCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
            const notes = [
                properties.review_text_published,
                properties.five_star_rating_published
                    ? `User rating: ${properties.five_star_rating_published}/5`
                    : undefined,
            ].filter(Boolean).join("\n");
            upsertPlace({
                id: stableId([tripId, url, name]),
                tripId,
                sourceId: properties.date,
                name: name ?? "Reviewed place",
                address: location.address,
                countryCode: location.country_code,
                latitude: validCoordinates ? lat : null,
                longitude: validCoordinates ? lng : null,
                googleMapsUrl: url,
                categories: classifyPlace(name ?? "", location.address ?? ""),
                priority: Number(properties.five_star_rating_published) >= 5 ? "B" : "C",
                planningStatus: "discovered",
                notes,
                source: "google_takeout_reviews",
                metadata: {
                    reviewedAt: properties.date,
                    rating: properties.five_star_rating_published,
                    questions: properties.questions,
                },
            });
            imported += 1;
        }
        catch (error) {
            errors.push(`Review ${index}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    recordImportRun({
        sourceFile: path.basename(file),
        sourceType: "google_reviews",
        tripId,
        importedCount: imported,
        skippedCount: skipped,
        errors,
    });
    return { imported, skipped, errors };
}
