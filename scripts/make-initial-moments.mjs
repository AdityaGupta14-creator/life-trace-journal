import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const momentsPath = path.join(rootDir, "public", "data", "archive-moments.json");
const targetPath = path.join(rootDir, "src", "data", "initial-moments.json");

const moments = JSON.parse(fs.readFileSync(momentsPath, "utf-8"));
console.log(`Loaded ${moments.length} moments.`);

// Select 200 diverse, chronological real moments across the entire timeline
const step = Math.floor(moments.length / 200);
const initial = [];
for (let i = 0; i < moments.length && initial.length < 200; i += step) {
  initial.push(moments[i]);
}

fs.writeFileSync(targetPath, JSON.stringify(initial, null, 2));
console.log(`Wrote ${initial.length} initial moments to ${targetPath}`);
