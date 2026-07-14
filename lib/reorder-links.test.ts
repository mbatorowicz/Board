import { describe, expect, it } from "vitest";
import {
  collectLinkIds,
  moveLinkInList,
  reorderLinksByIds,
} from "@/lib/reorder-links";

const sampleLinks = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

describe("reorderLinksByIds", () => {
  it("returns links in requested order", () => {
    expect(reorderLinksByIds(sampleLinks, ["c", "a", "b"])).toEqual([
      { id: "c", label: "C" },
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ]);
  });

  it("returns null when ids count mismatches", () => {
    expect(reorderLinksByIds(sampleLinks, ["a", "b"])).toBeNull();
  });

  it("returns null when id is unknown", () => {
    expect(reorderLinksByIds(sampleLinks, ["a", "b", "z"])).toBeNull();
  });
});

describe("moveLinkInList", () => {
  it("moves dragged item to target index", () => {
    expect(moveLinkInList(sampleLinks, "a", "c")).toEqual({
      next: [
        { id: "b", label: "B" },
        { id: "c", label: "C" },
        { id: "a", label: "A" },
      ],
      dragId: "a",
    });
  });

  it("returns null when drag and target are the same", () => {
    expect(moveLinkInList(sampleLinks, "b", "b")).toBeNull();
  });

  it("returns null when id is missing", () => {
    expect(moveLinkInList(sampleLinks, "x", "b")).toBeNull();
  });
});

describe("collectLinkIds", () => {
  it("collects ids in list order", () => {
    expect(collectLinkIds(sampleLinks)).toEqual(["a", "b", "c"]);
  });
});
