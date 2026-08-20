import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";

const npmCommand = isWindows ? "npm.cmd" : "npm";

const backend = spawn(
  npmCommand,
  ["run", "dev"],
  {
    cwd: "../server",
    stdio: "inherit",
    shell: isWindows,
  }
);

const frontend = spawn(
  npmCommand,
  ["run", "dev:frontend"],
  {
    cwd: ".",
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