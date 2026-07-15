export const LIMITS = {
  title: 200,
  body: 10_000,
  bodyHtml: 50_000,
  announcementImageMaxBytes: 5_000_000,
  announcementAttachmentMaxBytes: 10_000_000,
  announcementAttachmentsMax: 10,
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
  certCategory: 120,
  personalLinksMax: 30,
} as const;

export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export const USER_SESSION_TOUCH_MS = 60 * 60 * 1000;

export const USER_SESSION_ROTATE_MS = 60 * 60 * 24 * 7;

export const DEVICE_LAST_SEEN_THROTTLE_MS = 60 * 60 * 24 * 1000;

export const JSON_CACHE_TTL_MS = 60_000;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export const PIN_PRIVILEGED_MIN_LENGTH = 8;
export const PIN_PRIVILEGED_MAX_LENGTH = 32;

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  userLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  acknowledge: { max: 10, windowMs: 60 * 60 * 1000 },
  linkThumb: { max: 30, windowMs: 60 * 1000 },
} as const;

export const ADMIN_PASSWORD_MAX = 256;
