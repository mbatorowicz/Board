import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel"];

function isAllowedAssetUrl(value: string): boolean {
  if (!value.startsWith("/api/announcement-file?id=")) {
    return false;
  }
  const id = value.slice("/api/announcement-file?id=".length).split("&")[0];
  return /^[0-9a-f-]{36}$/i.test(id);
}

DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (data.attrName === "href" && data.attrValue) {
    if (
      !data.attrValue.startsWith("https://") &&
      !(
        process.env.NODE_ENV !== "production" &&
        data.attrValue.startsWith("http://")
      )
    ) {
      data.keepAttr = false;
    }
  }

  if (data.attrName === "src" && node.tagName === "IMG") {
    if (!isAllowedAssetUrl(data.attrValue)) {
      data.keepAttr = false;
    }
  }
});

export function sanitizeAnnouncementHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export function htmlToPlainText(html: string): string {
  const sanitized = sanitizeAnnouncementHtml(html);
  return sanitized
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNonEmptyHtml(html: string): boolean {
  return htmlToPlainText(html).length > 0;
}
