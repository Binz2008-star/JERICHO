import { z } from "zod";

export const LocaleSchema = z.enum(["ar", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const CreateProjectInputSchema = z.strictObject({
  prompt: z.string().trim().min(3).max(4000),
  locale: LocaleSchema,
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

/** Rejects traversal, absolute paths, NUL and backslashes in generated file paths. */
export function isSafeProjectPath(p: string): boolean {
  if (p.length === 0 || p.length > 240 || p.includes("\0") || p.includes("\\")) return false;
  if (p.startsWith("/") || /^[a-zA-Z]:/.test(p)) return false;
  return p.split("/").every((seg) => seg !== ".." && seg !== "." && seg !== "");
}
export const SafePathSchema = z.string().refine(isSafeProjectPath, "unsafe path");
