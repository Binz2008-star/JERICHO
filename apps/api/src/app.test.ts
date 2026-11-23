import { describe, expect, it } from "vitest";
import { createApp } from "./app";

const post = (body: unknown) =>
  createApp().request("/projects/validate", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

describe("api", () => {
  it("health", async () => { expect((await createApp().request("/health")).status).toBe(200); });
  it("accepts valid input", async () => { expect((await post({ prompt: "booking app", locale: "en" })).status).toBe(200); });
  it("rejects injected workspace_id", async () => { expect((await post({ prompt: "booking app", locale: "en", workspace_id: "w" })).status).toBe(400); });
  it("rejects malformed JSON", async () => {
    const r = await createApp().request("/projects/validate", { method: "POST", body: "{", headers: { "content-type": "application/json" } });
    expect(r.status).toBe(400);
  });
});
