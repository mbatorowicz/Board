export function linkFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return "";
  }
}

export function linkLabelInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const first = [...trimmed][0];
  return first ? first.toUpperCase() : "?";
}
