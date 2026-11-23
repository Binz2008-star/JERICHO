import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(here, "spec.json"), "utf8"));
const clientJs = readFileSync(join(here, "client.js"), "utf8");
const dataFile = process.env.APP_DATA_FILE || join(here, "data.json");

const STR = {
  en: { title: "Bookings", customer: "Customer name", date: "Date", time: "Time", add: "Add booking", empty: "No bookings yet", error: "Please check the fields", total: "Total bookings" },
  ar: { title: "الحجوزات", customer: "اسم العميل", date: "التاريخ", time: "الوقت", add: "إضافة حجز", empty: "لا توجد حجوزات بعد", error: "تحقق من الحقول", total: "إجمالي الحجوزات" },
};
const THEMES = {
  default: "--bg:#fafaf9;--fg:#1c1917;--card:#fff;--accent:#2563eb;--border:#e7e5e4",
  luxury: "--bg:#0c0a09;--fg:#f5f5f4;--card:#1c1917;--accent:#d4af37;--border:#44403c",
};
const s = STR[spec.locale] || STR.en;
const theme = THEMES[spec.theme] ? spec.theme : "default";

function esc(v) {
  return String(v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function load() {
  if (!existsSync(dataFile)) return [];
  const d = JSON.parse(readFileSync(dataFile, "utf8")); // throws on corruption: never silently overwrite
  if (!Array.isArray(d)) throw new Error("corrupt data file");
  return d;
}
function save(list) {
  const tmp = dataFile + ".tmp";
  writeFileSync(tmp, JSON.stringify(list));
  renameSync(tmp, dataFile);
}
function page() {
  const dir = spec.locale === "ar" ? "rtl" : "ltr";
  return [
    '<!doctype html><html lang="', esc(spec.locale), '" dir="', dir, '" data-theme="', theme, '"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>', esc(spec.appName), "</title><style>",
    ":root{", THEMES[theme], "}",
    "body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,sans-serif}",
    "main{max-width:560px;margin:0 auto;padding:2rem 1.25rem}",
    "form{display:grid;gap:.75rem;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1rem}",
    "label{display:grid;gap:.25rem;font-size:.9rem}input,button{font:inherit;padding:.6rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--fg)}",
    "button{background:var(--accent);color:#000;border:0;cursor:pointer}li{padding:.5rem 0;border-bottom:1px solid var(--border)}ul{padding:0;list-style:none}",
    '</style></head><body data-empty="', esc(s.empty), '" data-error="', esc(s.error), '"><main><h1>', esc(spec.appName), "</h1>",
    '<form id="f"><label>', esc(s.customer), '<input name="customer" required maxlength="80"></label>',
    "<label>", esc(s.date), '<input name="date" type="date" required></label>',
    "<label>", esc(s.time), '<input name="time" type="time" required></label>',
    '<button type="submit">', esc(s.add), '</button></form><p id="msg" role="status"></p>',
    "<h2>", esc(s.total), ': <span id="count">0</span></h2><ul id="list"></ul>',
    '<script src="/client.js"></script></main></body></html>',
  ].join("");
}
function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0; let over = false; const chunks = [];
    req.on("data", function (c) {
      if (over) return; // discard further bytes; connection is closed after the 413 response
      size += c.length;
      if (size > 10000) { over = true; chunks.length = 0; reject(Object.assign(new Error("too large"), { status: 413 })); } else chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}
const valid = function (b) {
  return b && typeof b === "object" && typeof b.customer === "string" && b.customer.trim().length >= 1 && b.customer.length <= 80 &&
    typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && typeof b.time === "string" && /^\d{2}:\d{2}$/.test(b.time);
};
const SEC = { "x-content-type-options": "nosniff", "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'self'" };
function send(res, status, type, body) { res.writeHead(status, Object.assign({ "content-type": type }, SEC)); res.end(body); }

http.createServer(async function (req, res) {
  try {
    const url = new URL(req.url || "/", "http://x");
    if (req.method === "GET" && url.pathname === "/") return send(res, 200, "text/html; charset=utf-8", page());
    if (req.method === "GET" && url.pathname === "/client.js") return send(res, 200, "text/javascript; charset=utf-8", clientJs);
    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, "application/json", '{"ok":true}');
    if (req.method === "GET" && url.pathname === "/api/bookings") return send(res, 200, "application/json", JSON.stringify(load()));
    if (req.method === "POST" && url.pathname === "/api/bookings") {
      let parsed = null;
      try { parsed = JSON.parse(await readBody(req)); } catch (e) { if (e && e.status === 413) { res.setHeader("connection", "close"); res.on("finish", function () { req.destroy(); }); return send(res, 413, "application/json", '{"error":"too_large"}'); } }
      if (!valid(parsed)) return send(res, 400, "application/json", '{"error":"invalid"}');
      const list = load();
      const item = { id: randomUUID(), customer: parsed.customer.trim(), date: parsed.date, time: parsed.time };
      list.push(item); save(list);
      return send(res, 201, "application/json", JSON.stringify(item));
    }
    return send(res, 404, "application/json", '{"error":"not_found"}');
  } catch (e) {
    process.stderr.write(JSON.stringify({ level: "error", msg: String(e && e.message) }) + "\n");
    return send(res, 500, "application/json", '{"error":"internal"}');
  }
}).listen(Number(process.env.PORT || 0), "127.0.0.1", function () {
  process.stdout.write(JSON.stringify({ listening: this.address().port }) + "\n");
});
