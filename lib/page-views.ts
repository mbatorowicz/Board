import type {
  HomePageViewStats,
  PageView,
  PageViewInput,
} from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { LIMITS } from "@/lib/security/limits";

const FILE = "page-views.json";
const HOME_PATH = "/";
const STATS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const STATS_WINDOW_30_MS = 30 * 24 * 60 * 60 * 1000;

export interface UserPageViewStats {
  userId: string;
  userName: string;
  visitsLast7Days: number;
  visitsLast30Days: number;
  lastVisit: PageView | null;
}

function sortPageViews(list: PageView[]): PageView[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function readList(): Promise<PageView[]> {
  const data = await readJsonFile<PageView[]>(FILE);
  return Array.isArray(data) ? data : [];
}

async function writeList(list: PageView[]): Promise<void> {
  await writeJsonFile(FILE, list);
}

function dedupeKey(
  view: Pick<PageView, "path" | "host" | "ip" | "userId">,
): string {
  return `${view.path}\0${view.host}\0${view.ip ?? ""}\0${view.userId ?? ""}`;
}

function isDuplicateRecent(
  list: PageView[],
  input: PageViewInput,
  nowMs: number,
): boolean {
  const key = dedupeKey(input);
  const cutoff = nowMs - LIMITS.pageViewDedupeMs;

  return list.some((entry) => {
    if (dedupeKey(entry) !== key) {
      return false;
    }
    return new Date(entry.createdAt).getTime() >= cutoff;
  });
}

function trimList(list: PageView[]): PageView[] {
  if (list.length <= LIMITS.maxPageViews) {
    return list;
  }
  return sortPageViews(list).slice(0, LIMITS.maxPageViews);
}

export async function getPageViews(): Promise<PageView[]> {
  return sortPageViews(await readList());
}

export async function recordPageView(input: PageViewInput): Promise<void> {
  const host = input.host.trim().slice(0, 253);
  if (!host || host === "—" || (input.path !== "/" && input.path !== "/admin")) {
    return;
  }

  const list = await readList();
  const nowMs = Date.now();
  const normalized: PageViewInput = {
    path: input.path,
    host,
    ...(input.ip ? { ip: input.ip.trim().slice(0, 45) } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userName ? { userName: input.userName.trim().slice(0, 100) } : {}),
  };

  if (isDuplicateRecent(list, normalized, nowMs)) {
    return;
  }

  const entry: PageView = {
    id: crypto.randomUUID(),
    path: normalized.path,
    host: normalized.host,
    createdAt: new Date(nowMs).toISOString(),
    ...(normalized.ip ? { ip: normalized.ip } : {}),
    ...(normalized.userId ? { userId: normalized.userId } : {}),
    ...(normalized.userName ? { userName: normalized.userName } : {}),
  };

  await writeList(trimList([entry, ...list]));
}

export async function clearPageViews(): Promise<void> {
  await writeList([]);
}

export function computeHomePageStats(views: PageView[]): HomePageViewStats {
  const cutoff = Date.now() - STATS_WINDOW_MS;
  const homeRecent = views.filter(
    (view) =>
      view.path === HOME_PATH && new Date(view.createdAt).getTime() >= cutoff,
  );
  const uniqueHosts = new Set(homeRecent.map((view) => view.host));
  const lastVisit = views.find((view) => view.path === HOME_PATH) ?? null;

  return {
    visitsLast7Days: homeRecent.length,
    uniqueHostsLast7Days: uniqueHosts.size,
    lastVisit,
  };
}

export async function getHomePageViewStats(): Promise<HomePageViewStats> {
  return computeHomePageStats(await getPageViews());
}

export function computeUserPageViewStats(
  views: PageView[],
): UserPageViewStats[] {
  const cutoff7 = Date.now() - STATS_WINDOW_MS;
  const cutoff30 = Date.now() - STATS_WINDOW_30_MS;
  const byUser = new Map<string, UserPageViewStats>();

  for (const view of views) {
    if (!view.userId || !view.userName) continue;

    let stats = byUser.get(view.userId);
    if (!stats) {
      stats = {
        userId: view.userId,
        userName: view.userName,
        visitsLast7Days: 0,
        visitsLast30Days: 0,
        lastVisit: null,
      };
      byUser.set(view.userId, stats);
    }

    const createdMs = new Date(view.createdAt).getTime();
    if (view.path === HOME_PATH && createdMs >= cutoff7) {
      stats.visitsLast7Days += 1;
    }
    if (view.path === HOME_PATH && createdMs >= cutoff30) {
      stats.visitsLast30Days += 1;
    }
    if (
      !stats.lastVisit ||
      view.createdAt.localeCompare(stats.lastVisit.createdAt) > 0
    ) {
      stats.lastVisit = view;
    }
  }

  return [...byUser.values()].sort((a, b) =>
    (b.lastVisit?.createdAt ?? "").localeCompare(a.lastVisit?.createdAt ?? ""),
  );
}
