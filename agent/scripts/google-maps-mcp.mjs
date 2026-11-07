#!/usr/bin/env node
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const [toolName, inputJson = "{}"] = process.argv.slice(2);
if (!toolName) {
  throw new Error("Usage: node agent/scripts/google-maps-mcp.mjs <tool-name> '<json-input>'");
}
const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_GROUNDING_API_KEY;
const oauthToken = process.env.GOOGLE_MAPS_OAUTH_ACCESS_TOKEN;
if (!apiKey && !oauthToken) {
  throw new Error("Configure GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_OAUTH_ACCESS_TOKEN");
}

const headers = oauthToken
  ? { Authorization: `Bearer ${oauthToken}` }
  : { "X-Goog-Api-Key": apiKey };

const client = new Client({ name: "travel-agent-maps-client", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(
  new URL("https://mapstools.googleapis.com/mcp"),
  { requestInit: { headers } },
);

try {
  await client.connect(transport);
  const response = await client.callTool({
    name: toolName,
    arguments: JSON.parse(inputJson),
  });
  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  process.stdout.write(`${text}\n`);
} finally {
  await transport.close();
}
