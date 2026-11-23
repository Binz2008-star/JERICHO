import { z } from "zod";

export const RUN_STATES = [
  "created", "understanding", "planning", "generating", "preparing",
  "running", "testing", "preview_ready",
  "needs_approval", "retrying", "failed", "cancelled",
] as const;
export const RunStateSchema = z.enum(RUN_STATES);
export type RunState = z.infer<typeof RunStateSchema>;

const FORWARD: Record<RunState, readonly RunState[]> = {
  created: ["understanding"],
  understanding: ["planning", "needs_approval"],
  planning: ["generating", "needs_approval"],
  generating: ["preparing", "retrying"],
  preparing: ["running", "retrying"],
  running: ["testing", "retrying"],
  testing: ["preview_ready", "retrying"],
  preview_ready: [],
  needs_approval: ["planning", "generating", "preparing"],
  retrying: ["generating", "preparing", "running", "testing"],
  failed: [],
  cancelled: [],
};
const TERMINAL: ReadonlySet<RunState> = new Set(["preview_ready", "failed", "cancelled"]);

export const MAX_RETRIES = 3;

export interface RunSnapshot { readonly state: RunState; readonly retries: number; }

export class InvalidTransitionError extends Error {
  constructor(readonly from: RunState, readonly to: RunState) {
    super(`Invalid run transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export const isTerminal = (s: RunState): boolean => TERMINAL.has(s);

/** Server-controlled transition. Pure: returns a new snapshot or throws. */
export function transition(cur: RunSnapshot, to: RunState): RunSnapshot {
  if (isTerminal(cur.state)) throw new InvalidTransitionError(cur.state, to);
  if (to === "failed" || to === "cancelled") return { state: to, retries: cur.retries };
  if (!FORWARD[cur.state].includes(to)) throw new InvalidTransitionError(cur.state, to);
  if (to === "retrying") {
    if (cur.retries >= MAX_RETRIES) return { state: "failed", retries: cur.retries };
    return { state: "retrying", retries: cur.retries + 1 };
  }
  return { state: to, retries: cur.retries };
}
