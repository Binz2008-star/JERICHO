import { readFileSync } from "node:fs";
import { AppSpecSchema, type AppSpec, type Files } from "./spec";

const tpl = (name: string): string => readFileSync(new URL(`../templates/booking/${name}`, import.meta.url), "utf8");

/** Deterministic template render. Spec is data (spec.json); code files are static, so no code injection via prompt/spec. */
export function renderBookingApp(input: AppSpec): Files {
  const spec = AppSpecSchema.parse(input);
  return {
    "server.mjs": tpl("server.mjs"),
    "client.js": tpl("client.js"),
    "spec.json": `${JSON.stringify(spec, null, 2)}\n`,
    "package.json": `${JSON.stringify({ name: "generated-booking-app", private: true, type: "module", scripts: { start: "node server.mjs" } }, null, 2)}\n`,
  };
}
