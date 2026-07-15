import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/security/admin-session";
import { getAdminPassword } from "@/lib/config";
import { getCurrentUser } from "@/lib/user-session";

export const ADMIN_SESSION_COOKIE = "admin_session";

export async function isAuthed(): Promise<boolean> {
  if (!getAdminPassword()) {
    return false;
  }

  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export async function isEditorAuthed(): Promise<boolean> {
  if (await isAuthed()) {
    return true;
  }

  const user = await getCurrentUser();
  return user?.role === "editor" || user?.role === "admin";
}

export async function requireAuth(): Promise<boolean> {
  return isAuthed();
}

export async function requireEditorAuth(): Promise<boolean> {
  return isEditorAuthed();
}
