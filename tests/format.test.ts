import { describe, expect, it } from "vitest";
import { formatInt } from "@/lib/i18n";

/* formatInt exists because toLocaleString() output differs between the Node
   that prerenders and the visitor's browser, which broke hydration on /kk/.
   It must be a pure function of its inputs. */
describe("formatInt", () => {
  it("groups thousands with a comma in English", () => {
    expect(formatInt(4032, "en")).toBe("4,032");
    expect(formatInt(1234567, "en")).toBe("1,234,567");
  });

  it("groups with a no-break space in Russian and Kazakh", () => {
    expect(formatInt(4032, "ru")).toBe("4 032");
    expect(formatInt(4032, "kk")).toBe("4 032");
  });

  it("leaves short numbers alone and rounds fractions", () => {
    expect(formatInt(999, "ru")).toBe("999");
    expect(formatInt(0, "en")).toBe("0");
    expect(formatInt(1234.6, "en")).toBe("1,235");
  });
});
