import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalProcessSandbox, type SandboxHandle } from "@jericho/sandbox";
import { applyChangeDev, interpretDev, renderBookingApp, VersionStore, AppSpecSchema, type AppSpec } from "./index";

describe("dev interpreter (deterministic, not AI)", () => {
  it("labels its source", () => { expect(interpretDev("booking app", "en")).toMatchObject({ ok: true, source: "dev-deterministic" }); });
  it("handles Arabic booking prompt + luxury", () => {
    const r = interpretDev("أنشئ تطبيق حجوزات فاخر", "ar");
    expect(r.ok && r.spec.theme).toBe("luxury");
    expect(r.ok && r.spec.locale).toBe("ar");
  });
  it("honestly reports unsupported requests", () => {
    expect(interpretDev("build me a clothing store", "en")).toMatchObject({ ok: false, reason: "unsupported" });
    const spec = AppSpecSchema.parse({ kind: "booking", locale: "en", appName: "A", theme: "default" });
    expect(applyChangeDev(spec, "add loyalty points")).toMatchObject({ ok: false });
  });
});

describe("spec validation", () => {
  it("rejects extra keys and control chars", () => {
    expect(AppSpecSchema.safeParse({ kind: "booking", locale: "en", appName: "A", theme: "default", x: 1 }).success).toBe(false);
    expect(AppSpecSchema.safeParse({ kind: "booking", locale: "en", appName: "A\u0000", theme: "default" }).success).toBe(false);
  });
});

describe("version store", () => {
  it("undo restores previous and refuses to go below v1", () => {
    const s = new VersionStore();
    s.commit({ a: "1" }, "v1"); s.commit({ a: "2" }, "v2");
    expect(s.undo().files["a"]).toBe("1");
    expect(() => s.undo()).toThrow();
  });
});

describe("render -> run -> persist -> change -> undo (local DEV sandbox)", () => {
  const sbx = new LocalProcessSandbox();
  let dataDir = "";
  const live: SandboxHandle[] = [];
  beforeAll(async () => { dataDir = await mkdtemp(join(tmpdir(), "jericho-data-")); });
  afterAll(async () => { await Promise.all(live.map((h) => h.stop())); await rm(dataDir, { recursive: true, force: true }); });
  const run = async (spec: AppSpec): Promise<SandboxHandle> => {
    const h = await sbx.start({ files: renderBookingApp(spec), entry: "server.mjs", env: { APP_DATA_FILE: join(dataDir, "data.json") }, maxLifetimeMs: 60_000 });
    live.push(h);
    return h;
  };
  const post = (h: SandboxHandle, body: unknown) =>
    fetch(`${h.baseUrl}/api/bookings`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("full flow in Arabic, with XSS-safe name", async () => {
    const spec = AppSpecSchema.parse({ kind: "booking", locale: "ar", appName: "<img src=x onerror=alert(1)>", theme: "default" });
    const store = new VersionStore();
    store.commit(renderBookingApp(spec), "initial");
    let h = await run(spec);
    const html = await (await fetch(h.baseUrl)).text();
    expect(html).toContain('lang="ar"'); expect(html).toContain('dir="rtl"');
    expect(html).not.toContain("<img src=x"); expect(html).toContain("&lt;img");
    expect(html).toContain("إضافة حجز");

    expect((await post(h, { customer: "سارة", date: "2026-12-01", time: "10:30" })).status).toBe(201);
    expect((await post(h, { customer: "", date: "bad", time: "x" })).status).toBe(400);
    expect((await post(h, { customer: "x".repeat(20_000), date: "2026-12-01", time: "10:30" })).status).toBe(413);

    await h.stop();
    h = await run(spec); // restart: data survives
    const list1 = (await (await fetch(`${h.baseUrl}/api/bookings`)).json()) as { customer: string }[];
    expect(list1.map((b) => b.customer)).toEqual(["سارة"]);

    const changed = applyChangeDev(spec, "make it more luxurious");
    if (!changed.ok) throw new Error("expected supported change");
    store.commit(renderBookingApp(changed.spec), "luxury theme");
    await h.stop();
    h = await run(changed.spec);
    expect(await (await fetch(h.baseUrl)).text()).toContain('data-theme="luxury"');

    const restored = store.undo();
    await h.stop();
    h = await sbx.start({ files: restored.files, entry: "server.mjs", env: { APP_DATA_FILE: join(dataDir, "data.json") }, maxLifetimeMs: 60_000 });
    live.push(h);
    expect(await (await fetch(h.baseUrl)).text()).toContain('data-theme="default"');
    const list2 = (await (await fetch(`${h.baseUrl}/api/bookings`)).json()) as unknown[];
    expect(list2).toHaveLength(1); // undo reverted code, not data
  });

  it("refuses to overwrite a corrupt data file", async () => {
    const { writeFile, readFile } = await import("node:fs/promises");
    const f = join(dataDir, "data.json");
    await writeFile(f, "{not json");
    const h = await run(AppSpecSchema.parse({ kind: "booking", locale: "en", appName: "A", theme: "default" }));
    expect((await post(h, { customer: "x", date: "2026-12-01", time: "10:30" })).status).toBe(500);
    expect(await readFile(f, "utf8")).toBe("{not json");
    await writeFile(f, "[]");
  });
});
