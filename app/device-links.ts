"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import { getDeviceId } from "@/lib/device-id";
import {
  addDeviceLink,
  removeDeviceLink,
  reorderDeviceLinks,
} from "@/lib/device-links";
import { validateLinkInput } from "@/lib/security/validate";

async function requireDeviceId(): Promise<string | null> {
  return getDeviceId();
}

export async function addDeviceLinkAction(formData: FormData): Promise<void> {
  const deviceId = await requireDeviceId();
  if (!deviceId) {
    return;
  }

  const input = validateLinkInput({
    label: String(formData.get("label") ?? ""),
    url: String(formData.get("url") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
  });

  if (!input) {
    await setFlash({ kind: "error", message: copy.deviceLinks.invalidUrl });
    revalidatePath("/");
    return;
  }

  const result = await addDeviceLink(deviceId, input);
  if ("error" in result) {
    const message =
      result.error === "limit"
        ? copy.deviceLinks.limitReached(30)
        : copy.deviceLinks.invalidUrl;
    await setFlash({ kind: "error", message });
  }

  revalidatePath("/");
}

export async function removeDeviceLinkAction(
  formData: FormData,
): Promise<void> {
  const deviceId = await requireDeviceId();
  if (!deviceId) {
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await removeDeviceLink(deviceId, id);
  }
  revalidatePath("/");
}

export async function reorderDeviceLinksAction(
  orderedIds: string[],
): Promise<void> {
  const deviceId = await requireDeviceId();
  if (!deviceId) {
    return;
  }

  await reorderDeviceLinks(deviceId, orderedIds);
  revalidatePath("/");
}
