#!/usr/bin/env node
/* Vendors a pinned, tree-shaken ES-module build of Three.js into assets/vendor/
   so the site can import it from 'self' under the strict CSP (no CDN).
   Run: node scripts/vendor-three.js      (needs npm, tar and network; uses npx esbuild)
   Output: assets/vendor/three-<VERSION>.slim.module.min.js  (+ three.LICENSE)
   Only the exports hero3d.js uses are kept; add to EXPORTS and re-run to extend. */
"use strict";
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const VERSION = "0.160.0";
const EXPORTS = [
  "WebGLRenderer", "Scene", "PerspectiveCamera", "Group", "BufferGeometry", "BufferAttribute",
  "LineSegments", "Points", "Mesh", "PlaneGeometry", "ShaderMaterial", "Color",
  "CustomBlending", "OneFactor", "OneMinusSrcAlphaFactor", "REVISION"
];

const root = path.join(__dirname, "..");
const outDir = path.join(root, "assets", "vendor");
const out = path.join(outDir, `three-${VERSION}.slim.module.min.js`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "three-vendor-"));
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

run(`npm pack three@${VERSION} --silent`, tmp);
run(`tar -xzf three-${VERSION}.tgz`, tmp);
const entry = path.join(tmp, "entry.js");
fs.writeFileSync(entry, `export { ${EXPORTS.join(", ")} } from "./package/build/three.module.js";\n`);
fs.mkdirSync(outDir, { recursive: true });
run(`npx -y esbuild "${entry}" --bundle --minify --format=esm --target=es2020 --legal-comments=none --outfile="${out}"`, tmp);

const banner = `/* three@${VERSION} — tree-shaken ESM subset (MIT, see three.LICENSE). Built by scripts/vendor-three.js. Exports: ${EXPORTS.join(", ")} */\n`;
fs.writeFileSync(out, banner + fs.readFileSync(out, "utf8"));
fs.copyFileSync(path.join(tmp, "package", "LICENSE"), path.join(outDir, "three.LICENSE"));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`vendored ${path.relative(root, out)} (${fs.statSync(out).size} bytes)`);
