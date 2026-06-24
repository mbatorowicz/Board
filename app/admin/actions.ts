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
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import { getSettings, saveSettings } from "@/lib/settings";
import { saveAllowedIps } from "@/lib/allowlist";
import { removeOfficeLogo, saveOfficeLogo } from "@/lib/logo";
import { requireAuth } from "@/lib/admin-auth";
import { verifyCsrfFromForm } from "@/lib/security/csrf";
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

async function guardAdminForm(formData: FormData): Promise<boolean> {
  if (!(await requireAuth())) {
    await setFlash({ kind: "error", message: copy.admin.unauthorized });
    return false;
  }
  if (!(await verifyCsrfFromForm(formData))) {
    await setFlash({ kind: "error", message: copy.admin.csrfFailed });
    return false;
  }
  return true;
}

export async function createAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const input = toAnnouncementInput(formData);
  if (!input) {
    await setFlash({ kind: "error", message: copy.admin.announcementInvalid });
    revalidatePath("/admin");
    return;
  }
  await addAnnouncement({
    ...input,
    pinned:
      formData.get("pinned") === "on" || formData.get("pinned") === "true",
  });
  await setFlash({ kind: "notice", message: copy.admin.announcementAdded });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  const input = toAnnouncementInput(formData);
  if (!id || !input) {
    await setFlash({ kind: "error", message: copy.admin.announcementInvalid });
    revalidatePath("/admin");
    return;
  }
  await updateAnnouncement(id, {
    ...input,
    pinned:
      formData.get("pinned") === "on" || formData.get("pinned") === "true",
  });
  await setFlash({ kind: "notice", message: copy.admin.announcementUpdated });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteAnnouncement(id);
    await setFlash({ kind: "notice", message: copy.admin.announcementDeleted });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function clearAcknowledgmentsAction(
  formData: FormData,
): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  await clearAcknowledgments();
  await setFlash({ kind: "notice", message: copy.admin.acknowledgmentsCleared });
  revalidatePath("/admin");
}

export async function saveCertCategoriesAction(
  formData: FormData,
): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const all = formData.getAll("category").map(String);
  const visible = new Set(formData.getAll("visible").map(String));
  const hiddenCertCategories = all.filter((category) => !visible.has(category));
  const settings = await getSettings();
  await saveSettings({ ...settings, hiddenCertCategories });
  await setFlash({ kind: "notice", message: copy.admin.certCategoriesSaved });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createLinkAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const input = toLinkInput(formData);
  if (!input) {
    await setFlash({ kind: "error", message: copy.admin.linkInvalid });
    revalidatePath("/admin");
    return;
  }
  await addQuickLink(input);
  await setFlash({ kind: "notice", message: copy.admin.linkAdded });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateLinkAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  const input = toLinkInput(formData);
  if (!id || !input) {
    await setFlash({ kind: "error", message: copy.admin.linkInvalid });
    revalidatePath("/admin");
    return;
  }
  await updateQuickLink(id, input);
  await setFlash({ kind: "notice", message: copy.admin.linkUpdated });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLinkAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteQuickLink(id);
    await setFlash({ kind: "notice", message: copy.admin.linkDeleted });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveAllowlistAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const raw = String(formData.get("ips") ?? "");
  await saveAllowedIps(parseAllowlistInput(raw));
  await setFlash({ kind: "notice", message: copy.admin.allowlistSaved });
  revalidatePath("/admin");
}

export async function saveHeaderAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const input = validateHeaderInput({
    headerTitle: String(formData.get("headerTitle") ?? ""),
    headerSubtitle: String(formData.get("headerSubtitle") ?? ""),
  });

  if (!input) {
    await setFlash({ kind: "error", message: copy.admin.headerInvalid });
    revalidatePath("/admin");
    return;
  }

  const settings = await getSettings();
  await saveSettings({ ...settings, ...input });
  await setFlash({ kind: "notice", message: copy.admin.headerSaved });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function uploadLogoAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    await setFlash({ kind: "error", message: copy.admin.logoInvalid });
    revalidatePath("/admin");
    return;
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveOfficeLogo(buffer);
    await setFlash({ kind: "notice", message: copy.admin.logoSaved });
  } catch {
    await setFlash({ kind: "error", message: copy.admin.logoInvalid });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeLogoAction(formData: FormData): Promise<void> {
  if (!(await guardAdminForm(formData))) {
    revalidatePath("/admin");
    return;
  }
  await removeOfficeLogo();
  await setFlash({ kind: "notice", message: copy.admin.logoRemoved });
  revalidatePath("/");
  revalidatePath("/admin");
}
