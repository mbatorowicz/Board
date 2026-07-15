"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { Announcement, AnnouncementAttachment } from "@/lib/types";
import CsrfFieldClient from "@/components/admin/CsrfFieldClient";
import { copy } from "@/lib/copy";
import { LIMITS } from "@/lib/security/limits";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
  type AnnouncementActionState,
} from "@/app/admin/actions";
import { announcementFileUrl } from "@/lib/announcement-url";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

const AnnouncementEditor = dynamic(
  () => import("@/components/admin/AnnouncementEditor"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.editorShell}>{copy.admin.loadingEditor}</div>
    ),
  },
);

const initialActionState: AnnouncementActionState = { ok: false };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AnnouncementForm({
  mode,
  csrfToken,
  announcement,
  onSuccess,
}: {
  mode: "create" | "edit";
  csrfToken: string;
  announcement?: Announcement;
  onSuccess: () => void;
}) {
  const draftKey = useMemo(
    () => (mode === "create" ? crypto.randomUUID() : undefined),
    [mode],
  );
  const [bodyHtml, setBodyHtml] = useState(
    announcement?.bodyFormat === "html"
      ? announcement.body
      : announcement?.body
        ? `<p>${announcement.body.replace(/\n/g, "<br>")}</p>`
        : "<p></p>",
  );
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
    announcement?.attachments ?? [],
  );

  const [createState, createFormAction, createPending] = useActionState(
    createAnnouncementAction,
    initialActionState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAnnouncementAction,
    initialActionState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAnnouncementAction,
    initialActionState,
  );

  const pending = createPending || updatePending || deletePending;
  const actionState = mode === "create" ? createState : updateState;

  const handleBodyChange = useCallback((html: string) => {
    setBodyHtml(html);
  }, []);

  useEffect(() => {
    if (actionState.ok || deleteState.ok) {
      onSuccess();
    }
  }, [actionState.ok, deleteState.ok, onSuccess]);

  function removeAttachment(id: string): void {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  const attachmentIds = attachments.map((item) => item.id).join(",");

  return (
    <>
      <form
        action={mode === "create" ? createFormAction : updateFormAction}
        className={ui.form}
      >
        <CsrfFieldClient token={csrfToken} />
        {mode === "edit" && announcement ? (
          <input type="hidden" name="id" value={announcement.id} />
        ) : null}
        {draftKey ? <input type="hidden" name="draftKey" value={draftKey} /> : null}
        <input type="hidden" name="body" value={bodyHtml} />
        <input type="hidden" name="bodyFormat" value="html" />
        <input type="hidden" name="attachmentIds" value={attachmentIds} />

        <label className={ui.label}>
          {copy.labels.title}
          <input
            className={ui.input}
            type="text"
            name="title"
            defaultValue={announcement?.title ?? ""}
            required
            disabled={pending}
          />
        </label>

        <div className={ui.label}>
          {copy.labels.body}
          <AnnouncementEditor
            initialHtml={bodyHtml}
            draftKey={draftKey}
            announcementId={announcement?.id}
            onChange={handleBodyChange}
            onAttachmentUploaded={(file) => {
              setAttachments((current) => {
                if (current.some((item) => item.id === file.id)) {
                  return current;
                }
                if (current.length >= LIMITS.announcementAttachmentsMax) {
                  window.alert(
                    copy.admin.announcementAttachmentsLimit(
                      LIMITS.announcementAttachmentsMax,
                    ),
                  );
                  return current;
                }
                return [...current, file];
              });
            }}
          />
        </div>

        {attachments.length > 0 ? (
          <ul className={styles.attachmentList}>
            {attachments.map((attachment) => (
              <li key={attachment.id} className={styles.attachmentItem}>
                <a
                  href={announcementFileUrl(attachment.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.filename}
                </a>
                {attachment.size > 0 ? (
                  <span className={styles.attachmentSize}>
                    {formatFileSize(attachment.size)}
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.attachmentRemove}
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={pending}
                  aria-label={`${copy.admin.removeAttachment}: ${attachment.filename}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className={ui.checkboxLabel}>
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={announcement?.pinned ?? false}
            disabled={pending}
          />
          {copy.labels.pinned}
        </label>

        {actionState.error ? (
          <p className={ui.formError} role="alert">
            {actionState.error}
          </p>
        ) : null}

        <button className={ui.button} type="submit" disabled={pending}>
          {pending
            ? copy.admin.saving
            : mode === "create"
              ? copy.actions.addAnnouncement
              : copy.actions.saveChanges}
        </button>
      </form>

      {mode === "edit" && announcement ? (
        <form action={deleteFormAction}>
          <CsrfFieldClient token={csrfToken} />
          <input type="hidden" name="id" value={announcement.id} />
          <button
            className={`${ui.button} ${ui.buttonDanger}`}
            type="submit"
            disabled={pending}
          >
            {deletePending ? copy.admin.saving : copy.actions.delete}
          </button>
        </form>
      ) : null}
    </>
  );
}
