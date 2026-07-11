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
