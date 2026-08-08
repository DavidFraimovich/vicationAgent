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
    policy_path: string;
    calendar_name: string;
    calendar_id: string;
    write_method: string;
    fallback_write_method: string;
    forbid_rich_text_editor_writes: boolean;
    update_existing_events_in_place: boolean;
    send_updates_default: "none";
    attendee_removal_authorized: boolean;
    itinerary_attendee_exclusions: string[];
    require_raw_post_write_verification: boolean;
    require_post_delete_absence_verification: boolean;
    trip_timezone: string;
    dry_run_default: boolean;
    require_confirmation_for_write: boolean;
    require_confirmation_for_delete: boolean;
    oauth_client_path: string;
    oauth_token_path: string;
    protected_events: Array<{ title_contains: string; date: string }>;
    lodging_sync: {
      source_of_truth: string;
      mailbox_account: string;
      prefer_provider_created_calendar_event: boolean;
      allow_provider_created_event_in_place_updates: boolean;
      provider_event_updates_only_in_configured_calendar: boolean;
      provider_event_update_mode: "add_missing_relevant_details";
      provider_event_deletion_allowed: boolean;
      suppress_proactive_lodging_event_creation: boolean;
      require_inbox_and_calendar_duplicate_check_before_manual_write: boolean;
      manual_write_requires_explicit_user_request: boolean;
      duplicate_match_fields: string[];
    };
  };
  browser: {
    primary: string;
    fallback: string;
    dedicated_profile: boolean;
    profile_account_email: string;
    full_site_access_on_allowlist: boolean;
    allowed_domains: string[];
    blocked_actions: string[];
    confirmation_required_actions: string[];
  };
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
  if (process.env.TRAVEL_AGENT_CALENDAR_ATTENDEE_REMOVAL_AUTHORIZED) {
    cached.calendar.attendee_removal_authorized =
      process.env.TRAVEL_AGENT_CALENDAR_ATTENDEE_REMOVAL_AUTHORIZED === "true";
  }
  if (
    process.env.TRAVEL_AGENT_AIRBNB_EVENT_EDIT_POLICY
    === "configured-calendar-in-place-add-missing-details"
  ) {
    cached.calendar.lodging_sync.allow_provider_created_event_in_place_updates = true;
    cached.calendar.lodging_sync.provider_event_updates_only_in_configured_calendar = true;
    cached.calendar.lodging_sync.provider_event_update_mode = "add_missing_relevant_details";
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
