import type { NextConfig } from "next";

function buildContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV === "development";

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const connectSrc = isDev
    ? "connect-src 'self' ws: wss:"
    : "connect-src 'self'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    connectSrc,
  ].join("; ");
}

function securityHeaders() {
  const headers = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(),
    },
  ];

  if (
    process.env.COOKIE_SECURE === "true" ||
    process.env.ENABLE_HSTS === "true"
  ) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.data/**", "**/node_modules/**"],
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
