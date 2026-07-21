import { describe, expect, it } from "vitest";
import { BOTTOM_NAV_ITEMS } from "@/navigation";

describe("Bottom Navigation V2 config", () => {
  it("defines five equal destinations with icons and compact labels", () => {
    expect(BOTTOM_NAV_ITEMS).toHaveLength(5);
    expect(BOTTOM_NAV_ITEMS.map((item) => item.domain)).toEqual([
      "home",
      "products",
      "commitments",
      "insights",
      "profile"
    ]);
    expect(BOTTOM_NAV_ITEMS.every((item) => item.icon && item.href && item.label)).toBe(true);
    expect(BOTTOM_NAV_ITEMS.every((item) => item.navLabel.length > 0)).toBe(true);
  });

  it("uses a short nav label for Commitments while keeping the full page name", () => {
    const commitments = BOTTOM_NAV_ITEMS.find((item) => item.domain === "commitments");

    expect(commitments?.label).toBe("Commitments");
    expect(commitments?.navLabel).toBe("Due");
    expect(commitments?.navLabel.length).toBeLessThanOrEqual(5);
  });

  it("keeps nav labels readable on narrow viewports without awkward abbreviations", () => {
    for (const item of BOTTOM_NAV_ITEMS) {
      expect(item.navLabel).not.toMatch(/\./);
      expect(item.navLabel.length).toBeLessThanOrEqual(8);
    }
  });

  it("uses unique hrefs for every tab", () => {
    const hrefs = BOTTOM_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
