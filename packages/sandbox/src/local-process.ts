import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { isSafeProjectPath } from "@jericho/shared";
import { SandboxError, type SandboxAdapter, type SandboxHandle, type StartOptions } from "./types";

const LOG_CAP = 16_384;

/**
 * DEV-ONLY adapter. Runs generated code as a child process with a scrubbed environment.
 * NOT ISOLATED: same kernel/filesystem/network as the host. Never use for untrusted
 * multi-tenant code. Production requires an isolated provider (E2B, BLOCKED).
 */
export class LocalProcessSandbox implements SandboxAdapter {
  readonly kind = "local-process-DEV-ONLY";
  readonly isolated = false;

  async start(o: StartOptions): Promise<SandboxHandle> {
    if (!isSafeProjectPath(o.entry)) throw new SandboxError("unsafe_path", "unsafe entry path");
    for (const p of Object.keys(o.files)) {
      if (!isSafeProjectPath(p)) throw new SandboxError("unsafe_path", `unsafe path: ${p}`);
    }
    const root = await mkdtemp(join(tmpdir(), "jericho-sbx-"));
    let handle: SandboxHandle | undefined;
    try {
      for (const [p, content] of Object.entries(o.files)) {
        const abs = resolve(root, p);
        if (!abs.startsWith(root + sep)) throw new SandboxError("unsafe_path", `escapes root: ${p}`);
        await mkdir(dirname(abs), { recursive: true });
        await writeFile(abs, content, "utf8");
      }
      const child = spawn(process.execPath, [o.entry], {
        cwd: root,
        env: { PORT: "0", NODE_ENV: "production", ...(o.env ?? {}) },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const exited = new Promise<void>((r) => child.once("exit", () => r()));
      let logs = "";
      const append = (d: Buffer): void => { logs = (logs + d.toString("utf8")).slice(-LOG_CAP); };
      child.stderr.on("data", append);

      const port = await new Promise<number>((res, rej) => {
        const timer = setTimeout(
          () => rej(new SandboxError("start_timeout", "sandbox did not start in time")),
          o.startTimeoutMs ?? 10_000,
        );
        child.stdout.on("data", (d: Buffer) => {
          append(d);
          const m = /"listening":(\d+)/.exec(logs);
          if (m?.[1]) { clearTimeout(timer); res(Number(m[1])); }
        });
        child.once("exit", () => { clearTimeout(timer); rej(new SandboxError("exited_early", "process exited before listening")); });
      }).catch(async (e: unknown) => {
        child.kill("SIGKILL");
        await exited;
        throw e;
      });

      let stopped = false;
      const stop = async (): Promise<void> => {
        if (stopped) return;
        stopped = true;
        child.kill("SIGKILL");
        await exited;
        await rm(root, { recursive: true, force: true });
      };
      if (o.maxLifetimeMs !== undefined) setTimeout(() => void stop(), o.maxLifetimeMs).unref();
      handle = { baseUrl: `http://127.0.0.1:${port}`, logs: () => logs, stop };
      return handle;
    } catch (e) {
      if (!handle) await rm(root, { recursive: true, force: true });
      throw e;
    }
  }
}
