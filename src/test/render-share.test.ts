import { describe, it, expect } from "vitest";
import { computeTotal, renderShare } from "@/lib/render-share";

describe("share snapshot", () => {
  it("adds GST on net, then TCS on net+GST", () => {
    // 2 pax x 10000 + 1000 service - 500 discount = 20500; GST 5% = 1025; TCS 5% of 21525 = 1076
    expect(computeTotal({ pp: 10000, pax: 2, svc: [{ a: 1000 }], disc: 500, gst: 5, tcs: 5 })).toBe(22601);
  });
  it("never shows internal contact details", () => {
    const html = renderShare({ pkg: "Char Dham", email: "secret@x.com", phone: "999", bank: "ACC123" });
    expect(html).not.toContain("secret@x.com");
    expect(html).not.toContain("ACC123");
  });
});
