import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Node 22 native TS stripping is our deliberately chosen runtime strategy.
// This copies a deployable source distribution, not transpiled JavaScript.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(resolve(root, "dist"), { recursive: true });
await cp(resolve(root, "src"), resolve(root, "dist"), { recursive: true });
console.log("API runtime artifact ready at apps/api/dist (Node >=22.16 + workspace dependencies required)");
