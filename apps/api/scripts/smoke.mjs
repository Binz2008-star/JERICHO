import { spawn } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = String(41000 + Math.floor(Math.random() * 10000));
const child = spawn(process.execPath, ["--experimental-strip-types", resolve(root, "dist/server.ts")], {
  cwd: root, env: { ...process.env, JERICHO_API_PORT: port }, stdio: ["ignore", "pipe", "pipe"]
});
let logs = "";
child.stdout.on("data", data => { logs += data.toString(); });
child.stderr.on("data", data => { logs += data.toString(); });
let passed = false;
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (child.exitCode !== null) throw new Error(`API process exited: ${child.exitCode}\n${logs}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(700) });
      const json = await response.json();
      if (response.status !== 200 || json.ok !== true || json.service !== "jericho-api") throw new Error("Invalid health response");
      passed = true;
      break;
    } catch { await pause(150); }
  }
  if (!passed) throw new Error(`API health check timed out\n${logs}`);
  console.log("PASS: built API starts under Node and /health responds correctly");
} finally {
  child.kill("SIGTERM");
  await Promise.race([new Promise(resolve => child.once("exit", resolve)), pause(2000)]);
  if (!passed) console.error(logs);
}
