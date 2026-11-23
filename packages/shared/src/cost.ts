export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedInputTokens?: number;
}
/** Prices are supplied by config/owner after verification; never hardcoded here. Unit: micro-USD per 1M tokens. */
export interface Pricing {
  readonly inputPerMTokMicroUsd: number;
  readonly outputPerMTokMicroUsd: number;
  readonly cachedInputPerMTokMicroUsd?: number;
}

const nonNegInt = (n: number, name: string): void => {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`${name} must be a non-negative integer`);
};

/** Integer micro-USD, rounded up so budgets are never under-counted. */
export function computeRunCostMicroUsd(u: TokenUsage, p: Pricing): number {
  const cached = u.cachedInputTokens ?? 0;
  nonNegInt(u.inputTokens, "inputTokens");
  nonNegInt(u.outputTokens, "outputTokens");
  nonNegInt(cached, "cachedInputTokens");
  nonNegInt(p.inputPerMTokMicroUsd, "inputPrice");
  nonNegInt(p.outputPerMTokMicroUsd, "outputPrice");
  if (cached > u.inputTokens) throw new RangeError("cachedInputTokens exceeds inputTokens");
  const cachedRate = p.cachedInputPerMTokMicroUsd ?? p.inputPerMTokMicroUsd;
  nonNegInt(cachedRate, "cachedPrice");
  const num =
    (u.inputTokens - cached) * p.inputPerMTokMicroUsd +
    cached * cachedRate +
    u.outputTokens * p.outputPerMTokMicroUsd;
  return Math.ceil(num / 1_000_000);
}

export const exceedsBudget = (spentMicroUsd: number, budgetMicroUsd: number): boolean =>
  spentMicroUsd >= budgetMicroUsd;
