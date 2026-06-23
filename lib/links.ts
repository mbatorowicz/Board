import type { QuickLink, QuickLinkInput } from "./types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";

const FILE = "links.json";

const DEFAULT_LINKS: QuickLink[] = [
  {
    id: "epuap",
    label: "ePUAP",
    url: "https://epuap.gov.pl/",
    description: "Elektroniczna Platforma Usług Administracji Publicznej",
  },
  {
    id: "bip",
    label: "BIP",
    url: "https://www.bip.gov.pl/",
    description: "Biuletyn Informacji Publicznej",
  },
  {
    id: "poczta",
    label: "Poczta",
    url: "https://poczta.gov.pl/",
    description: "Skrzynka pocztowa urzędu",
  },
  {
    id: "dziennik-ustaw",
    label: "Dziennik Ustaw",
    url: "https://dziennikustaw.gov.pl/",
    description: "Aktualne akty prawne",
  },
  {
    id: "ceidg",
    label: "CEIDG",
    url: "https://www.biznes.gov.pl/",
    description: "Centralna Ewidencja i Informacja o Działalności Gospodarczej",
  },
  {
    id: "gus",
    label: "GUS",
    url: "https://stat.gov.pl/",
    description: "Główny Urząd Statystyczny",
  },
];

async function readRaw(): Promise<QuickLink[] | null> {
  const data = await readJsonFile<QuickLink[]>(FILE);
  return Array.isArray(data) ? data : null;
}

async function writeList(links: QuickLink[]): Promise<void> {
  await writeJsonFile(FILE, links);
}

export async function getQuickLinks(): Promise<QuickLink[]> {
  const raw = await readRaw();
  return raw ?? DEFAULT_LINKS;
}

export async function addQuickLink(input: QuickLinkInput): Promise<void> {
  const links = await getQuickLinks();
  const link: QuickLink = {
    id: crypto.randomUUID(),
    label: input.label,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
  };
  await writeList([...links, link]);
}

export async function updateQuickLink(
  id: string,
  input: QuickLinkInput,
): Promise<void> {
  const links = await getQuickLinks();
  const next = links.map((link) =>
    link.id === id
      ? {
          ...link,
          label: input.label,
          url: input.url,
          description: input.description || undefined,
        }
      : link,
  );
  await writeList(next);
}

export async function deleteQuickLink(id: string): Promise<void> {
  const links = await getQuickLinks();
  await writeList(links.filter((link) => link.id !== id));
}
