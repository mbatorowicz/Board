export const CERT_FEED_URL =
  process.env.CERT_FEED_URL ?? "https://moje.cert.pl/advisory_feed/advisory/feed/";

export const OFFICE_NAME = process.env.OFFICE_NAME ?? "Urząd Gminy";

export const FEED_REVALIDATE_SECONDS = Number(
  process.env.FEED_REVALIDATE_SECONDS ?? 1200,
);

const PLACEHOLDER_ADMIN_PASSWORDS = new Set([
  "",
  "ZMIEŃ-TO-HASLO",
  "change-me",
  "changeme",
]);

export function getAdminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value || undefined;
}

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const password = getAdminPassword();
  if (!password || PLACEHOLDER_ADMIN_PASSWORDS.has(password)) {
    throw new Error(
      "ADMIN_PASSWORD musi być ustawione na produkcji (silne, unikalne hasło).",
    );
  }
}
