import { headers } from "next/headers";
import { CSRF_HEADER } from "@/lib/security/csrf";

export async function AdminCsrfField() {
  const token = (await headers()).get(CSRF_HEADER) ?? "";
  return <input type="hidden" name="csrf" value={token} />;
}
