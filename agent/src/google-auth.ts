import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { google } from "googleapis";
import { loadConfig } from "./config.js";
import { resolveProjectPath } from "./paths.js";

const config = loadConfig();
const clientFile = resolveProjectPath(config.calendar.oauth_client_path);
const tokenFile = resolveProjectPath(config.calendar.oauth_token_path);

if (!fs.existsSync(clientFile)) {
  console.error(`Missing OAuth client: ${clientFile}`);
  console.error("Download a Google OAuth Desktop app JSON and save it there.");
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(clientFile, "utf8"));
const client = parsed.installed ?? parsed.web ?? parsed;
const redirectUri = "http://127.0.0.1:53682/oauth2callback";
const oauth2 = new google.auth.OAuth2(client.client_id, client.client_secret, redirectUri);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", redirectUri);
    if (url.pathname !== "/oauth2callback") {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const code = url.searchParams.get("code");
    if (!code) throw new Error("Missing OAuth code.");
    const { tokens } = await oauth2.getToken(code);
    fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
    fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>Google Calendar connected</h1><p>You may close this tab.</p>");
    console.log(`Token saved to ${tokenFile}`);
    server.close();
  } catch (error) {
    res.statusCode = 500;
    res.end(error instanceof Error ? error.message : String(error));
    console.error(error);
    server.close();
    process.exitCode = 1;
  }
});

server.listen(53682, "127.0.0.1", () => {
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  });
  console.log("Open this URL in your browser:");
  console.log(authUrl);
});
