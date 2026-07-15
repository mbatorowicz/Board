"use server";

import { revalidatePath } from "next/cache";
import {
  addAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
} from "@/lib/announcements";
import type { AnnouncementAttachment } from "@/lib/types";
import {
  finalizeAllDraftFiles,
  mergeAnnouncementAttachments,
} from "@/lib/announcement-files";
import { clearAcknowledgments } from "@/lib/acknowledgments";
import { clearPageViews } from "@/lib/page-views";
import {
  addQuickLink,
  deleteQuickLink,
  updateQuickLink,
} from "@/lib/links";
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import { getSettings, saveSettings } from "@/lib/settings";
import { removeOfficeLogo, saveOfficeLogo } from "@/lib/logo";
import { requireAuth, requireEditorAuth } from "@/lib/admin-auth";
import { verifyCsrfFromForm } from "@/lib/security/csrf";
import { isUserRole } from "@/lib/type-guards";
import {
  validateAnnouncementInput,
  validateHeaderInput,
  validateLinkInput,
  clampText,
  parseAttachmentIds,
} from "@/lib/security/validate";
import {
  LIMITS,
} from "@/lib/security/limits";
import {
  createUser,
  deleteUser,
  getUserById,
  resetUserPin,
  updateUserRole,
  validatePin,
  validateUserName,
} from "@/lib/users";

function toAnnouncementInput(formData: FormData) {
  return validateAnnouncementInput({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    bodyFormat: String(formData.get("bodyFormat") ?? "plain"),
  });
}

export type AnnouncementActionState = {
  ok: boolean;
  error?: string;
};

const announcementActionFailed: AnnouncementActionState = { ok: false };

async function resolveAnnouncementAttachments(
  formData: FormData,
  announcementId: string,
  existing: AnnouncementAttachment[] = [],
): Promise<AnnouncementAttachment[]> {
  const keptIds = parseAttachmentIds(formData.get("attachmentIds"));
  const draftKey = String(formData.get("draftKey") ?? "").trim();
  return mergeAnnouncementAttachments(
    announcementId,
    existing,
    keptIds,
    draftKey || undefined,
  );
}

export async function createAnnouncementAction(
  _prev: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  if (!(await guardForm(formData, "editor"))) {
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.unauthorized };
  }
  const input = toAnnouncementInput(formData);
  if (!input) {
    await setFlash({ kind: "error", message: copy.admin.announcementInvalid });
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.announcementInvalid };
  }

  const draftKey = String(formData.get("draftKey") ?? "").trim();
  const pinned =
    formData.get("pinned") === "on" || formData.get("pinned") === "true";

  const announcement = await addAnnouncement({
    ...input,
    pinned,
    attachments: [],
  });

  let attachments: AnnouncementAttachment[] = [];
  if (draftKey) {
    attachments = await finalizeAllDraftFiles(draftKey, announcement.id);
  }

  if (attachments.length > 0) {
    await updateAnnouncement(announcement.id, {
      ...input,
      pinned,
      attachments,
    });
  }

  await setFlash({ kind: "notice", message: copy.admin.announcementAdded });
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateAnnouncementAction(
  _prev: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  if (!(await guardForm(formData, "editor"))) {
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.unauthorized };
  }
  const id = String(formData.get("id") ?? "").trim();
  const input = toAnnouncementInput(formData);
  if (!id || !input) {
    await setFlash({ kind: "error", message: copy.admin.announcementInvalid });
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.announcementInvalid };
  }

  const existing = await getAnnouncementById(id);
  if (!existing) {
    await setFlash({ kind: "error", message: copy.admin.announcementInvalid });
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.announcementInvalid };
  }

  const attachments = await resolveAnnouncementAttachments(
    formData,
    id,
    existing.attachments ?? [],
  );

  await updateAnnouncement(id, {
    ...input,
    pinned:
      formData.get("pinned") === "on" || formData.get("pinned") === "true",
    attachments,
  });
  await setFlash({ kind: "notice", message: copy.admin.announcementUpdated });
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAnnouncementAction(
  _prev: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  if (!(await guardForm(formData, "editor"))) {
    revalidatePath("/admin");
    return { ok: false, error: copy.admin.unauthorized };
  }
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteAnnouncement(id);
    await setFlash({ kind: "notice", message: copy.admin.announcementDeleted });
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

/** @deprecated Użyj createAnnouncementAction */
export async function createAction(formData: FormData): Promise<void> {
  await createAnnouncementAction(announcementActionFailed, formData);
}

/** @deprecated Użyj updateAnnouncementAction */
export async function updateAction(formData: FormData): Promise<void> {
  await updateAnnouncementAction(announcementActionFailed, formData);
}

/** @deprecated Użyj deleteAnnouncementAction */
export async function deleteAction(formData: FormData): Promise<void> {
  await deleteAnnouncementAction(announcementActionFailed, formData);
}

function toLinkInput(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  return validateLinkInput({
    label: String(formData.get("label") ?? ""),
    url: String(formData.get("url") ?? ""),
    ...(description ? { description } : {}),
  });
}

async function guardForm(
  formData: FormData,
  level: "admin" | "editor",
): Promise<boolean> {
  const authed =
    level === "admin"
      ? await requireAuth()
      : await requireEditorAuth();
  if (!authed) {
    await setFlash({ kind: "error", message: copy.admin.unauthorized });
    return false;
  }
  if (!(await verifyCsrfFromForm(formData))) {
    await setFlash({ kind: "error", message: copy.admin.csrfFailed });
    return false;
  }
  return true;
}

export async function clearAcknowledgmentsAction(
  formData: FormData,
): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }
  await clearAcknowledgments();
  await setFlash({ kind: "notice", message: copy.admin.acknowledgmentsCleared });
  revalidatePath("/admin");
}

