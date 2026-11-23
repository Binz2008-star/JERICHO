import { describe, expect, it } from "vitest";
import { computeRunCostMicroUsd, exceedsBudget } from "./index";

const p = { inputPerMTokMicroUsd: 3_000_000, outputPerMTokMicroUsd: 15_000_000, cachedInputPerMTokMicroUsd: 300_000 };
describe("cost", () => {
  it("computes input+output", () => {
    expect(computeRunCostMicroUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, p)).toBe(18_000_000);
  });
  it("bills cached input at the cached rate", () => {
    expect(computeRunCostMicroUsd({ inputTokens: 1_000_000, outputTokens: 0, cachedInputTokens: 1_000_000 }, p)).toBe(300_000);
  });
  it("rounds up, never down", () => {
    expect(computeRunCostMicroUsd({ inputTokens: 1, outputTokens: 0 }, p)).toBe(3);
    expect(computeRunCostMicroUsd({ inputTokens: 1, outputTokens: 0 }, { ...p, inputPerMTokMicroUsd: 1 })).toBe(1);
  });
  it("rejects bad input", () => {
    expect(() => computeRunCostMicroUsd({ inputTokens: -1, outputTokens: 0 }, p)).toThrow(RangeError);
    expect(() => computeRunCostMicroUsd({ inputTokens: 1, outputTokens: 0, cachedInputTokens: 2 }, p)).toThrow(RangeError);
  });
  it("budget gate is inclusive", () => { expect(exceedsBudget(100, 100)).toBe(true); expect(exceedsBudget(99, 100)).toBe(false); });
});
