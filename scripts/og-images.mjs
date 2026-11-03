// Render the Open Graph / Twitter preview images for each language.
//
//   node scripts/og-images.mjs
//
// Writes app/{,ru/,kk/}{opengraph,twitter}-image.png and matching .alt.txt.
// Next picks each up for its own route segment. The text is the claim a
// preview makes about the site, so it follows the same rule as the pages:
// air quality is live open data, water / industrial pollution /
// biodiversity are modelled, resident reports are unchecked.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const COPY = {
  en: {
    dir: "app",
    pill: "Independent student project",
    title: ["Kazakhstan’s environment,", "on one open map."],
    lede: "Air quality from open data (Open-Meteo / CAMS). Water, industrial pollution and biodiversity are modelled estimates — and marked as such.",
    foot: ["28 cities", "Modelled values marked", "Resident reports, unchecked"],
    alt: "Aetheris — Kazakhstan’s environment on one open map. Air quality from open data; water, industrial pollution and biodiversity are modelled estimates, marked as such.",
  },
  ru: {
    dir: "app/ru",
    pill: "Независимый студенческий проект",
    title: ["Состояние окружающей среды", "Казахстана — на одной карте."],
    lede: "Качество воздуха — по открытым данным (Open-Meteo / CAMS). Вода, промышленное загрязнение и биоразнообразие — модельные оценки, и это отмечено.",
    foot: ["28 городов", "Модельные значения помечены", "Сообщения жителей не проверены"],
    alt: "Aetheris — состояние окружающей среды Казахстана на одной карте. Качество воздуха по открытым данным; вода, промышленное загрязнение и биоразнообразие — модельные оценки, отмеченные как таковые.",
  },
  kk: {
    dir: "app/kk",
    pill: "Тәуелсіз студенттік жоба",
    title: ["Қазақстанның қоршаған ортасы —", "бір ашық картада."],
    lede: "Ауа сапасы — ашық деректер бойынша (Open-Meteo / CAMS). Су, өнеркәсіптік ластану және биоалуантүрлілік — модельдік бағалаулар, бұл белгіленген.",
    foot: ["28 қала", "Модельдік мәндер белгіленген", "Тұрғындар хабарламалары тексерілмеген"],
    alt: "Aetheris — Қазақстанның қоршаған ортасы бір ашық картада. Ауа сапасы ашық деректер бойынша; су, өнеркәсіптік ластану және биоалуантүрлілік — модельдік бағалаулар, солай белгіленген.",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html(c) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#030608;color:#e9f3f4;font-family:Inter,sans-serif;
       position:relative;overflow:hidden;padding:72px 80px}
  .glow{position:absolute;inset:-200px -200px auto auto;width:700px;height:700px;
        background:radial-gradient(circle,rgba(79,216,247,.10),transparent 60%)}
  .top{display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:22px;font-size:30px;letter-spacing:.32em}
  .mark{width:76px;height:76px;border-radius:16px;border:1px solid #23343c;display:grid;place-items:center;
        font-weight:700;font-size:30px;letter-spacing:0;background:#0a1116}
  .pill{border:1px solid rgba(45,226,166,.45);color:#2de2a6;border-radius:999px;padding:12px 24px;font-size:22px;
        letter-spacing:.06em}
  h1{font-size:58px;line-height:1.1;font-weight:500;margin-top:52px;letter-spacing:-.01em}
  h1 span{display:block}
  h1 span:last-child{color:#2de2a6}
  p{font-size:25px;line-height:1.42;color:#a9bcc3;margin-top:24px;max-width:1010px}
  .foot{position:absolute;left:80px;bottom:56px;display:flex;gap:22px;font-size:22px;color:#4fd8f7}
  .foot i{color:#3b4b52;font-style:normal}
  .bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#2de2a6,#4fd8f7,#4f9dde)}
  </style></head><body><div class="glow"></div>
  <div class="top"><div class="brand"><div class="mark">Æ</div>AETHERIS</div><div class="pill">${esc(c.pill)}</div></div>
  <h1>${c.title.map((t) => `<span>${esc(t)}</span>`).join("")}</h1>
  <p>${esc(c.lede)}</p>
  <div class="foot">${c.foot.map(esc).join("<i>•</i>")}</div>
  <div class="bar"></div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const [locale, c] of Object.entries(COPY)) {
  await page.setContent(html(c), { waitUntil: "load" });
  // Nothing may overflow the card: a clipped claim is a different claim.
  const overflow = await page.evaluate(() => {
    const p = document.querySelector("p").getBoundingClientRect();
    const foot = document.querySelector(".foot").getBoundingClientRect();
    const h1 = [...document.querySelectorAll("h1 span")].some((s) => s.getBoundingClientRect().right > 1120);
    return p.bottom > foot.top - 16 || foot.right > 1120 || h1;
  });
  if (overflow) throw new Error(`${locale}: preview text overflows 1200×630`);
  const png = await page.screenshot({ type: "png" });
  for (const kind of ["opengraph-image", "twitter-image"]) {
    writeFileSync(join(c.dir, `${kind}.png`), png);
    writeFileSync(join(c.dir, `${kind}.alt.txt`), c.alt);
  }
  console.log(`${locale}: ${c.dir}`);
}
await browser.close();
