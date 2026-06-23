export const LIMITS = {
  title: 200,
  body: 10_000,
  name: 100,
  linkLabel: 100,
  linkDescription: 500,
  url: 2048,
  allowlistRaw: 8192,
  maxAcknowledgments: 5_000,
  certFeedMaxBytes: 5_000_000,
} as const;

export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  acknowledge: { max: 10, windowMs: 60 * 60 * 1000 },
} as const;
