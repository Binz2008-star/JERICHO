import { Hono } from "hono";
import { CreateProjectInputSchema } from "@jericho/shared";

export function createApp(): Hono {
  const app = new Hono();
  app.get("/health", (c) => c.json({ ok: true, service: "jericho-api" }));
  // Foundation stub: validation only. No persistence/auth yet (Milestone 2).
  app.post("/projects/validate", async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = CreateProjectInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ ok: false, error: "invalid_input" }, 400);
    return c.json({ ok: true });
  });
  return app;
}
