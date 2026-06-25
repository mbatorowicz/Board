"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import {
  addUserPersonalLink,
  importUserPersonalLinks,
  removeUserPersonalLink,
} from "@/lib/users";
import { getCurrentUser } from "@/lib/user-session";
import { validateLinkInput } from "@/lib/security/validate";
import type { QuickLink } from "@/lib/types";

export async function addPersonalLinkAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    await setFlash({ kind: "error", message: copy.personalLinks.loginRequired });
    revalidatePath("/");
    return;
  }

  const input = validateLinkInput({
    label: String(formData.get("label") ?? ""),
    url: String(formData.get("url") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
  });

  if (!input) {
    await setFlash({ kind: "error", message: copy.personalLinks.invalidUrl });
    revalidatePath("/");
    return;
  }

  const result = await addUserPersonalLink(user.id, input);
  if ("error" in result) {
    const message =
      result.error === "limit"
        ? copy.personalLinks.limitReached(30)
        : copy.personalLinks.invalidUrl;
    await setFlash({ kind: "error", message });
  }

  revalidatePath("/");
}

export async function removePersonalLinkAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await removeUserPersonalLink(user.id, id);
  }
  revalidatePath("/");
}

export async function importPersonalLinksAction(
  links: QuickLink[],
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await importUserPersonalLinks(user.id, links);
  revalidatePath("/");
}
