import type { Announcement, AnnouncementInput } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { readCachedJson } from "@/lib/json-cache";
import { deleteAnnouncementAssets } from "@/lib/announcement-files";
import { isAnnouncementAttachment } from "@/lib/type-guards";

const FILE = "announcements.json";

function normalizeAnnouncement(item: Announcement): Announcement {
  const attachments = Array.isArray(item.attachments)
    ? item.attachments.filter(isAnnouncementAttachment)
    : undefined;

  return {
    ...item,
    bodyFormat: item.bodyFormat === "html" ? "html" : "plain",
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };
}

function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function readList(): Promise<Announcement[]> {
  const data = await readJsonFile<Announcement[]>(FILE);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(normalizeAnnouncement);
}

async function writeList(list: Announcement[]): Promise<void> {
  await writeJsonFile(FILE, list);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return readCachedJson(FILE, async () => sortAnnouncements(await readList()));
}

export async function addAnnouncement(
  input: AnnouncementInput,
): Promise<Announcement> {
  const list = await readList();
  const announcement: Announcement = {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body,
    bodyFormat: input.bodyFormat,
    pinned: input.pinned,
    createdAt: new Date().toISOString(),
    ...(input.attachments.length > 0 ? { attachments: input.attachments } : {}),
  };
  await writeList([announcement, ...list]);
  return announcement;
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<void> {
  const list = await readList();
  const next = list.map((item) =>
    item.id === id
      ? {
          ...item,
          title: input.title,
          body: input.body,
          bodyFormat: input.bodyFormat,
          pinned: input.pinned,
          attachments:
            input.attachments.length > 0 ? input.attachments : undefined,
        }
      : item,
  );
  await writeList(next);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const list = await readList();
  await writeList(list.filter((item) => item.id !== id));
  await deleteAnnouncementAssets(id);
}

export async function getAnnouncementById(
  id: string,
): Promise<Announcement | null> {
  const list = await readList();
  return list.find((item) => item.id === id) ?? null;
}
