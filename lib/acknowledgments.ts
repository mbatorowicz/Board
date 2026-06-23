import type { Acknowledgment, AcknowledgmentInput } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { LIMITS } from "@/lib/security/limits";

export const ACK_COOKIE = "ack_done";

const FILE = "acknowledgments.json";

function sortAcknowledgments(list: Acknowledgment[]): Acknowledgment[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function readList(): Promise<Acknowledgment[]> {
  const data = await readJsonFile<Acknowledgment[]>(FILE);
  return Array.isArray(data) ? data : [];
}

async function writeList(list: Acknowledgment[]): Promise<void> {
  await writeJsonFile(FILE, list);
}

export async function getAcknowledgments(): Promise<Acknowledgment[]> {
  const list = await readList();
  return sortAcknowledgments(list);
}

export async function addAcknowledgment(
  input: AcknowledgmentInput,
): Promise<void> {
  const list = await readList();
  if (list.length >= LIMITS.maxAcknowledgments) {
    return;
  }
  const acknowledgment: Acknowledgment = {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date().toISOString(),
    ...(input.ip ? { ip: input.ip } : {}),
  };
  await writeList([acknowledgment, ...list]);
}

export async function clearAcknowledgments(): Promise<void> {
  await writeList([]);
}
