import { cookies } from "next/headers";
import { getAdminPassword } from "@/lib/config";
import { verifyAdminSessionToken } from "@/lib/security/admin-session";

export const ADMIN_SESSION_COOKIE = "admin_session";

export async function isAuthed(): Promise<boolean> {
  if (!getAdminPassword()) {
    return false;
  }
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function requireAuth(): Promise<boolean> {
  return isAuthed();
}
