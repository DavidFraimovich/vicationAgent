import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { projectRoot, resolveProjectPath } from "./paths.js";
let cached;
export function loadConfig(force = false) {
    if (cached && !force)
        return cached;
    const configFile = process.env.TRAVEL_AGENT_CONFIG
        ? resolveProjectPath(process.env.TRAVEL_AGENT_CONFIG)
        : path.join(projectRoot, "config", "travel-agent.yaml");
    if (!fs.existsSync(configFile)) {
        throw new Error(`Configuration file not found: ${configFile}`);
    }
    cached = YAML.parse(fs.readFileSync(configFile, "utf8"));
    if (process.env.TRAVEL_AGENT_DB) {
        cached.storage.database_path = process.env.TRAVEL_AGENT_DB;
    }
    if (process.env.TRAVEL_AGENT_DASHBOARD_PORT) {
        cached.dashboard.port = Number(process.env.TRAVEL_AGENT_DASHBOARD_PORT);
    }
    if (process.env.TRAVEL_AGENT_CALENDAR_ATTENDEE_REMOVAL_AUTHORIZED) {
        cached.calendar.attendee_removal_authorized =
            process.env.TRAVEL_AGENT_CALENDAR_ATTENDEE_REMOVAL_AUTHORIZED === "true";
    }
    if (process.env.TRAVEL_AGENT_AIRBNB_EVENT_EDIT_POLICY
        === "configured-calendar-in-place-add-missing-details") {
        cached.calendar.lodging_sync.allow_provider_created_event_in_place_updates = true;
        cached.calendar.lodging_sync.provider_event_updates_only_in_configured_calendar = true;
        cached.calendar.lodging_sync.provider_event_update_mode = "add_missing_relevant_details";
    }
    if (process.env.TRAVEL_AGENT_TELEGRAM_STANDING_SEND_AUTHORIZATION === "true") {
        cached.telegram.standing_send_authorization = true;
        cached.telegram.require_per_message_confirmation = false;
        cached.telegram.unlimited_relevant_notifications = true;
    }
    return cached;
}
export function dbPath() {
    return resolveProjectPath(loadConfig().storage.database_path);
}
export function exportDirectory() {
    return resolveProjectPath(loadConfig().storage.export_directory);
}
export function backupDirectory() {
    return resolveProjectPath(loadConfig().storage.backup_directory);
}
