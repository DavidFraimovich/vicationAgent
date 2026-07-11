import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { projectRoot, resolveProjectPath } from "./paths.js";

export type TravelConfig = {
  project: {
    name: string;
    default_trip_id: string;
    locale: string;
    user_timezone: string;
  };
  storage: {
    database_path: string;
    backup_directory: string;
    export_directory: string;
  };
  dashboard: {
    host: string;
    port: number;
  };
  maps: Record<string, unknown>;
  calendar: {
    provider: string;
    calendar_name: string;
    calendar_id: string;
    trip_timezone: string;
    dry_run_default: boolean;
    require_confirmation_for_write: boolean;
    require_confirmation_for_delete: boolean;
    oauth_client_path: string;
    oauth_token_path: string;
    protected_events: Array<{ title_contains: string; date: string }>;
  };
  browser: Record<string, unknown>;
  lodging: Record<string, unknown>;
  audit: Record<string, unknown>;
};

let cached: TravelConfig | undefined;

export function loadConfig(force = false): TravelConfig {
  if (cached && !force) return cached;
  const configFile = process.env.TRAVEL_AGENT_CONFIG
    ? resolveProjectPath(process.env.TRAVEL_AGENT_CONFIG)
    : path.join(projectRoot, "config", "travel-agent.yaml");

  if (!fs.existsSync(configFile)) {
    throw new Error(`Configuration file not found: ${configFile}`);
  }
  cached = YAML.parse(fs.readFileSync(configFile, "utf8")) as TravelConfig;

  if (process.env.TRAVEL_AGENT_DB) {
    cached.storage.database_path = process.env.TRAVEL_AGENT_DB;
  }
  if (process.env.TRAVEL_AGENT_DASHBOARD_PORT) {
    cached.dashboard.port = Number(process.env.TRAVEL_AGENT_DASHBOARD_PORT);
  }
  return cached;
}

export function dbPath(): string {
  return resolveProjectPath(loadConfig().storage.database_path);
}

export function exportDirectory(): string {
  return resolveProjectPath(loadConfig().storage.export_directory);
}

export function backupDirectory(): string {
  return resolveProjectPath(loadConfig().storage.backup_directory);
}
