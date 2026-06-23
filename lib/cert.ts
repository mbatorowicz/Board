import { XMLParser } from "fast-xml-parser";

import { CERT_FEED_URL, FEED_REVALIDATE_SECONDS } from "@/lib/config";
import { LIMITS } from "@/lib/security/limits";
import { sanitizeCertLink } from "@/lib/security/validate";
import type { CertAdvisory } from "@/lib/types";

const MAX_DESCRIPTION_LENGTH = 280;

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as { "#text": unknown })["#text"];
    if (typeof text === "string") return text;
    if (typeof text === "number" || typeof text === "boolean") {
      return String(text);
    }
  }
  return "";
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function cleanDescription(raw: unknown): string {
  const text = asString(raw);
  if (!text) return "";

  const withoutTags = text.replace(/<[^>]*>/g, " ");
  const decoded = decodeEntities(withoutTags);
  const collapsed = decoded.replace(/\s+/g, " ").trim();

  if (collapsed.length > MAX_DESCRIPTION_LENGTH) {
    return `${collapsed.slice(0, MAX_DESCRIPTION_LENGTH).trim()}…`;
  }
  return collapsed;
}

function pickCategory(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? asString(raw[0]) : "";
  }
  return asString(raw);
}

function toIsoDate(raw: unknown): string {
  const text = asString(raw);
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

export async function getAdvisories(): Promise<CertAdvisory[]> {
  try {
    const response = await fetch(CERT_FEED_URL, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: { "user-agent": "urzad-homepage/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Nieoczekiwany status odpowiedzi: ${response.status}`);
    }

    const xmlBuffer = await response.arrayBuffer();
    if (xmlBuffer.byteLength > LIMITS.certFeedMaxBytes) {
      throw new Error("Kanał CERT przekroczył dozwolony rozmiar.");
    }

    const xml = new TextDecoder().decode(xmlBuffer);
    const parser = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    });
    const parsed = parser.parse(xml);

    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) return [];

    const items: unknown[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    const advisories: CertAdvisory[] = items.map((rawItem) => {
      const item = (rawItem ?? {}) as Record<string, unknown>;

      const link = sanitizeCertLink(asString(item.link));
      const guidId = asString(item.guid);
      const id = guidId || link;

      const title = asString(item.title);
      const description = cleanDescription(item.description);
      const category = pickCategory(item.category);
      const pubDate = toIsoDate(item.pubDate);

      const critical =
        category === "Dla administratorów" ||
        /krytyczn/i.test(title) ||
        /krytyczn/i.test(description);

      return { id, title, link, description, category, pubDate, critical };
    });

    advisories.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

    return advisories;
  } catch (error) {
    console.error("Nie udało się pobrać komunikatów CERT:", error);
    return [];
  }
}
