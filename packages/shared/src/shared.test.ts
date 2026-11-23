import { describe, expect, it } from "vitest";
import {
  transition, InvalidTransitionError, MAX_RETRIES, isSafeProjectPath, CreateProjectInputSchema,
} from "./index";

describe("run state machine", () => {
  it("walks the happy path to preview_ready", () => {
    let s = { state: "created", retries: 0 } as const as import("./index").RunSnapshot;
    for (const n of ["understanding","planning","generating","preparing","running","testing","preview_ready"] as const)
      s = transition(s, n);
    expect(s.state).toBe("preview_ready");
  });
  it("rejects skipping states", () => {
    expect(() => transition({ state: "created", retries: 0 }, "preview_ready")).toThrow(InvalidTransitionError);
  });
  it("terminal states are final", () => {
    expect(() => transition({ state: "failed", retries: 0 }, "planning")).toThrow(InvalidTransitionError);
    expect(() => transition({ state: "preview_ready", retries: 0 }, "cancelled")).toThrow(InvalidTransitionError);
  });
  it("bounds retries then fails", () => {
    let s = { state: "generating", retries: 0 } as import("./index").RunSnapshot;
    for (let i = 0; i < MAX_RETRIES; i++) { s = transition(s, "retrying"); s = transition(s, "generating"); }
    expect(transition(s, "retrying").state).toBe("failed");
  });
  it("can cancel from any non-terminal state", () => {
    expect(transition({ state: "running", retries: 1 }, "cancelled").state).toBe("cancelled");
  });
});

describe("path safety", () => {
  it.each(["../x", "/etc/passwd", "a/../b", "a\\b", "C:/x", "", "a//b", "./a", "a\0b"])("rejects %j", (p) => {
    expect(isSafeProjectPath(p)).toBe(false);
  });
  it.each(["src/App.tsx", "package.json", "a/b/c.ts"])("accepts %j", (p) => {
    expect(isSafeProjectPath(p)).toBe(true);
  });
});

describe("input validation", () => {
  it("accepts Arabic prompts", () => {
    expect(CreateProjectInputSchema.safeParse({ prompt: "أنشئ تطبيق حجوزات", locale: "ar" }).success).toBe(true);
  });
  it("rejects unknown keys (no client-supplied workspace_id)", () => {
    expect(CreateProjectInputSchema.safeParse({ prompt: "abc", locale: "en", workspace_id: "x" }).success).toBe(false);
  });
});
