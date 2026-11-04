// Serve the static export in out/ the way Vercel does closely enough for
// end-to-end tests: clean URLs with trailing slashes, 404.html for misses,
// and the headers from vercel.json applied by their `source` patterns.
//
//   node scripts/serve-static.mjs [port]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "out");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4321);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".pbf": "application/x-protobuf",
};

/** vercel.json `headers`, matched with the same simple patterns it uses. */
function loadHeaderRules() {
  const p = join(process.cwd(), "vercel.json");
  if (!existsSync(p)) return [];
  const cfg = JSON.parse(readFileSync(p, "utf8"));
  return (cfg.headers ?? []).map((rule) => {
    const re = new RegExp(
      "^" +
        rule.source
          .replace(/\(\.\*\)/g, "\u0000")
          .replace(/:\w+\*/g, "\u0000")
          .replace(/[.+?^${}()|[\]\\*]/g, "\\$&")
          .replace(/\u0000/g, ".*") +
        "$",
    );
    return { re, headers: rule.headers };
  });
}
const RULES = loadHeaderRules();

function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [join(ROOT, clean), join(ROOT, clean, "index.html"), join(ROOT, `${clean}.html`)];
  for (const c of candidates) {
    if (c.startsWith(ROOT) && existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  for (const r of RULES) {
    if (r.re.test(path)) for (const h of r.headers) res.setHeader(h.key, h.value);
  }

  // Vercel serves its analytics scripts and beacons under /_vercel; there
  // is nothing to measure locally, so answer with an empty script.
  if (path.startsWith("/_vercel/")) {
    if (path.endsWith(".js")) {
      res.writeHead(200, { "Content-Type": TYPES[".js"] });
      res.end("");
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // trailingSlash: true — directory-style pages redirect to the slashed form.
  if (!path.endsWith("/") && !extname(path) && resolve(`${path}/`)) {
    res.writeHead(308, { Location: `${path}/${url.search}` });
    res.end();
    return;
  }

  const file = resolve(path);
  if (!file) {
    const notFound = join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    res.end(existsSync(notFound) ? readFileSync(notFound) : "Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => {
  console.log(`serving out/ on http://localhost:${PORT}`);
});
