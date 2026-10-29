#!/usr/bin/env node
/* Guard for the strict CSP in customHttp.yml (script-src 'self'; style-src 'self').
   Fails if index.html has inline <script>/<style>, style="" attributes, or
   external script/stylesheet hosts, or if any JS sets a style attribute.
   Run: node scripts/check-csp.js */
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bad = [];

if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html)) bad.push("inline <script>");
if (/<style[\s>]/i.test(html)) bad.push("inline <style>");
if (/\sstyle\s*=/i.test(html)) bad.push('style="" attribute');
if (/<(script|link)[^>]+(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html)) bad.push("external script/stylesheet");

for (const f of ["script.js", "terminal.js", "feed.js", "scoreboard.js", "hero3d.js", "config.js"]) {
  const js = fs.readFileSync(path.join(root, f), "utf8");
  if (/setAttribute\(\s*["']style["']/.test(js)) bad.push(`${f}: setAttribute('style')`);
  if (/https?:\/\/[^"'\s]+\.(js|css)\b/.test(js)) bad.push(`${f}: external asset URL`);
  // ES-module imports must resolve to 'self' (relative path), never a CDN or bare specifier
  for (const m of js.matchAll(/\bfrom\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/g)) {
    const spec = m[1] || m[2];
    if (!/^\.\.?\//.test(spec)) bad.push(`${f}: non-relative import "${spec}"`);
    else if (!fs.existsSync(path.join(root, spec))) bad.push(`${f}: missing import target "${spec}"`);
  }
}

if (bad.length) {
  console.error("CSP check FAILED: " + bad.join(", "));
  process.exit(1);
}
console.log("CSP check passed: no inline script/style, no external script/css hosts.");
