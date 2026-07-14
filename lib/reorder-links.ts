export function reorderLinksByIds<T extends { id: string }>(
  links: T[],
  orderedIds: string[],
): T[] | null {
  if (orderedIds.length !== links.length) {
    return null;
  }

  const byId = new Map(links.map((link) => [link.id, link]));
  const reordered: T[] = [];

  for (const id of orderedIds) {
    const link = byId.get(id);
    if (!link) {
      return null;
    }
    reordered.push(link);
  }

  return reordered;
}

export function moveLinkInList<T extends { id: string }>(
  links: T[],
  dragId: string,
  overId: string,
): { next: T[]; dragId: string } | null {
  if (dragId === overId) {
    return null;
  }

  const fromIndex = links.findIndex((link) => link.id === dragId);
  const toIndex = links.findIndex((link) => link.id === overId);
  if (fromIndex === -1 || toIndex === -1) {
    return null;
  }

  const next = [...links];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return { next, dragId: moved.id };
}

export function collectLinkIds<T extends { id: string }>(links: T[]): string[] {
  return links.map((link) => link.id);
}
