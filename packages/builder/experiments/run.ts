/* Experiment 001: local first-preview latency + lifecycle reliability.
 * Measures ONLY: deterministic interpret -> template render -> DEV local-process sandbox -> HTTP checks.
 * Does NOT measure: LLM quality/latency/cost, E2B, Neon, network. See AI_WORKSPACE/EXPERIMENT_001.md. */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { LocalProcessSandbox, type SandboxHandle } from "@jericho/sandbox";
import { applyChangeDev, interpretDev, renderBookingApp, VersionStore } from "../src/index";
import type { Locale } from "@jericho/shared";

const N = 15;
const CASES: ReadonlyArray<{ id: string; locale: Locale; prompt: string; change: string }> = [
  { id: "ar", locale: "ar", prompt: "أنشئ تطبيق حجوزات للعملاء مع لوحة تحكم", change: "خليه أفخم" },
  { id: "en", locale: "en", prompt: "Create a booking management app with customers and a dashboard", change: "make it more luxurious" },
];

const pct = (xs: number[], q: number): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)] ?? NaN;
};
const ms = (n: number): string => n.toFixed(1);

interface Row { stage: string; vals: number[] }

async function once(c: (typeof CASES)[number], rows: Map<string, number[]>, fails: string[]): Promise<void> {
  const sbx = new LocalProcessSandbox();
  const dataDir = await mkdtemp(join(tmpdir(), "jericho-exp-"));
  const env = { APP_DATA_FILE: join(dataDir, "data.json") };
  const live: SandboxHandle[] = [];
  const rec = (k: string, v: number): void => { rows.set(k, [...(rows.get(k) ?? []), v]); };
  const check = (ok: boolean, what: string): void => { if (!ok) fails.push(`${c.id}: ${what}`); };
  try {
    const t0 = performance.now();
    const r = interpretDev(c.prompt, c.locale);
    if (!r.ok) { fails.push(`${c.id}: interpret failed`); return; }
    const t1 = performance.now();
    const files = renderBookingApp(r.spec);
    const t2 = performance.now();
    const store = new VersionStore(); store.commit(files, "initial");
    let h = await sbx.start({ files, entry: "server.mjs", env, maxLifetimeMs: 60_000 }); live.push(h);
    const t3 = performance.now();
    const res = await fetch(h.baseUrl); const html = await res.text();
    const t4 = performance.now();
    check(res.status === 200 && html.includes(`lang="${c.locale}"`), "preview html");
    rec("interpret (deterministic)", t1 - t0); rec("render template", t2 - t1);
    rec("sandbox start -> listening", t3 - t2); rec("first GET / 200", t4 - t3);
    rec("TIME TO FIRST PREVIEW (total)", t4 - t0);

    const p0 = performance.now();
    const pr = await fetch(`${h.baseUrl}/api/bookings`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customer: "Test", date: "2026-12-01", time: "10:30" }) });
    rec("create booking (HTTP)", performance.now() - p0);
    check(pr.status === 201, "create booking");

    await h.stop();
    const s0 = performance.now();
    h = await sbx.start({ files, entry: "server.mjs", env }); live.push(h);
    const persisted = (await (await fetch(`${h.baseUrl}/api/bookings`)).json()) as unknown[];
    rec("restart + read persisted", performance.now() - s0);
    check(persisted.length === 1, "persistence after restart");

    const ch = applyChangeDev(r.spec, c.change);
    if (!ch.ok) { fails.push(`${c.id}: change unsupported`); return; }
    const m0 = performance.now();
    store.commit(renderBookingApp(ch.spec), "luxury");
    await h.stop();
    h = await sbx.start({ files: store.current().files, entry: "server.mjs", env }); live.push(h);
    const themed = (await (await fetch(h.baseUrl)).text()).includes('data-theme="luxury"');
    rec("apply change -> new preview", performance.now() - m0);
    check(themed, "luxury applied");

    const u0 = performance.now();
    const prev = store.undo();
    await h.stop();
    h = await sbx.start({ files: prev.files, entry: "server.mjs", env }); live.push(h);
    const undone = (await (await fetch(h.baseUrl)).text()).includes('data-theme="default"');
    const still = ((await (await fetch(`${h.baseUrl}/api/bookings`)).json()) as unknown[]).length === 1;
    rec("undo -> restored preview", performance.now() - u0);
    check(undone, "undo restored theme"); check(still, "undo kept data");
  } finally {
    await Promise.all(live.map((x) => x.stop()));
    await rm(dataDir, { recursive: true, force: true });
  }
}

const rows = new Map<string, number[]>();
const fails: string[] = [];
for (const c of CASES) for (let i = 0; i < N; i++) await once(c, rows, fails);

const table: Row[] = [...rows.entries()].map(([stage, vals]) => ({ stage, vals }));
const lines = [
  `| Stage | n | p50 ms | p95 ms | max ms |`, `|---|---|---|---|---|`,
  ...table.map((r) => `| ${r.stage} | ${r.vals.length} | ${ms(pct(r.vals, 0.5))} | ${ms(pct(r.vals, 0.95))} | ${ms(Math.max(...r.vals))} |`),
];
const stamp = new Date().toISOString().slice(0, 10);
const md = [
  `# Experiment 001 results (${stamp})`,
  `Runs: ${N} per locale x ${CASES.length} locales = ${N * CASES.length} full lifecycles. Node ${process.version}, ${process.platform}.`,
  `Lifecycle assertions failed: **${fails.length}**${fails.length ? `\n\n${fails.map((f) => `- ${f}`).join("\n")}` : ""}`, "", ...lines, "",
].join("\n");
await writeFile(new URL("../../../AI_WORKSPACE/EXPERIMENT_001_RESULTS.md", import.meta.url), md, "utf8");
console.log(md);
process.exit(fails.length ? 1 : 0);
