export function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE === "true";
}
