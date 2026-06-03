import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

const BUILD_PENDING = ".cursor/.build-pending";
const BUILD_LOG = ".cursor/last-build.log";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

if (input.status !== "completed" || !existsSync(BUILD_PENDING)) {
  process.exit(0);
}

unlinkSync(BUILD_PENDING);
mkdirSync(dirname(BUILD_LOG), { recursive: true });

const started = new Date().toISOString();
try {
  const output = execSync("npm run build", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });
  writeFileSync(
    BUILD_LOG,
    `${started}\nstatus: success\n\n${output}\n`,
    "utf8",
  );
} catch (error) {
  const stderr = error.stderr?.toString?.() ?? "";
  const stdout = error.stdout?.toString?.() ?? "";
  writeFileSync(
    BUILD_LOG,
    `${started}\nstatus: failed\n\n${stdout}\n${stderr}\n`,
    "utf8",
  );
  process.exit(1);
}
