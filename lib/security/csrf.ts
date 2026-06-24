import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const CSRF_COOKIE = "admin_csrf";
export const CSRF_HEADER = "x-csrf-token";
const TOKEN_BYTES = 32;
const TOKEN_HEX_LENGTH = TOKEN_BYTES * 2;

export function isValidCsrfToken(value: string | undefined): value is string {
  return typeof value === "string" && value.length === TOKEN_HEX_LENGTH;
}

export function verifyCsrfToken(
  submitted: string,
  cookieValue: string | undefined,
): boolean {
  if (!submitted || !cookieValue) {
    return false;
  }
  if (submitted.length !== TOKEN_HEX_LENGTH || cookieValue.length !== TOKEN_HEX_LENGTH) {
    return false;
  }
  return timingSafeEqual(Buffer.from(submitted), Buffer.from(cookieValue));
}

export async function verifyCsrfFromForm(formData: FormData): Promise<boolean> {
  const submitted = String(formData.get("csrf") ?? "");
  const cookieValue = (await cookies()).get(CSRF_COOKIE)?.value;
  return verifyCsrfToken(submitted, cookieValue);
}

export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  const formData = await request.formData();
  const submitted = String(formData.get("csrf") ?? "");
  const cookieValue = (await cookies()).get(CSRF_COOKIE)?.value;
  return verifyCsrfToken(submitted, cookieValue);
}
