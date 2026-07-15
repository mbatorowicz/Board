"use client";

import { useState } from "react";
import type { Announcement } from "@/lib/types";
import AdminDialog from "@/components/admin/AdminDialog";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import CompactRow from "@/components/admin/CompactRow";
import { copy, withCount } from "@/lib/copy";
import { formatAdminDateTime, formatIso } from "@/lib/format";
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

  function closeAdd(): void {
    setAddOpen(false);
  }

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
        onClose={closeAdd}
        wide
      >
        {addOpen ? (
          <AnnouncementForm
            key="create"
            mode="create"
            csrfToken={csrfToken}
            onSuccess={closeAdd}
          />
        ) : null}
      </AdminDialog>

      <AdminDialog
        open={editItem !== null}
        title={editItem?.title ?? copy.actions.edit}
        titleId="edit-announcement-title"
        onClose={closeEdit}
        wide
      >
        {editItem ? (
          <AnnouncementForm
            key={editItem.id}
            mode="edit"
            csrfToken={csrfToken}
            announcement={editItem}
            onSuccess={closeEdit}
          />
        ) : null}
      </AdminDialog>
    </section>
  );
}
