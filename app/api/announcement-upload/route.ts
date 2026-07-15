import { requireEditorAuth } from "@/lib/admin-auth";
import { announcementFileUrl } from "@/lib/announcement-url";
import {
  saveAnnouncementAttachment,
  saveAnnouncementImage,
} from "@/lib/announcement-files";
import { LIMITS } from "@/lib/security/limits";

export async function POST(request: Request) {
  if (!(await requireEditorAuth())) {
    return Response.json({ error: "Brak uprawnień." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "attachment");
  const draftKey = String(formData.get("draftKey") ?? "").trim();
  const announcementId = String(formData.get("announcementId") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Brak pliku." }, { status: 400 });
  }

  const scope =
    announcementId && /^[0-9a-f-]{36}$/i.test(announcementId)
      ? { announcementId }
      : draftKey && /^[0-9a-f-]{36}$/i.test(draftKey)
        ? { draftKey }
        : null;

  if (!scope) {
    return Response.json({ error: "Nieprawidłowy kontekst uploadu." }, {
      status: 400,
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name || "plik";

  try {
    const saved =
      kind === "image"
        ? await saveAnnouncementImage(buffer, originalName, scope)
        : await saveAnnouncementAttachment(buffer, originalName, scope);

    if (
      kind !== "image" &&
      saved.size > LIMITS.announcementAttachmentMaxBytes
    ) {
      return Response.json({ error: "Załącznik jest za duży." }, { status: 400 });
    }

    return Response.json({
      file: saved,
      url: announcementFileUrl(saved.id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udało się zapisać pliku.";
    return Response.json({ error: message }, { status: 400 });
  }
}
