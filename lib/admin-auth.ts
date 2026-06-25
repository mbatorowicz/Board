import { cookies } from "next/headers";
import { getAdminPassword } from "@/lib/config";
import { verifyAdminSessionToken } from "@/lib/security/admin-session";
import { getCurrentUser } from "@/lib/user-session";

export const ADMIN_SESSION_COOKIE = "admin_session";

export async function isAuthed(): Promise<boolean> {
  if (!getAdminPassword()) {
    const user = await getCurrentUser();
    return user?.role === "admin";
  }
  const cookieStore = await cookies();
  const adminSession = await verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (adminSession) return true;

  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function isEditorAuthed(): Promise<boolean> {
  if (await isAuthed()) return true;
  const user = await getCurrentUser();
  return user?.role === "editor";
}

export async function requireAuth(): Promise<boolean> {
  return isAuthed();
}

export async function requireEditorAuth(): Promise<boolean> {
  return isEditorAuthed();
}
