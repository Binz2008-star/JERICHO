import { describe, expect, it } from "vitest";
import { messages, dir, t } from "./index";

describe("i18n", () => {
  it("ar and en have identical keys with no empty strings", () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    for (const l of ["ar", "en"] as const)
      for (const v of Object.values(messages[l])) expect(v.trim().length).toBeGreaterThan(0);
  });
  it("sets direction", () => { expect(dir("ar")).toBe("rtl"); expect(dir("en")).toBe("ltr"); });
  it("uses the mandated Arabic start prompt", () => { expect(t("ar", "start.title")).toBe("شو بدك تصنع اليوم؟"); });
});
