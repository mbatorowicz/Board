import fs from "node:fs/promises";
import path from "node:path";
import { LIMITS } from "@/lib/security/limits";
import type { AnnouncementAttachment } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILES_DIR = path.join(DATA_DIR, "announcement-files");
const DRAFTS_DIR = path.join(DATA_DIR, "announcement-drafts");

type StoredFileMeta = AnnouncementAttachment & {
  scope: "draft" | "announcement";
  scopeId: string;
  storedName: string;
  kind: "image" | "attachment";
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"] as const;
const ATTACHMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "odt",
  "txt",
] as const;

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
  txt: "text/plain; charset=utf-8",
};

function metaPath(fileId: string): string {
  return path.join(FILES_DIR, `${fileId}.json`);
}

function filePath(storedName: string): string {
  return path.join(FILES_DIR, storedName);
}

function draftDir(draftKey: string): string {
  return path.join(DRAFTS_DIR, draftKey);
}

function safeBasename(name: string): string {
  return name.replace(/[^\w.\-()+ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]+/gi, "_").slice(0, 120);
}

function detectImageExtension(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return "gif";
  }
  return null;
}

function detectAttachmentExtension(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") {
    return "pdf";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return "doc";
  }
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const head = buffer.toString("utf8", 0, Math.min(buffer.length, 512));
    if (head.includes("word/")) return "docx";
    if (head.includes("xl/")) return "xlsx";
    if (head.includes("mimetype") && head.includes("opendocument.text")) {
      return "odt";
    }
  }
  const textHead = buffer.toString("utf8", 0, Math.min(buffer.length, 256));
  if (/^[\t\n\r\x20-\x7E\u0080-\uFFFF]*$/.test(textHead)) {
    return "txt";
  }
  return null;
}

async function readMeta(fileId: string): Promise<StoredFileMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(fileId), "utf8");
    const parsed = JSON.parse(raw) as StoredFileMeta;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.filename === "string" &&
      typeof parsed.storedName === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

async function writeMeta(meta: StoredFileMeta): Promise<void> {
  await fs.mkdir(FILES_DIR, { recursive: true });
  await fs.writeFile(metaPath(meta.id), JSON.stringify(meta, null, 2), "utf8");
}

export async function saveAnnouncementImage(
  buffer: Buffer,
  originalName: string,
  scope: { draftKey: string } | { announcementId: string },
): Promise<AnnouncementAttachment> {
  if (buffer.byteLength > LIMITS.announcementImageMaxBytes) {
    throw new Error("Obraz jest za duży.");
  }

  const ext = detectImageExtension(buffer);
  if (!ext || !IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])) {
    throw new Error("Niedozwolony format obrazu.");
  }

  return saveScopedFile(buffer, safeBasename(originalName), ext, "image", scope);
}

export async function saveAnnouncementAttachment(
  buffer: Buffer,
  originalName: string,
  scope: { draftKey: string } | { announcementId: string },
): Promise<AnnouncementAttachment> {
  if (buffer.byteLength > LIMITS.announcementAttachmentMaxBytes) {
    throw new Error("Załącznik jest za duży.");
  }

  const ext = detectAttachmentExtension(buffer);
  if (
    !ext ||
    !ATTACHMENT_EXTENSIONS.includes(ext as (typeof ATTACHMENT_EXTENSIONS)[number])
  ) {
    throw new Error("Niedozwolony format załącznika.");
  }

  return saveScopedFile(
    buffer,
    safeBasename(originalName),
    ext,
    "attachment",
    scope,
  );
}

async function saveScopedFile(
  buffer: Buffer,
  originalName: string,
  ext: string,
  kind: "image" | "attachment",
  scope: { draftKey: string } | { announcementId: string },
): Promise<AnnouncementAttachment> {
  const id = crypto.randomUUID();
  const storedName = `${id}.${ext}`;
  const scopeId =
    "draftKey" in scope ? scope.draftKey : scope.announcementId;
  const scopeType = "draftKey" in scope ? "draft" : "announcement";

  await fs.mkdir(FILES_DIR, { recursive: true });
  await fs.writeFile(filePath(storedName), buffer);

  const meta: StoredFileMeta = {
    id,
    filename: originalName || storedName,
    mime: MIME_BY_EXT[ext] ?? "application/octet-stream",
    size: buffer.byteLength,
    scope: scopeType,
    scopeId,
    storedName,
    kind,
  };
  await writeMeta(meta);

  if (scopeType === "draft") {
    await fs.mkdir(draftDir(scopeId), { recursive: true });
    await fs.writeFile(path.join(draftDir(scopeId), id), id, "utf8");
  }

  return {
    id: meta.id,
    filename: meta.filename,
    mime: meta.mime,
    size: meta.size,
  };
}

