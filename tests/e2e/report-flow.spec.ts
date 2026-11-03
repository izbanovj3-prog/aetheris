import { expect, test, type Page, type Request } from "@playwright/test";

/* The main resident scenario: file a report, end to end, to the
   confirmation screen — with the database stubbed, so this runs offline
   and never writes anywhere. Along the way it checks the privacy promises
   the form makes:

     • the photo's EXIF (including GPS) is gone after processing;
     • neither the photo nor the precise pin is sent to the database;
     • nothing is sent until the person has ticked the consent box. */

/** A minimal but well-formed EXIF APP1 segment carrying a GPS latitude. */
function exifApp1WithGps(): Buffer {
  const tiff = Buffer.alloc(80);
  tiff.write("II", 0, "ascii");
  tiff.writeUInt16LE(0x2a, 2);
  tiff.writeUInt32LE(8, 4);
  // IFD0: one entry → GPSInfo IFD at offset 26
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8825, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(26, 18);
  tiff.writeUInt32LE(0, 22);
  // GPS IFD: LatitudeRef "N", Latitude 43/1 14/1 1800/100
  tiff.writeUInt16LE(2, 26);
  tiff.writeUInt16LE(0x0001, 28);
  tiff.writeUInt16LE(2, 30);
  tiff.writeUInt32LE(2, 32);
  tiff.write("N\0", 36, "ascii");
  tiff.writeUInt16LE(0x0002, 40);
  tiff.writeUInt16LE(5, 42);
  tiff.writeUInt32LE(3, 44);
  tiff.writeUInt32LE(56, 48);
  tiff.writeUInt32LE(0, 52);
  [43, 1, 14, 1, 1800, 100].forEach((v, i) => tiff.writeUInt32LE(v, 56 + i * 4));
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
  const header = Buffer.from([0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
}

/** A real camera-sized JPEG, made by the browser, with EXIF spliced in. */
async function jpegWithExif(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 900;
    const ctx = c.getContext("2d")!;
    for (let y = 0; y < 900; y += 6)
      for (let x = 0; x < 1200; x += 6) {
        ctx.fillStyle = `rgb(${(x * 7) % 255},${(y * 5) % 255},${(x + y) % 255})`;
        ctx.fillRect(x, y, 6, 6);
      }
    return c.toDataURL("image/jpeg", 0.9).split(",")[1];
  });
  const jpeg = Buffer.from(b64, "base64");
  // SOI, then our APP1, then the rest.
  return Buffer.concat([jpeg.subarray(0, 2), exifApp1WithGps(), jpeg.subarray(2)]);
}

const hasExif = (buf: Buffer) =>
  buf.includes(Buffer.from("Exif\0\0", "binary")) || buf.includes(Buffer.from([0xff, 0xe1]));

async function stubBackend(page: Page, posted: Request[]) {
  // Everything off-site is cut: map tiles, weather, species. The test is
  // about the form, and must not depend on — or talk to — anything outside.
  await page.route(/^https:\/\/(?!localhost)/, (route) => {
    const url = route.request().url();
    if (!url.includes("supabase.co")) return route.fulfill({ status: 204, body: "" });

    const req = route.request();
    if (req.method() === "POST" && /\/rest\/v1\/reports/.test(url)) {
      posted.push(req);
      const sent = JSON.parse(req.postData() ?? "{}");
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([
          {
            ...sent,
            id: "00000000-0000-4000-8000-00000000e2e1",
            created_at: new Date().toISOString(),
            author: "Anonymous",
            status: "submitted",
            upvotes: 0,
          },
        ]),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.use({
  geolocation: { latitude: 43.238123, longitude: 76.889456 },
  permissions: ["geolocation"],
});

test("a resident files a report and reaches the confirmation screen", async ({ page }) => {
  const posted: Request[] = [];
  await stubBackend(page, posted);
  await page.goto("/community/");

  await page.getByRole("button", { name: "New report" }).click();

  // 1 · Photo — with EXIF/GPS in the original file.
  const original = await jpegWithExif(page);
  expect(hasExif(original)).toBe(true);
  await page.locator("#report-photo").setInputFiles({
    name: "camera.jpg",
    mimeType: "image/jpeg",
    buffer: original,
  });
  const preview = page.getByRole("img", { name: "Report photo preview" });
  await expect(preview).toBeVisible();
  const processed = Buffer.from(
    ((await preview.getAttribute("src")) ?? "").split(",")[1] ?? "",
    "base64",
  );
  expect(processed.length).toBeGreaterThan(1000);
  expect(hasExif(processed), "EXIF survived processing").toBe(false);
  await page.getByRole("button", { name: "Continue" }).click();

  // 2 · Location — from (stubbed) geolocation; city derived from the pin.
  await expect(page.locator("#report-city")).toHaveValue(/.+/);
  await page.getByRole("button", { name: "Continue" }).click();

  // 3 · Category
  await page.getByRole("button", { name: /Air/ }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 4 · Details + consent
  await page.locator("#report-note").fill("Grey smoke over the river since morning.");
  const submit = page.getByRole("button", { name: "Submit report" });
  await expect(submit, "submit must wait for consent").toBeDisabled();
  expect(posted).toHaveLength(0);
  await page.getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
  await submit.click();

  // 5 · Confirmation — and it does not claim more than happened.
  await expect(page.getByText("Your report is stored and is now visible to everyone")).toBeVisible();
  await expect(page.getByText(/nobody has reviewed it, no instrument/)).toBeVisible();

  expect(posted).toHaveLength(1);
  const body = posted[0].postData() ?? "";
  const sent = JSON.parse(body);
  expect(sent.lat).toBe(43.24);
  expect(sent.lon).toBe(76.89);
  expect(body).not.toContain("data:image");
  expect(sent).not.toHaveProperty("photo");
  expect(sent).not.toHaveProperty("author");
  expect(posted[0].url()).not.toContain("anon_id");
});
