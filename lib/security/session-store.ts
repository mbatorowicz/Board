import { createHash, timingSafeEqual } from "node:crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";

export type SessionWithExpiry = {
  tokenHash: string;
  expiresAt: string;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function matchesSessionHash(stored: string, provided: string): boolean {
  const left = Buffer.from(stored);
  const right = Buffer.from(provided);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function pruneExpiredSessions<T extends SessionWithExpiry>(
  sessions: T[],
): T[] {
  const now = Date.now();
  return sessions.filter((session) => {
    const expiresAt = Date.parse(session.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

export function createSessionStore<T extends SessionWithExpiry>(
  file: string,
  isValid: (item: unknown) => item is T,
) {
  async function readSessions(): Promise<T[]> {
    const data = await readJsonFile<T[]>(file);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(isValid);
  }

  async function writeSessions(sessions: T[]): Promise<void> {
    await writeJsonFile(file, sessions);
  }

  async function readPrunedSessions(): Promise<T[]> {
    return pruneExpiredSessions(await readSessions());
  }

  async function persistPrunedIfNeeded(
    sessions: T[],
    pruned: T[],
  ): Promise<void> {
    if (pruned.length !== sessions.length) {
      await writeSessions(pruned);
    }
  }

  return {
    readSessions,
    writeSessions,
    readPrunedSessions,
    persistPrunedIfNeeded,
  };
}
