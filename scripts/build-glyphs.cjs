// Map label glyphs (SDF .pbf ranges) for MapLibre, from an OFL font.
//
//   npm i --no-save fontnik            # native; not a project dependency
//   node scripts/build-glyphs.cjs <font.ttf> public/fonts/noto 0 1024
//
// Each number is the start of a 256-codepoint range: 0 → 0-255 (Latin),
// 1024 → 1024-1279 (Cyrillic, including Kazakh Ә І Ң Ғ Ү Ұ Қ Ө Һ). The map
// asks for /fonts/{fontstack}/{range}.pbf (components/map/EnvironmentalMap.tsx)
// and only for ranges its labels use.
//
// Generated 2026-11-03 from Noto Sans Regular (NotoSans_400Regular.ttf from
// @expo-google-fonts/noto-sans 0.4.2, SIL OFL 1.1; see public/fonts/noto/OFL.txt).
const fs = require("node:fs");
const path = require("node:path");
const fontnik = require("fontnik");

const [fontPath, outDir, ...starts] = process.argv.slice(2);
if (!fontPath || !outDir || starts.length === 0) {
  console.error("usage: node scripts/build-glyphs.cjs <font.ttf> <outDir> <rangeStart>...");
  process.exit(2);
}
const font = fs.readFileSync(fontPath);
fs.mkdirSync(outDir, { recursive: true });

for (const s of starts.map(Number)) {
  if (!Number.isInteger(s) || s % 256 !== 0) throw new Error(`range start must be a multiple of 256: ${s}`);
  fontnik.range({ font, start: s, end: s + 255 }, (err, pbf) => {
    if (err) throw err;
    const file = path.join(outDir, `${s}-${s + 255}.pbf`);
    fs.writeFileSync(file, pbf);
    console.log(`${file}: ${pbf.length} bytes`);
  });
}
