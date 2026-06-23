import { getAllowedIps as getEnvAllowedIps } from "./config";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { isValidAllowlistRule } from "@/lib/security/validate";

const FILE = "allowlist.json";
const CACHE_TTL_MS = 5000;

let cache: { value: string[]; at: number } | null = null;

export function normalizeIps(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (value && !seen.has(value) && isValidAllowlistRule(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

async function readRaw(): Promise<string[] | null> {
  const data = await readJsonFile<unknown>(FILE);
  return Array.isArray(data)
    ? data.filter((item): item is string => typeof item === "string")
    : null;
}

export async function getAllowedIps(): Promise<string[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  const raw = await readRaw();
  const value = normalizeIps(raw ?? getEnvAllowedIps());
  cache = { value, at: Date.now() };
  return value;
}

export async function saveAllowedIps(values: string[]): Promise<void> {
  const normalized = normalizeIps(values);
  await writeJsonFile(FILE, normalized);
  cache = { value: normalized, at: Date.now() };
}
