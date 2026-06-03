import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BUILD_PENDING = ".cursor/.build-pending";
const BUILDABLE = /\.(?:tsx?|jsx?|css|mjs|cjs|json)$/i;
const SKIP = /(?:^|[\\/])(?:node_modules|\.next)(?:[\\/]|$)/;

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input.file_path ?? "";
if (!filePath || SKIP.test(filePath) || !BUILDABLE.test(filePath)) {
  process.exit(0);
}

mkdirSync(dirname(BUILD_PENDING), { recursive: true });
writeFileSync(BUILD_PENDING, String(Date.now()));
