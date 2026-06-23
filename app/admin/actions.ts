"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminPassword } from "@/lib/config";
import {
  addAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/announcements";
import { clearAcknowledgments } from "@/lib/acknowledgments";
import {
  addQuickLink,
  deleteQuickLink,
  updateQuickLink,
} from "@/lib/links";
import { getSettings, saveSettings } from "@/lib/settings";
import { saveAllowedIps } from "@/lib/allowlist";
import { removeOfficeLogo, saveOfficeLogo } from "@/lib/logo";
import {
  createAdminSessionToken,
  revokeAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/security/admin-session";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { safeEqualString } from "@/lib/security/password";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { RATE_LIMITS, SESSION_TTL_SECONDS } from "@/lib/security/limits";
import {
  parseAllowlistInput,
  validateAnnouncementInput,
  validateHeaderInput,
  validateLinkInput,
} from "@/lib/security/validate";
import { cookieSecure } from "@/lib/cookie-secure";

const COOKIE_NAME = "admin_session";

export async function isAuthed(): Promise<boolean> {
  if (!getAdminPassword()) {
    return false;
  }
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
}

function toAnnouncementInput(formData: FormData) {
  return validateAnnouncementInput({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
}

function toLinkInput(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  return validateLinkInput({
    label: String(formData.get("label") ?? ""),
    url: String(formData.get("url") ?? ""),
    ...(description ? { description } : {}),
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = getAdminPassword();
  const provided = String(formData.get("password") ?? "");
  const headerList = await headers();
  const ip = getClientIpFromHeaders(headerList);

  if (
    !checkRateLimit(
      rateLimitKey("login", ip),
      RATE_LIMITS.login.max,
      RATE_LIMITS.login.windowMs,
    )
  ) {
    redirect("/admin?error=1");
  }

  if (!password || !safeEqualString(provided, password)) {
    redirect("/admin?error=1");
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  await revokeAdminSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin");
}

export async function createAction(formData: FormData): Promise<void> {
  await requireAuth();
  const input = toAnnouncementInput(formData);
  if (!input) {
    return;
  }
  await addAnnouncement({
    ...input,
    pinned:
      formData.get("pinned") === "on" || formData.get("pinned") === "true",
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "").trim();
  const input = toAnnouncementInput(formData);
  if (id && input) {
    await updateAnnouncement(id, {
      ...input,
      pinned:
        formData.get("pinned") === "on" || formData.get("pinned") === "true",
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteAnnouncement(id);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function clearAcknowledgmentsAction(): Promise<void> {
  await requireAuth();
  await clearAcknowledgments();
  revalidatePath("/admin");
}

export async function saveCertCategoriesAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();
  const all = formData.getAll("category").map(String);
  const visible = new Set(formData.getAll("visible").map(String));
  const hiddenCertCategories = all.filter((category) => !visible.has(category));
  const settings = await getSettings();
  await saveSettings({ ...settings, hiddenCertCategories });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createLinkAction(formData: FormData): Promise<void> {
  await requireAuth();
  const input = toLinkInput(formData);
  if (input) {
    await addQuickLink(input);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateLinkAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "").trim();
  const input = toLinkInput(formData);
  if (id && input) {
    await updateQuickLink(id, input);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLinkAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteQuickLink(id);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveAllowlistAction(formData: FormData): Promise<void> {
  await requireAuth();
  const raw = String(formData.get("ips") ?? "");
  await saveAllowedIps(parseAllowlistInput(raw));
  revalidatePath("/admin");
}

export async function saveHeaderAction(formData: FormData): Promise<void> {
  await requireAuth();
  const input = validateHeaderInput({
    headerTitle: String(formData.get("headerTitle") ?? ""),
    headerSubtitle: String(formData.get("headerSubtitle") ?? ""),
  });

  if (!input) {
    redirect("/admin?header=invalid");
  }

  const settings = await getSettings();
  await saveSettings({ ...settings, ...input });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?header=ok");
}

export async function uploadLogoAction(formData: FormData): Promise<void> {
  await requireAuth();
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?logo=invalid");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveOfficeLogo(buffer);
  } catch {
    redirect("/admin?logo=invalid");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?logo=ok");
}

export async function removeLogoAction(): Promise<void> {
  await requireAuth();
  await removeOfficeLogo();
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?logo=removed");
}
