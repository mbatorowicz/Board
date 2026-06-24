import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

function dataPath(filename: string): string {
  const base = path.basename(filename);
  if (base !== filename || base.includes("..")) {
    throw new Error("Nieprawidłowa nazwa pliku danych.");
  }
  return path.join(DATA_DIR, base);
}

export async function readJsonFile<T>(filename: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(dataPath(filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function replaceFile(tmpPath: string, targetPath: string): Promise<void> {
  try {
    await fs.rename(tmpPath, targetPath);
  } catch {
    await fs.copyFile(tmpPath, targetPath);
    await fs.unlink(tmpPath);
  }
}

export async function writeJsonFile(
  filename: string,
  data: unknown,
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const targetPath = dataPath(filename);
  const tmpPath = `${targetPath}.${randomUUID()}.tmp`;
  const content = JSON.stringify(data);

  await fs.writeFile(tmpPath, content, "utf8");
  try {
    await replaceFile(tmpPath, targetPath);
  } catch (error) {
    await fs.unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}
