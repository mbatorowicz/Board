import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { SESSION_TTL_SECONDS } from "@/lib/security/limits";

const FILE = "admin-sessions.json";
const MAX_SESSIONS = 5;

type StoredSession = {
  tokenHash: string;
  expiresAt: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function matchesHash(stored: string, provided: string): boolean {
  const left = Buffer.from(stored);
  const right = Buffer.from(provided);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

async function readSessions(): Promise<StoredSession[]> {
  const data = await readJsonFile<StoredSession[]>(FILE);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(
    (item) =>
      typeof item.tokenHash === "string" &&
      typeof item.expiresAt === "string",
  );
}

async function writeSessions(sessions: StoredSession[]): Promise<void> {
  await writeJsonFile(FILE, sessions);
}

function pruneExpired(sessions: StoredSession[]): StoredSession[] {
  const now = Date.now();
  return sessions.filter((session) => {
    const expiresAt = Date.parse(session.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

export async function createAdminSessionToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  const sessions = pruneExpired(await readSessions());
  const next = [...sessions, { tokenHash, expiresAt }].slice(-MAX_SESSIONS);
  await writeSessions(next);

  return token;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const tokenHash = hashToken(token);
  const sessions = await readSessions();
  const pruned = pruneExpired(sessions);
  const valid = pruned.some((session) =>
    matchesHash(session.tokenHash, tokenHash),
  );

  if (pruned.length !== sessions.length) {
    await writeSessions(pruned);
  }
  return valid;
}

export async function revokeAdminSessionToken(
  token: string | undefined,
): Promise<void> {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  const sessions = pruneExpired(await readSessions()).filter(
    (session) => !matchesHash(session.tokenHash, tokenHash),
  );
  await writeSessions(sessions);
}

export async function revokeAllAdminSessions(): Promise<void> {
  await writeSessions([]);
}
