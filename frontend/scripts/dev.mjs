import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const projectRoot = resolve(process.cwd(), "..");
const frontendRoot = resolve(projectRoot, "frontend");
const serverRoot = resolve(projectRoot, "server");

function ensureDependencies(directory, dependencyMarker) {
  if (existsSync(resolve(directory, dependencyMarker))) {
    return true;
  }

  console.log(`Dependencies are missing in ${directory}. Installing them now...`);

  const result = spawnSync(
    npmCommand,
    ["install", "--no-audit", "--no-fund"],
    {
      cwd: directory,
      stdio: "inherit",
      shell: isWindows,
    }
  );

  if (result.error) {
    console.error("Failed to start npm install:");
    console.error(result.error);
    return false;
  }

  if (result.status !== 0) {
    console.error(`npm install failed in ${directory} with code ${result.status}`);
    return false;
  }

  return existsSync(resolve(directory, dependencyMarker));
}

// Make the combined development command self-contained. This is especially
// important on a fresh checkout where frontend/node_modules does not exist.
if (!ensureDependencies(frontendRoot, "node_modules/vite/bin/vite.js")) {
  process.exit(1);
}

if (!ensureDependencies(serverRoot, "node_modules/express/package.json")) {
  process.exit(1);
}

const backend = spawn(
  npmCommand,
  ["run", "dev"],
  {
    cwd: serverRoot,
    stdio: "inherit",
    shell: isWindows,
  }
);

const frontend = spawn(
  npmCommand,
  ["run", "dev:frontend"],
  {
    cwd: frontendRoot,
    stdio: "inherit",
    shell: isWindows,
  }
);

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;

  shuttingDown = true;

  try {
    backend.kill();
  } catch {}

  try {
    frontend.kill();
  } catch {}

  setTimeout(() => {
    process.exit(code);
  }, 300);
}

backend.on("error", (error) => {
  console.error("Backend failed to start:");
  console.error(error);
  shutdown(1);
});

frontend.on("error", (error) => {
  console.error("Frontend failed to start:");
  console.error(error);
  shutdown(1);
});

backend.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`Backend stopped with code ${code}`);
    shutdown(code || 1);
  }
});

frontend.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`Frontend stopped with code ${code}`);
    shutdown(code || 1);
  }
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
