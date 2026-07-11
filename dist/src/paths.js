import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
function findProjectRoot(start) {
    let current = start;
    while (true) {
        if (fs.existsSync(path.join(current, "package.json"))
            && fs.existsSync(path.join(current, "config", "travel-agent.yaml"))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            throw new Error(`Unable to locate travel-agent project root from ${start}`);
        }
        current = parent;
    }
}
export const projectRoot = findProjectRoot(moduleDir);
export function resolveProjectPath(input) {
    return path.isAbsolute(input) ? input : path.resolve(projectRoot, input);
}
export function ensureParent(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
