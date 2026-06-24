"use server";

import { revalidatePath } from "next/cache";
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
import { requireAuth } from "@/lib/admin-auth";
import {
  parseAllowlistInput,
  validateAnnouncementInput,
  validateHeaderInput,
  validateLinkInput,
} from "@/lib/security/validate";

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

export async function createAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
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
  if (!(await requireAuth())) return;
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
  if (!(await requireAuth())) return;
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteAnnouncement(id);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function clearAcknowledgmentsAction(): Promise<void> {
  if (!(await requireAuth())) return;
  await clearAcknowledgments();
  revalidatePath("/admin");
}

export async function saveCertCategoriesAction(
  formData: FormData,
): Promise<void> {
  if (!(await requireAuth())) return;
  const all = formData.getAll("category").map(String);
  const visible = new Set(formData.getAll("visible").map(String));
  const hiddenCertCategories = all.filter((category) => !visible.has(category));
  const settings = await getSettings();
  await saveSettings({ ...settings, hiddenCertCategories });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createLinkAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const input = toLinkInput(formData);
  if (input) {
    await addQuickLink(input);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateLinkAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const id = String(formData.get("id") ?? "").trim();
  const input = toLinkInput(formData);
  if (id && input) {
    await updateQuickLink(id, input);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLinkAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteQuickLink(id);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveAllowlistAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const raw = String(formData.get("ips") ?? "");
  await saveAllowedIps(parseAllowlistInput(raw));
  revalidatePath("/admin");
}

export async function saveHeaderAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const input = validateHeaderInput({
    headerTitle: String(formData.get("headerTitle") ?? ""),
    headerSubtitle: String(formData.get("headerSubtitle") ?? ""),
  });

  if (!input) {
    return;
  }

  const settings = await getSettings();
  await saveSettings({ ...settings, ...input });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function uploadLogoAction(formData: FormData): Promise<void> {
  if (!(await requireAuth())) return;
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveOfficeLogo(buffer);
  } catch {
    return;
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeLogoAction(): Promise<void> {
  if (!(await requireAuth())) return;
  await removeOfficeLogo();
  revalidatePath("/");
  revalidatePath("/admin");
}
