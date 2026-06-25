import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { USER_SESSION_TTL_SECONDS } from "@/lib/security/limits";
import {
  createSessionStore,
  hashSessionToken,
  matchesSessionHash,
  pruneExpiredSessions,
} from "@/lib/security/session-store";
import { getUserById, touchUserActivity } from "@/lib/users";
import type { User } from "@/lib/types";
import { cookieSecure } from "@/lib/cookie-secure";

const FILE = "user-sessions.json";
export const USER_SESSION_COOKIE = "user_session";
const MAX_SESSIONS = 200;

type StoredSession = {
  tokenHash: string;
  userId: string;
  ip?: string;
  host?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

function isStoredSession(item: unknown): item is StoredSession {
  if (!item || typeof item !== "object") return false;
  const session = item as StoredSession;
  return (
    typeof session.tokenHash === "string" &&
    typeof session.userId === "string" &&
    typeof session.createdAt === "string" &&
    typeof session.lastSeenAt === "string" &&
    typeof session.expiresAt === "string"
  );
}

const store = createSessionStore(FILE, isStoredSession);

export async function createUserSessionToken(
  userId: string,
  meta: { ip?: string; host?: string },
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + USER_SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  const session: StoredSession = {
    tokenHash,
    userId,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt,
    ...(meta.ip ? { ip: meta.ip } : {}),
    ...(meta.host ? { host: meta.host } : {}),
  };

  const sessions = pruneExpiredSessions(await store.readSessions());
  const next = [...sessions, session].slice(-MAX_SESSIONS);
  await store.writeSessions(next);
  await touchUserActivity(userId, meta);

  return token;
}

async function findSessionByToken(
  token: string | undefined,
): Promise<StoredSession | null> {
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const sessions = await store.readSessions();
  const pruned = pruneExpiredSessions(sessions);
  const match = pruned.find((session) =>
    matchesSessionHash(session.tokenHash, tokenHash),
  );

  await store.persistPrunedIfNeeded(sessions, pruned);
  return match ?? null;
}

export async function verifyUserSessionToken(
  token: string | undefined,
): Promise<StoredSession | null> {
  return findSessionByToken(token);
}

export async function revokeUserSessionToken(
  token: string | undefined,
): Promise<void> {
  if (!token) return;

  const tokenHash = hashSessionToken(token);
  const sessions = pruneExpiredSessions(await store.readSessions()).filter(
    (session) => !matchesSessionHash(session.tokenHash, tokenHash),
  );
  await store.writeSessions(sessions);
}

export async function setUserSessionCookie(
  token: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(),
    path: "/",
    maxAge: USER_SESSION_TTL_SECONDS,
  });
}

export async function clearUserSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const session = await verifyUserSessionToken(token);
  if (!session) return null;
  return getUserById(session.userId);
}

export async function getUserFromRequest(
  request: NextRequest,
): Promise<{ userId: string; userName: string } | null> {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const session = await verifyUserSessionToken(token);
  if (!session) return null;
  const user = await getUserById(session.userId);
  if (!user) return null;
  return { userId: user.id, userName: user.name };
}
