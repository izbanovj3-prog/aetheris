import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/* No horizontal scroll at 320 / 375 / 768 / 1024 / 1440 px, and no
   colour-contrast violations (axe), in the normal text size, the largest
   text size (A++) and the light theme.

   The reading preferences are set the way the site sets them — the
   localStorage keys the inline script in app/layout.tsx reads before first
   paint — so this exercises the real path, not a forced attribute. */

const WIDTHS = [320, 375, 768, 1024, 1440];
const MODES = {
  normal: {},
  "text A++": { "aeth-text": "3" },
  light: { "aeth-theme": "light" },
} as const;

const ROUTES = ["/", "/map/", "/dashboard/", "/community/", "/ru/community/", "/kk/", "/privacy/"];

async function prepare(page: Page, prefs: Record<string, string>) {
  await page.addInitScript((p) => {
    for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v);
  }, prefs);
  await page.route(/^https:\/\//, (r) => {
    const url = r.request().url();
    if (url.includes("supabase.co")) return r.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    return r.fulfill({ status: 204, body: "" });
  });
}

/** Elements wider than the viewport, for a useful failure message. */
async function overflowers(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1) {
        const style = getComputedStyle(el);
        // Clipped by an ancestor is not a scroll; only report what scrolls.
        let clipped = false;
        for (let a = el.parentElement; a; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (s.overflowX === "hidden" || s.overflowX === "clip" || s.overflow === "hidden") {
            if (a.getBoundingClientRect().right <= vw + 1) {
              clipped = true;
              break;
            }
          }
        }
        if (!clipped && style.position !== "fixed")
          out.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 60)} right=${Math.round(r.right)}`);
      }
    }
    return out.slice(0, 8);
  });
}

for (const [mode, prefs] of Object.entries(MODES)) {
  for (const width of WIDTHS) {
    test.describe(`${mode} · ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const route of ROUTES) {
        test(`${route} has no horizontal scroll`, async ({ page }) => {
          await prepare(page, prefs);
          await page.goto(route, { waitUntil: "load" });
          await page.waitForTimeout(600);
          const { scroll, client } = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
          }));
          if (scroll > client) {
            expect(scroll, `${route} scrolls sideways: ${(await overflowers(page)).join(" | ")}`).toBeLessThanOrEqual(client);
          }
        });
      }

      // Contrast does not depend on width in this design; check it at two.
      if (width === 375 || width === 1440) {
        for (const route of ROUTES) {
          test(`${route} meets WCAG AA colour contrast`, async ({ page }) => {
            await prepare(page, prefs);
            await page.goto(route, { waitUntil: "load" });
            // Let entrance animations settle so contrast is measured on
            // the final colours, not mid-fade.
            await page.waitForTimeout(2500);
            // @axe-core/playwright is typed against a newer Playwright than
            // the pinned one; the runtime API it uses is the same.
            const results = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] })
              .withRules(["color-contrast"])
              // The map canvas and the globe are pictures, not text.
              .exclude("canvas")
              .analyze();
            const v = results.violations.flatMap((x) =>
              x.nodes.map((n) => `${n.target.join(" ")} — ${n.any[0]?.message ?? ""}`),
            );
            expect(v, v.slice(0, 6).join("\n")).toEqual([]);
          });
        }
      }
    });
  }
}

/* The known case: on /community at 320 px with the largest text, the
   "Sample" mark stuck out of its card by ~6 px. That is clipped rather
   than scrolled, so the scroll check above cannot see it. This checks
   that nothing inside a card extends past the card — except content that
   sits in its own horizontal scroller (the hotspot table). */
test.describe("nothing spills out of its card at 320 px, largest text", () => {
  test.use({ viewport: { width: 320, height: 900 } });
  for (const route of ["/community/", "/ru/community/", "/kk/community/", "/", "/kk/", "/dashboard/"]) {
    test(route, async ({ page }) => {
      await prepare(page, { "aeth-text": "3" });
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(800);
      const spills = await page.evaluate(() => {
        const out: string[] = [];
        for (const card of Array.from(document.querySelectorAll(".glass, .glass-bright"))) {
          const cb = card.getBoundingClientRect();
          for (const el of Array.from(card.querySelectorAll("span, a, button, h2, h3, h4, p"))) {
            let scroller = false;
            for (let a = el.parentElement; a && a !== card; a = a.parentElement) {
              const ox = getComputedStyle(a).overflowX;
              if (ox === "auto" || ox === "scroll") scroller = true;
            }
            const b = el.getBoundingClientRect();
            if (!scroller && b.width && b.right > cb.right + 0.5)
              out.push(`"${(el.textContent || "").trim().slice(0, 30)}" +${Math.round(b.right - cb.right)}px`);
          }
        }
        return out;
      });
      expect(spills, spills.join(" | ")).toEqual([]);
    });
  }
});
