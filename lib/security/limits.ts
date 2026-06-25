export const LIMITS = {
  title: 200,
  body: 10_000,
  name: 100,
  linkLabel: 100,
  linkDescription: 500,
  url: 2048,
  maxAcknowledgments: 5_000,
  maxPageViews: 5_000,
  pageViewDedupeMs: 15 * 60 * 1000,
  certFeedMaxBytes: 5_000_000,
  logoMaxBytes: 2_000_000,
  linkThumbMaxBytes: 2_000_000,
  linkThumbHtmlMaxBytes: 512_000,
  headerTitle: 120,
  headerSubtitle: 200,
  personalLinksMax: 30,
} as const;

export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  userLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  acknowledge: { max: 10, windowMs: 60 * 60 * 1000 },
  linkThumb: { max: 30, windowMs: 60 * 1000 },
} as const;

export const ADMIN_PASSWORD_MAX = 256;
