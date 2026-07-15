import { describe, expect, it } from "vitest";
import {
  filterDeviceOnlyLinks,
  isDuplicateOfGlobalLink,
  normalizeLinkUrl,
} from "@/lib/link-match";

describe("normalizeLinkUrl", () => {
  it("ignores trailing slash and case", () => {
    expect(normalizeLinkUrl("https://Example.com/path/")).toBe(
      normalizeLinkUrl("https://example.com/path"),
    );
  });
});

describe("filterDeviceOnlyLinks", () => {
  const globals = [
    { id: "g1", label: "ePUAP", url: "https://epuap.gov.pl/" },
    { id: "g2", label: "BIP", url: "https://www.bip.gov.pl/" },
  ];

  it("removes device copies of global links", () => {
    const device = [
      { id: "d1", label: "ePUAP copy", url: "https://epuap.gov.pl/" },
      { id: "d2", label: "Mój", url: "https://intranet.local/" },
    ];
    expect(filterDeviceOnlyLinks(device, globals)).toEqual([
      { id: "d2", label: "Mój", url: "https://intranet.local/" },
    ]);
  });
});

describe("isDuplicateOfGlobalLink", () => {
  it("detects same url as global", () => {
    const globals = [{ id: "g1", label: "BIP", url: "https://bip.gov.pl/" }];
    expect(isDuplicateOfGlobalLink("https://bip.gov.pl/", globals)).toBe(true);
    expect(isDuplicateOfGlobalLink("https://other.gov.pl/", globals)).toBe(
      false,
    );
  });
});
