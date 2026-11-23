import type { Locale } from "@jericho/shared";
import { AppSpecSchema, type AppSpec } from "./spec";

/** DETERMINISTIC DEV ADAPTER. Keyword rules, NOT an AI model. Never present its output as AI generation. */
export const DEV_ADAPTER_LABEL = "dev-deterministic" as const;

const LUXURY = /luxur|premium|elegant|فخم|فاخر|راقي|أنيق/i;
const SIMPLE = /\b(default|simple|plain|light)\b|عادي|بسيط/i;
const BOOKING = /book|reserv|appointment|حجز|حجوزات|موعد|مواعيد/i;

export type InterpretResult =
  | { readonly ok: true; readonly source: typeof DEV_ADAPTER_LABEL; readonly spec: AppSpec }
  | { readonly ok: false; readonly source: typeof DEV_ADAPTER_LABEL; readonly reason: "unsupported" };

export function interpretDev(prompt: string, locale: Locale): InterpretResult {
  if (!BOOKING.test(prompt)) return { ok: false, source: DEV_ADAPTER_LABEL, reason: "unsupported" };
  const spec = AppSpecSchema.parse({
    kind: "booking",
    locale,
    appName: locale === "ar" ? "نظام الحجوزات" : "Booking Manager",
    theme: LUXURY.test(prompt) ? "luxury" : "default",
  });
  return { ok: true, source: DEV_ADAPTER_LABEL, spec };
}

export type ChangeResult =
  | { readonly ok: true; readonly spec: AppSpec }
  | { readonly ok: false; readonly reason: "unsupported" };

export function applyChangeDev(spec: AppSpec, instruction: string): ChangeResult {
  if (LUXURY.test(instruction)) return { ok: true, spec: { ...spec, theme: "luxury" } };
  if (SIMPLE.test(instruction)) return { ok: true, spec: { ...spec, theme: "default" } };
  return { ok: false, reason: "unsupported" };
}