export async function readAnnouncementFile(
  fileId: string,
): Promise<{ buffer: Buffer; mime: string; filename: string } | null> {
  const meta = await readMeta(fileId);
  if (!meta) {
    return null;
  }

  try {
    const buffer = await fs.readFile(filePath(meta.storedName));
    return { buffer, mime: meta.mime, filename: meta.filename };
  } catch {
    return null;
  }
}

export async function deleteAnnouncementFile(fileId: string): Promise<void> {
  const meta = await readMeta(fileId);
  if (!meta) {
    return;
  }

  await fs.unlink(filePath(meta.storedName)).catch(() => undefined);
  await fs.unlink(metaPath(fileId)).catch(() => undefined);
}

export async function finalizeAllDraftFiles(
  draftKey: string,
  announcementId: string,
): Promise<AnnouncementAttachment[]> {
  const attachments: AnnouncementAttachment[] = [];

  try {
    const entries = await fs.readdir(draftDir(draftKey));
    for (const fileId of entries) {
      const meta = await readMeta(fileId);
      if (!meta || meta.scope !== "draft" || meta.scopeId !== draftKey) {
        continue;
      }
      meta.scope = "announcement";
      meta.scopeId = announcementId;
      await writeMeta(meta);
      if (meta.kind === "attachment") {
        attachments.push({
          id: meta.id,
          filename: meta.filename,
          mime: meta.mime,
          size: meta.size,
        });
      }
    }
  } catch {
    /* brak draftu */
  }

  await fs.rm(draftDir(draftKey), { recursive: true, force: true }).catch(
    () => undefined,
  );

  return attachments;
}

export async function finalizeDraftFiles(
  draftKey: string,
  announcementId: string,
  fileIds: string[],
): Promise<AnnouncementAttachment[]> {
  const attachments: AnnouncementAttachment[] = [];
  const allowed = new Set(fileIds);

  for (const fileId of allowed) {
    const meta = await readMeta(fileId);
    if (!meta || meta.scope !== "draft" || meta.scopeId !== draftKey) {
      continue;
    }
    meta.scope = "announcement";
    meta.scopeId = announcementId;
    await writeMeta(meta);
    if (meta.kind === "attachment") {
      attachments.push({
        id: meta.id,
        filename: meta.filename,
        mime: meta.mime,
        size: meta.size,
      });
    }
  }

  await fs.rm(draftDir(draftKey), { recursive: true, force: true }).catch(
    () => undefined,
  );

  return attachments;
}

export async function mergeAnnouncementAttachments(
  announcementId: string,
  existing: AnnouncementAttachment[],
  keptIds: string[],
  draftKey?: string,
): Promise<AnnouncementAttachment[]> {
  const kept = new Set(keptIds);
  const next: AnnouncementAttachment[] = [];

  for (const attachment of existing) {
    if (kept.has(attachment.id)) {
      next.push(attachment);
    } else {
      await deleteAnnouncementFile(attachment.id);
    }
  }

  for (const id of keptIds) {
    if (next.some((item) => item.id === id)) {
      continue;
    }
    const meta = await readMeta(id);
    if (
      meta &&
      meta.scope === "announcement" &&
      meta.scopeId === announcementId &&
      meta.kind === "attachment"
    ) {
      next.push({
        id: meta.id,
        filename: meta.filename,
        mime: meta.mime,
        size: meta.size,
      });
    }
  }

  if (draftKey) {
    const fromDraft = await finalizeDraftFiles(draftKey, announcementId, keptIds);
    for (const attachment of fromDraft) {
      if (!next.some((item) => item.id === attachment.id)) {
        next.push(attachment);
      }
    }
  }

  if (next.length > LIMITS.announcementAttachmentsMax) {
    throw new Error("Za dużo załączników.");
  }

  return next;
}

export async function deleteAnnouncementAssets(announcementId: string): Promise<void> {
  const entries = await fs.readdir(FILES_DIR).catch(() => [] as string[]);
  for (const entry of entries) {
    if (!entry.endsWith(".json")) {
      continue;
    }
    const fileId = entry.slice(0, -5);
    const meta = await readMeta(fileId);
    if (meta?.scope === "announcement" && meta.scopeId === announcementId) {
      await deleteAnnouncementFile(fileId);
    }
  }
}

export async function countDraftAttachments(draftKey: string): Promise<number> {
  try {
    const entries = await fs.readdir(draftDir(draftKey));
    return entries.length;
  } catch {
    return 0;
  }
}
