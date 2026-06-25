import { randomBytes } from "node:crypto";
import { SESSION_TTL_SECONDS } from "@/lib/security/limits";
import {
  createSessionStore,
  hashSessionToken,
  matchesSessionHash,
  pruneExpiredSessions,
} from "@/lib/security/session-store";

const FILE = "admin-sessions.json";
const MAX_SESSIONS = 5;

type StoredSession = {
  tokenHash: string;
  expiresAt: string;
};

function isStoredSession(item: unknown): item is StoredSession {
  return (
    !!item &&
    typeof item === "object" &&
    typeof (item as StoredSession).tokenHash === "string" &&
    typeof (item as StoredSession).expiresAt === "string"
  );
}

const store = createSessionStore(FILE, isStoredSession);

export async function createAdminSessionToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  const sessions = pruneExpiredSessions(await store.readSessions());
  const next = [...sessions, { tokenHash, expiresAt }].slice(-MAX_SESSIONS);
  await store.writeSessions(next);

  return token;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const tokenHash = hashSessionToken(token);
  const sessions = await store.readSessions();
  const pruned = pruneExpiredSessions(sessions);
  const valid = pruned.some((session) =>
    matchesSessionHash(session.tokenHash, tokenHash),
  );

  await store.persistPrunedIfNeeded(sessions, pruned);
  return valid;
}

export async function revokeAdminSessionToken(
  token: string | undefined,
): Promise<void> {
  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);
  const sessions = pruneExpiredSessions(await store.readSessions()).filter(
    (session) => !matchesSessionHash(session.tokenHash, tokenHash),
  );
  await store.writeSessions(sessions);
}

export async function revokeAllAdminSessions(): Promise<void> {
  await store.writeSessions([]);
}
