"use client";

import { useState } from "react";
import type { Announcement } from "@/lib/types";
import AdminDialog from "@/components/admin/AdminDialog";
import CompactRow from "@/components/admin/CompactRow";
import CsrfFieldClient from "@/components/admin/CsrfFieldClient";
import { copy, withCount } from "@/lib/copy";
import { formatAdminDateTime, formatIso } from "@/lib/format";
import {
  createAction,
  deleteAction,
  updateAction,
} from "@/app/admin/actions";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

export default function AdminAnnouncementsList({
  announcements,
  csrfToken,
}: {
  announcements: Announcement[];
  csrfToken: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);

  function closeEdit(): void {
    setEditItem(null);
  }

  return (
    <section className={`${ui.surface} ${styles.card}`}>
      <div className={styles.sectionToolbar}>
        <h2 className={ui.sectionTitle}>
          {withCount(copy.admin.existingAnnouncements, announcements.length)}
        </h2>
        <button
          type="button"
          className={ui.button}
          onClick={() => setAddOpen(true)}
        >
          {copy.actions.addAnnouncement}
        </button>
      </div>

      {announcements.length === 0 ? (
        <p className={ui.emptyPlain}>{copy.empty.announcements}</p>
      ) : (
        <div className={styles.compactList}>
          {announcements.map((announcement) => (
            <CompactRow
              key={announcement.id}
              label={announcement.title}
              meta={
                <>
                  {announcement.pinned ? (
                    <span className={`${ui.badge} ${ui.badgePinned}`}>
                      {copy.badges.pinned}
                    </span>
                  ) : null}{" "}
                  {formatIso(announcement.createdAt, formatAdminDateTime)}
                </>
              }
              actions={
                <button
                  type="button"
                  className={`${ui.button} ${ui.buttonGhost}`}
                  onClick={() => setEditItem(announcement)}
                >
                  {copy.actions.edit}
                </button>
              }
            />
          ))}
        </div>
      )}

      <AdminDialog
        open={addOpen}
        title={copy.admin.addAnnouncement}
        titleId="add-announcement-title"
        onClose={() => setAddOpen(false)}
        wide
      >
        <form action={createAction} className={ui.form}>
          <CsrfFieldClient token={csrfToken} />
          <label className={ui.label}>
            {copy.labels.title}
            <input className={ui.input} type="text" name="title" required />
          </label>
          <label className={ui.label}>
            {copy.labels.body}
            <textarea className={ui.textarea} name="body" rows={4} required />
          </label>
          <label className={ui.checkboxLabel}>
            <input type="checkbox" name="pinned" />
            {copy.labels.pinned}
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.addAnnouncement}
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        open={editItem !== null}
        title={editItem?.title ?? copy.actions.edit}
        titleId="edit-announcement-title"
        onClose={closeEdit}
        wide
      >
        {editItem ? (
          <>
            <form action={updateAction} className={ui.form}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editItem.id} />
              <label className={ui.label}>
                {copy.labels.title}
                <input
                  className={ui.input}
                  type="text"
                  name="title"
                  defaultValue={editItem.title}
                  required
                />
              </label>
              <label className={ui.label}>
                {copy.labels.body}
                <textarea
                  className={ui.textarea}
                  name="body"
                  rows={6}
                  defaultValue={editItem.body}
                  required
                />
              </label>
              <label className={ui.checkboxLabel}>
                <input
                  type="checkbox"
                  name="pinned"
                  defaultChecked={editItem.pinned}
                />
                {copy.labels.pinned}
              </label>
              <button className={ui.button} type="submit">
                {copy.actions.saveChanges}
              </button>
            </form>
            <form action={deleteAction}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editItem.id} />
              <button
                className={`${ui.button} ${ui.buttonDanger}`}
                type="submit"
              >
                {copy.actions.delete}
              </button>
            </form>
          </>
        ) : null}
      </AdminDialog>
    </section>
  );
}
