import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";

const port = Number(process.env["JERICHO_API_PORT"] ?? 8787);
serve({ fetch: createApp().fetch, port });
console.info(JSON.stringify({ level: "info", msg: "api listening", port }));
