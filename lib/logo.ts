import fs from "node:fs/promises";
import path from "node:path";
import { LIMITS } from "@/lib/security/limits";

const DATA_DIR = path.join(process.cwd(), ".data");
const LOGO_BASENAME = "office-logo";
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

export type LogoExtension = (typeof ALLOWED_EXTENSIONS)[number];

export type OfficeLogo = {
  filename: string;
  mime: string;
  updatedAt: number;
};

const MIME_BY_EXT: Record<LogoExtension, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function logoPath(ext: LogoExtension): string {
  return path.join(DATA_DIR, `${LOGO_BASENAME}.${ext}`);
}

function detectExtension(buffer: Buffer): LogoExtension | null {
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

  return null;
}

async function findExistingLogo(): Promise<OfficeLogo | null> {
  for (const ext of ALLOWED_EXTENSIONS) {
    const filePath = logoPath(ext);
    try {
      const stat = await fs.stat(filePath);
      return {
        filename: path.basename(filePath),
        mime: MIME_BY_EXT[ext],
        updatedAt: stat.mtimeMs,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function getOfficeLogo(): Promise<OfficeLogo | null> {
  return findExistingLogo();
}

export async function readOfficeLogoFile(): Promise<{
  buffer: Buffer;
  mime: string;
} | null> {
  const logo = await findExistingLogo();
  if (!logo) {
    return null;
  }

  const buffer = await fs.readFile(path.join(DATA_DIR, logo.filename));
  return { buffer, mime: logo.mime };
}

export async function saveOfficeLogo(buffer: Buffer): Promise<void> {
  if (buffer.byteLength > LIMITS.logoMaxBytes) {
    throw new Error("Plik logo jest za duży.");
  }

  const ext = detectExtension(buffer);
  if (!ext) {
    throw new Error("Niedozwolony format logo.");
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  for (const existing of ALLOWED_EXTENSIONS) {
    if (existing === ext) {
      continue;
    }
    await fs.unlink(logoPath(existing)).catch(() => undefined);
  }

  await fs.writeFile(logoPath(ext), buffer);
}

export async function removeOfficeLogo(): Promise<void> {
  for (const ext of ALLOWED_EXTENSIONS) {
    await fs.unlink(logoPath(ext)).catch(() => undefined);
  }
}

export function officeLogoUrl(updatedAt: number): string {
  return `/api/logo?v=${Math.trunc(updatedAt)}`;
}
