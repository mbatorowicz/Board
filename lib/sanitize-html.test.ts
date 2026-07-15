import { describe, expect, it } from "vitest";
import {
  htmlToPlainText,
  isNonEmptyHtml,
  sanitizeAnnouncementHtml,
} from "@/lib/sanitize-html";

describe("sanitizeAnnouncementHtml", () => {
  it("keeps basic formatting", () => {
    const html = "<p><strong>Ważne</strong> ogłoszenie</p>";
    expect(sanitizeAnnouncementHtml(html)).toContain("<strong>Ważne</strong>");
  });

  it("removes script tags", () => {
    const html = '<p>OK</p><script>alert(1)</script>';
    expect(sanitizeAnnouncementHtml(html)).not.toContain("script");
  });

  it("allows only internal image urls", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const allowed = `<img src="/api/announcement-file?id=${id}" alt="x">`;
    const blocked = '<img src="https://evil.test/x.png" alt="x">';
    expect(sanitizeAnnouncementHtml(allowed)).toContain(
      `/api/announcement-file?id=${id}`,
    );
    expect(sanitizeAnnouncementHtml(blocked)).not.toContain("evil.test");
  });
});

describe("htmlToPlainText", () => {
  it("extracts visible text", () => {
    expect(htmlToPlainText("<p>Hello <em>world</em></p>")).toBe("Hello world");
  });

  it("detects empty rich text", () => {
    expect(isNonEmptyHtml("<p></p><p><br></p>")).toBe(false);
    expect(isNonEmptyHtml("<p>Treść</p>")).toBe(true);
  });
});
