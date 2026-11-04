import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { offsite } from "./site";

/* The community feed shows 20 reports and a "Show more" button that asks
   the database for the next 20 — by limit/offset, never the whole table.
   The button works from the keyboard, focus lands on the first new card
   instead of being lost, and a polite live region says what was added.

   Supabase is stubbed with 45 reports; the seeded examples (7) come after
   the last real one, so the third press brings in 5 real reports and the
   examples, and the button goes away. */

const TOTAL = 45;
const SEEDS = 7;

const row = (i: number) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  created_at: new Date(Date.UTC(2026, 10, 1, 12) - i * 3_600_000).toISOString(),
  author: `Resident ${i + 1}`,
  city: "Almaty",
  lat: 43.24,
  lon: 76.89,
  category: "air",
  severity: "moderate",
  title: `Pagination report ${i + 1}`,
  body: "Haze over the district since the morning.",
  status: "submitted",
  upvotes: 0,
});
const ROWS = Array.from({ length: TOTAL }, (_, i) => row(i));

async function stubFeed(page: Page, reads: URL[]) {
  await page.route(offsite, (route) => {
    const url = new URL(route.request().url());
    if (!url.host.endsWith(".supabase.co")) return route.fulfill({ status: 204, body: "" });
    if (url.pathname === "/rest/v1/reports" && !url.searchParams.has("id")) {
      reads.push(url);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? TOTAL);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ROWS.slice(offset, offset + limit)),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

/** axe over the whole page; the cast is the same one layout-a11y.spec.ts
 *  needs, for the two packages' copies of the Page type. */
const axe = (page: Page) =>
  new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

const cards = (page: Page) => page.locator('div[tabindex="-1"][id^="report-"]');
const cardId = (i: number) => `#report-${ROWS[i].id}`;

test("first 20, then 20 more per press, by keyboard, with focus and an announcement", async ({ page }) => {
  const reads: URL[] = [];
  await stubFeed(page, reads);
  await page.goto("/community/");

  await expect(page.locator(cardId(0))).toBeVisible();
  await expect(cards(page)).toHaveCount(20);
  await expect(page.locator(cardId(19))).toBeAttached();
  await expect(page.locator(cardId(20))).toHaveCount(0);
  // Examples wait until every real report has been shown.
  await expect(page.locator('[id^="report-seed-"]')).toHaveCount(0);

  const more = page.getByRole("button", { name: "Show more" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(cards(page)).toHaveCount(40);
  await expect(page.locator(cardId(20))).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "20 more reports shown, 40 in the feed now." })).toBeAttached();

  // Back to the button with the keyboard, and once more: the last 5 real
  // reports and then the examples; nothing is left, so the button goes.
  await more.focus();
  await page.keyboard.press("Space");
  await expect(cards(page)).toHaveCount(TOTAL + SEEDS);
  await expect(page.locator(cardId(40))).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: `${TOTAL + SEEDS - 40} more reports shown, ${TOTAL + SEEDS} in the feed now.` })).toBeAttached();
  await expect(more).toHaveCount(0);

  // One page per request, each asking for a page plus one to know whether
  // there is more — never an unbounded read of the table.
  const pages = reads.map((u) => [u.searchParams.get("limit"), u.searchParams.get("offset") ?? "0"]);
  expect(pages).toEqual([
    ["21", "0"],
    ["21", "20"],
    ["21", "40"],
  ]);
  for (const u of reads) expect(u.searchParams.get("order")).toBe("created_at.desc");
});

test("axe finds nothing on the feed before and after Show more", async ({ page }) => {
  await stubFeed(page, []);
  await page.goto("/community/");
  await expect(cards(page)).toHaveCount(20);
  // Cards fade in; wait for them to settle so contrast is measured at rest.
  await page.waitForTimeout(600);
  const before = await axe(page);
  expect(before.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

  await page.getByRole("button", { name: "Show more" }).click();
  await expect(cards(page)).toHaveCount(40);
  await page.waitForTimeout(600);
  const after = await axe(page);
  expect(after.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

for (const [path, label, announced] of [
  ["/ru/community/", "Показать ещё", "Показано ещё: 20. Всего в ленте: 40."],
  ["/kk/community/", "Тағы көрсету", "Тағы 20 хабарлама көрсетілді. Лентада барлығы: 40."],
] as const) {
  test(`${path}: the button and the announcement are in the page's language`, async ({ page }) => {
    await stubFeed(page, []);
    await page.goto(path);
    await expect(cards(page)).toHaveCount(20);
    await page.getByRole("button", { name: label }).click();
    await expect(cards(page)).toHaveCount(40);
    await expect(page.getByRole("status").filter({ hasText: announced })).toBeAttached();
  });
}

test("a failed page keeps the button and focus, and says so", async ({ page }) => {
  let fail = false;
  await page.route(offsite, (route) => {
    const url = new URL(route.request().url());
    if (!url.host.endsWith(".supabase.co")) return route.fulfill({ status: 204, body: "" });
    if (url.pathname === "/rest/v1/reports" && !url.searchParams.has("id")) {
      if (fail) return route.fulfill({ status: 503, body: "" });
      const limit = Number(url.searchParams.get("limit"));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ROWS.slice(0, limit)) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/community/");
  await expect(cards(page)).toHaveCount(20);
  fail = true;
  const more = page.getByRole("button", { name: "Show more" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Could not load more reports.").first()).toBeVisible();
  await expect(more).toBeFocused();
  await expect(cards(page)).toHaveCount(20);
});