export async function clearPageViewsAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }
  await clearPageViews();
  await setFlash({ kind: "notice", message: copy.admin.pageViewsCleared });
  revalidatePath("/admin");
}

export async function saveCertCategoriesAction(
  formData: FormData,
): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }
  const all = formData
    .getAll("category")
    .map((item) => clampText(String(item), LIMITS.certCategory))
    .filter(Boolean);
  const visible = new Set(formData.getAll("visible").map(String));
  const hiddenCertCategories = all.filter((category) => !visible.has(category));
  const settings = await getSettings();
  await saveSettings({ ...settings, hiddenCertCategories });
  await setFlash({ kind: "notice", message: copy.admin.certCategoriesSaved });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createLinkAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
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
  if (!(await guardForm(formData, "admin"))) {
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
  if (!(await guardForm(formData, "admin"))) {
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

export async function saveHeaderAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
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
  if (!(await guardForm(formData, "admin"))) {
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
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }
  await removeOfficeLogo();
  await setFlash({ kind: "notice", message: copy.admin.logoRemoved });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createUserAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }

  const name = validateUserName(String(formData.get("name") ?? ""));
  const role = String(formData.get("role") ?? "");
  const pin = validatePin(
    String(formData.get("pin") ?? ""),
    isUserRole(role) ? role : "reader",
  );

  if (!name || !isUserRole(role) || !pin) {
    await setFlash({ kind: "error", message: copy.admin.userInvalid });
    revalidatePath("/admin");
    return;
  }

  const user = await createUser({ name, role, pin });
  if (!user) {
    await setFlash({ kind: "error", message: copy.admin.userExists });
    revalidatePath("/admin");
    return;
  }

  await setFlash({ kind: "notice", message: copy.admin.userCreated });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!id || !isUserRole(role)) {
    await setFlash({ kind: "error", message: copy.admin.userInvalid });
    revalidatePath("/admin");
    return;
  }

  const ok = await updateUserRole(id, role);
  await setFlash({
    kind: ok ? "notice" : "error",
    message: ok ? copy.admin.userUpdated : copy.admin.userInvalid,
  });
  revalidatePath("/admin");
}

export async function resetUserPinAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  const user = id ? await getUserById(id) : null;
  const pin = user
    ? validatePin(String(formData.get("pin") ?? ""), user.role)
    : null;
  if (!id || !pin) {
    await setFlash({ kind: "error", message: copy.admin.userInvalid });
    revalidatePath("/admin");
    return;
  }

  const ok = await resetUserPin(id, pin);
  await setFlash({
    kind: ok ? "notice" : "error",
    message: ok ? copy.admin.userPinReset : copy.admin.userInvalid,
  });
  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await deleteUser(id);
    await setFlash({ kind: "notice", message: copy.admin.userDeleted });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveUserLoginSettingsAction(
  formData: FormData,
): Promise<void> {
  if (!(await guardForm(formData, "admin"))) {
    revalidatePath("/admin");
    return;
  }

  const mode = String(formData.get("userLoginMode") ?? "");
  const userLoginMode = mode === "type" ? "type" : "select";
  const settings = await getSettings();
  await saveSettings({ ...settings, userLoginMode });
  await setFlash({ kind: "notice", message: copy.admin.userLoginModeSaved });
  revalidatePath("/");
  revalidatePath("/admin");
}
