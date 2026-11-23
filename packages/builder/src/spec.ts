import { z } from "zod";
import { LocaleSchema } from "@jericho/shared";

export const THEMES = ["default", "luxury"] as const;
export const AppSpecSchema = z.strictObject({
  kind: z.literal("booking"),
  locale: LocaleSchema,
  appName: z.string().trim().min(1).max(60).refine((v) => !/[\u0000-\u001f]/.test(v), "control chars"),
  theme: z.enum(THEMES),
});
export type AppSpec = z.infer<typeof AppSpecSchema>;
export type Files = Readonly<Record<string, string>>;
