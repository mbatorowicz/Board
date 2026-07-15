import { JSON_CACHE_TTL_MS } from "@/lib/security/limits";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export async function readCachedJson<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = JSON_CACHE_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now < hit.expiresAt) {
    return hit.value as T;
  }

  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateJsonCache(key?: string): void {
  if (key) {
    cache.delete(key);
    return;
  }
  cache.clear();
}
