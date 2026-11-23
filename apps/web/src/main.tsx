import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { dir, t, type Locale } from "@jericho/i18n";

function readLocale(): Locale {
  try { return localStorage.getItem("jericho.locale") === "ar" ? "ar" : "en"; } catch { return "en"; }
}

function Start(): JSX.Element {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [prompt, setPrompt] = useState("");
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir(locale);
    try { localStorage.setItem("jericho.locale", locale); } catch { /* storage unavailable */ }
  }, [locale]);
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "10vh 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <button type="button" onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>{t(locale, "lang.switch")}</button>
      <h1>{t(locale, "start.title")}</h1>
      <label>
        <span style={{ position: "absolute", left: -9999 }}>{t(locale, "start.title")}</span>
        <textarea rows={4} style={{ width: "100%" }} value={prompt} placeholder={t(locale, "start.placeholder")} onChange={(e) => setPrompt(e.target.value)} />
      </label>
      <button type="button" disabled={prompt.trim().length < 3}>{t(locale, "start.cta")}</button>
    </main>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<StrictMode><Start /></StrictMode>);
