import type { Announcement, AnnouncementInput } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";

const FILE = "announcements.json";

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
  return Array.isArray(data) ? data : [];
}

async function writeList(list: Announcement[]): Promise<void> {
  await writeJsonFile(FILE, list);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const list = await readList();
  return sortAnnouncements(list);
}

export async function addAnnouncement(input: AnnouncementInput): Promise<void> {
  const list = await readList();
  const announcement: Announcement = {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body,
    pinned: input.pinned,
    createdAt: new Date().toISOString(),
  };
  await writeList([announcement, ...list]);
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<void> {
  const list = await readList();
  const next = list.map((item) =>
    item.id === id
      ? { ...item, title: input.title, body: input.body, pinned: input.pinned }
      : item,
  );
  await writeList(next);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const list = await readList();
  await writeList(list.filter((item) => item.id !== id));
}
