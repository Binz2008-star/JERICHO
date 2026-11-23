import { describe, expect, it } from "vitest";
import { LocalProcessSandbox, SandboxError } from "./index";

const server = [
  'import http from "node:http";',
  'http.createServer((q,r)=>{ r.end(JSON.stringify(Object.keys(process.env))); })',
  '.listen(Number(process.env.PORT||0),"127.0.0.1",function(){console.log(JSON.stringify({listening:this.address().port}));});',
].join("\n");

describe("LocalProcessSandbox (DEV ONLY, not isolated)", () => {
  const sbx = new LocalProcessSandbox();
  it("declares itself non-isolated", () => { expect(sbx.isolated).toBe(false); });
  it("starts, serves, stops, and does not leak host env", async () => {
    process.env["JERICHO_TEST_SECRET"] = "should-not-leak";
    const h = await sbx.start({ files: { "s.mjs": server }, entry: "s.mjs" });
    const keys = (await (await fetch(h.baseUrl)).json()) as string[];
    expect(keys).not.toContain("JERICHO_TEST_SECRET");
    await h.stop();
    await h.stop(); // idempotent
    await expect(fetch(h.baseUrl)).rejects.toThrow();
    delete process.env["JERICHO_TEST_SECRET"];
  });
  it.each(["../evil.mjs", "/abs.mjs", "a/../../b"])("rejects unsafe path %s", async (p) => {
    await expect(sbx.start({ files: { [p]: "x" }, entry: "s.mjs" })).rejects.toBeInstanceOf(SandboxError);
  });
  it("times out a process that never listens and cleans up", async () => {
    await expect(sbx.start({ files: { "s.mjs": "setInterval(()=>{},1000)" }, entry: "s.mjs", startTimeoutMs: 400 }))
      .rejects.toMatchObject({ code: "start_timeout" });
  });
  it("reports early exit", async () => {
    await expect(sbx.start({ files: { "s.mjs": "process.exit(1)" }, entry: "s.mjs" }))
      .rejects.toMatchObject({ code: "exited_early" });
  });
});
