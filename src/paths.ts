import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(moduleDir, "..");

export function resolveProjectPath(input: string): string {
  return path.isAbsolute(input) ? input : path.resolve(projectRoot, input);
}

export function ensureParent(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
