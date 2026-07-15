import type {
  QuickLink,
  QuickLinkInput,
  User,
  UserPublic,
  UserRole,
} from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { createQuickLink } from "@/lib/quick-link";
import { hashPin, verifyPin } from "@/lib/security/pin-hash";
import { isQuickLink, isUserRole } from "@/lib/type-guards";
import {
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  PIN_PRIVILEGED_MAX_LENGTH,
  PIN_PRIVILEGED_MIN_LENGTH,
  LIMITS,
} from "@/lib/security/limits";
import {
  clampText,
  isNonEmpty,
  validateLinkInput,
} from "@/lib/security/validate";

const FILE = "users.json";

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.pinHash !== "string" ||
    typeof item.createdAt !== "string" ||
    !isUserRole(item.role)
  ) {
    return null;
  }

  const personalLinks = Array.isArray(item.personalLinks)
    ? item.personalLinks.filter(isQuickLink).slice(0, LIMITS.personalLinksMax)
    : [];

  return {
    id: item.id,
    name: clampText(item.name, LIMITS.name),
    role: item.role,
    pinHash: item.pinHash,
    personalLinks,
    createdAt: item.createdAt,
    ...(typeof item.lastSeenAt === "string"
      ? { lastSeenAt: item.lastSeenAt }
      : {}),
    ...(typeof item.lastIp === "string" ? { lastIp: item.lastIp } : {}),
    ...(typeof item.lastHost === "string" ? { lastHost: item.lastHost } : {}),
  };
}

async function readList(): Promise<User[]> {
  const data = await readJsonFile<unknown[]>(FILE);
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeUser)
    .filter((user): user is User => user !== null);
}

async function writeList(users: User[]): Promise<void> {
  await writeJsonFile(FILE, users);
}

function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

export function validatePin(pin: string, role: UserRole = "reader"): string | null {
  const value = pin.trim();
  if (isPrivilegedRole(role)) {
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return null;
    }
    if (
      value.length < PIN_PRIVILEGED_MIN_LENGTH ||
      value.length > PIN_PRIVILEGED_MAX_LENGTH
    ) {
      return null;
    }
    return value;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }
  if (value.length < PIN_MIN_LENGTH || value.length > PIN_MAX_LENGTH) {
    return null;
  }
  return value;
}

export function validateUserName(name: string): string | null {
  const value = clampText(name, LIMITS.name);
  return isNonEmpty(value) ? value : null;
}

export async function getUsers(): Promise<User[]> {
  return readList();
}

export function toPublicUser(user: User): UserPublic {
  const { pinHash: _pinHash, ...publicUser } = user;
  return publicUser;
}

export async function getPublicUsers(): Promise<UserPublic[]> {
  return (await readList()).map(toPublicUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readList();
  return users.find((user) => user.id === id) ?? null;
}

export async function findUserByName(name: string): Promise<User | null> {
  const normalized = validateUserName(name);
  if (!normalized) return null;
  const users = await readList();
  const lower = normalized.toLocaleLowerCase("pl");
  return (
    users.find(
      (user) => user.name.toLocaleLowerCase("pl") === lower,
    ) ?? null
  );
}

export async function createUser(input: {
  name: string;
  role: UserRole;
  pin: string;
}): Promise<User | null> {
  const name = validateUserName(input.name);
  const pin = validatePin(input.pin, input.role);
  if (!name || !pin || !isUserRole(input.role)) return null;

  const users = await readList();
  if (users.some((user) => user.name.toLocaleLowerCase("pl") === name.toLocaleLowerCase("pl"))) {
    return null;
  }

  const user: User = {
    id: crypto.randomUUID(),
    name,
    role: input.role,
    pinHash: hashPin(pin),
    personalLinks: [],
    createdAt: new Date().toISOString(),
  };

  await writeList([...users, user]);
  return user;
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<boolean> {
  if (!isUserRole(role)) return false;
  const users = await readList();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  users[index] = { ...users[index]!, role };
  await writeList(users);
  return true;
}

export async function resetUserPin(id: string, pin: string): Promise<boolean> {
  const users = await readList();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  const validated = validatePin(pin, users[index]!.role);
  if (!validated) return false;
  users[index] = { ...users[index]!, pinHash: hashPin(validated) };
  await writeList(users);
  return true;
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await readList();
  const next = users.filter((user) => user.id !== id);
  if (next.length === users.length) return false;
  await writeList(next);
  return true;
}

export async function verifyUserPin(
  userId: string,
  pin: string,
): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const validated = validatePin(pin, user.role);
  if (!validated || !verifyPin(validated, user.pinHash)) return null;
  return user;
}

export async function verifyUserCredentials(
  input: { userId?: string; name?: string; pin: string },
): Promise<User | null> {
  let user: User | null = null;
  if (input.userId) {
    user = await getUserById(input.userId);
  } else if (input.name) {
    user = await findUserByName(input.name);
  }
  if (!user) return null;

  const pin = validatePin(input.pin, user.role);
  if (!pin || !verifyPin(pin, user.pinHash)) return null;
  return user;
}

export async function touchUserActivity(
  userId: string,
  meta: { ip?: string; host?: string },
): Promise<void> {
  const users = await readList();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return;

  users[index] = {
    ...users[index]!,
    lastSeenAt: new Date().toISOString(),
    ...(meta.ip ? { lastIp: meta.ip.slice(0, 45) } : {}),
    ...(meta.host ? { lastHost: meta.host.slice(0, 253) } : {}),
  };
  await writeList(users);
}

export async function getUserPersonalLinks(
  userId: string,
): Promise<QuickLink[]> {
  const user = await getUserById(userId);
  return user?.personalLinks ?? [];
}

export async function saveUserPersonalLinks(
  userId: string,
  links: QuickLink[],
): Promise<boolean> {
  const users = await readList();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return false;
  users[index] = {
    ...users[index]!,
    personalLinks: links.slice(0, LIMITS.personalLinksMax),
  };
  await writeList(users);
  return true;
}

export async function addUserPersonalLink(
  userId: string,
  input: QuickLinkInput,
): Promise<{ link: QuickLink } | { error: "limit" | "invalid" }> {
  const user = await getUserById(userId);
  if (!user) return { error: "invalid" };
  if (user.personalLinks.length >= LIMITS.personalLinksMax) {
    return { error: "limit" };
  }
  const validated = validateLinkInput(input);
  if (!validated) return { error: "invalid" };
  const link = createQuickLink(validated);
  const ok = await saveUserPersonalLinks(userId, [
    ...user.personalLinks,
    link,
  ]);
  return ok ? { link } : { error: "invalid" };
}

export async function removeUserPersonalLink(
  userId: string,
  linkId: string,
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  const next = user.personalLinks.filter((link) => link.id !== linkId);
  return saveUserPersonalLinks(userId, next);
}

export async function importUserPersonalLinks(
  userId: string,
  links: QuickLink[],
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  const valid: QuickLink[] = [];
  for (const raw of links) {
    if (!isQuickLink(raw)) continue;
    const input = validateLinkInput({
      label: raw.label,
      url: raw.url,
      description: raw.description,
    });
    if (!input) continue;
    valid.push({ id: raw.id, ...input });
  }

  const merged = [...user.personalLinks];
  for (const link of valid) {
    if (merged.length >= LIMITS.personalLinksMax) break;
    if (!merged.some((existing) => existing.id === link.id)) {
      merged.push(link);
    }
  }
  return saveUserPersonalLinks(userId, merged);
}
