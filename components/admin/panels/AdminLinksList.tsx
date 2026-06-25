"use client";

import { useState } from "react";
import type { QuickLink } from "@/lib/types";
import AdminDialog from "@/components/admin/AdminDialog";
import CompactRow from "@/components/admin/CompactRow";
import CsrfFieldClient from "@/components/admin/CsrfFieldClient";
import { copy, withCount } from "@/lib/copy";
import {
  createLinkAction,
  deleteLinkAction,
  updateLinkAction,
} from "@/app/admin/actions";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

function truncateUrl(url: string, max = 40): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export default function AdminLinksList({
  links,
  csrfToken,
}: {
  links: QuickLink[];
  csrfToken: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editLink, setEditLink] = useState<QuickLink | null>(null);

  function closeEdit(): void {
    setEditLink(null);
  }

  return (
    <section className={`${ui.surface} ${styles.card}`}>
      <div className={styles.sectionToolbar}>
        <h2 className={ui.sectionTitle}>
          {withCount(copy.admin.quickLinks, links.length)}
        </h2>
        <button
          type="button"
          className={ui.button}
          onClick={() => setAddOpen(true)}
        >
          {copy.actions.addLink}
        </button>
      </div>

      {links.length === 0 ? (
        <p className={ui.emptyPlain}>{copy.empty.links}</p>
      ) : (
        <div className={styles.compactList}>
          {links.map((link) => (
            <CompactRow
              key={link.id}
              label={link.label}
              meta={truncateUrl(link.url)}
              actions={
                <button
                  type="button"
                  className={`${ui.button} ${ui.buttonGhost}`}
                  onClick={() => setEditLink(link)}
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
        title={copy.actions.addLink}
        titleId="add-link-title"
        onClose={() => setAddOpen(false)}
        wide
      >
        <form action={createLinkAction} className={ui.form}>
          <CsrfFieldClient token={csrfToken} />
          <label className={ui.label}>
            {copy.labels.linkName}
            <input className={ui.input} type="text" name="label" required />
          </label>
          <label className={ui.label}>
            {copy.labels.linkUrl}
            <input
              className={ui.input}
              type="url"
              name="url"
              placeholder="https://..."
              required
            />
          </label>
          <label className={ui.label}>
            {copy.labels.linkDescription}
            <input className={ui.input} type="text" name="description" />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.addLink}
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        open={editLink !== null}
        title={editLink?.label ?? copy.actions.edit}
        titleId="edit-link-title"
        onClose={closeEdit}
        wide
      >
        {editLink ? (
          <>
            <form action={updateLinkAction} className={ui.form}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editLink.id} />
              <label className={ui.label}>
                {copy.labels.linkName}
                <input
                  className={ui.input}
                  type="text"
                  name="label"
                  defaultValue={editLink.label}
                  required
                />
              </label>
              <label className={ui.label}>
                {copy.labels.linkUrl}
                <input
                  className={ui.input}
                  type="url"
                  name="url"
                  defaultValue={editLink.url}
                  required
                />
              </label>
              <label className={ui.label}>
                {copy.labels.linkDescription}
                <input
                  className={ui.input}
                  type="text"
                  name="description"
                  defaultValue={editLink.description ?? ""}
                />
              </label>
              <button className={ui.button} type="submit">
                {copy.actions.saveChanges}
              </button>
            </form>
            <form action={deleteLinkAction}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editLink.id} />
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
