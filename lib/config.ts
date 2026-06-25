export const CERT_FEED_URL =
  process.env.CERT_FEED_URL ?? "https://moje.cert.pl/advisory_feed/advisory/feed/";

export const OFFICE_NAME = process.env.OFFICE_NAME ?? "Urząd Gminy";

export const FEED_REVALIDATE_SECONDS = Number(
  process.env.FEED_REVALIDATE_SECONDS ?? 1200,
);

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}
