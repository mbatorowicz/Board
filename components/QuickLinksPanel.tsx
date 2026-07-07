"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { QuickLink } from "@/lib/types";
import { copy } from "@/lib/copy";
import { LIMITS } from "@/lib/security/limits";
import {
  addPersonalLinkAction,
  importPersonalLinksAction,
  removePersonalLinkAction,
} from "@/app/personal-links";
import {
  loadPersonalLinks,
  PERSONAL_LINKS_STORAGE_KEY,
} from "@/lib/personal-links";
import AdminDialog from "@/components/admin/AdminDialog";
import LinkTile from "@/components/LinkTile";
import ui from "@/styles/ui.module.css";
import dialogStyles from "@/styles/dialog.module.css";
import styles from "./components.module.css";

function PersonalLinkRow({ link }: { link: QuickLink }) {
  return (
    <div className={styles.personalLinkWrap}>
      <LinkTile link={link} className={styles.linkTilePersonal} />
      <span className={styles.personalLinkBadge}>{copy.personalLinks.badge}</span>
      <form action={removePersonalLinkAction}>
        <input type="hidden" name="id" value={link.id} />
        <button
          type="submit"
          className={styles.personalLinkRemove}
          aria-label={`${copy.personalLinks.remove}: ${link.label}`}
        >
          ×
        </button>
      </form>
    </div>
  );
}

function AddPersonalLinkTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.addLinkTile}
      onClick={onClick}
      aria-label={copy.personalLinks.add}
    >
      <span className={styles.addLinkTileIcon} aria-hidden="true">
        +
      </span>
      <span className={styles.addLinkTileLabel}>{copy.personalLinks.add}</span>
    </button>
  );
}

function PersonalLinkModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  function resetForm(): void {
    setError(null);
    setLabel("");
    setUrl("");
    setDescription("");
  }

  function handleClose(): void {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("label", label);
    formData.set("url", url);
    formData.set("description", description);
    await addPersonalLinkAction(formData);
    handleClose();
  }

  return (
    <AdminDialog
      open={open}
      title={copy.personalLinks.add}
      titleId="personal-link-modal-title"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit}>
        {error ? <p className={ui.error}>{error}</p> : null}

        <label className={ui.label}>
          {copy.labels.linkName}
          <input
            className={ui.input}
            name="label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={LIMITS.linkLabel}
            required
            autoFocus
          />
        </label>
        <label className={ui.label}>
          {copy.labels.linkUrl}
          <input
            className={ui.input}
            name="url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            maxLength={LIMITS.url}
            required
          />
        </label>
        <label className={ui.label}>
          {copy.labels.linkDescription}
          <input
            className={ui.input}
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={LIMITS.linkDescription}
          />
        </label>

        <div className={dialogStyles.dialogActions}>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonGhost}`}
            onClick={handleClose}
          >
            Anuluj
          </button>
          <button type="submit" className={ui.button}>
            {copy.personalLinks.add}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}

export default function QuickLinksPanel({
  globalLinks,
  personalLinks,
  isLoggedIn,
}: {
  globalLinks: QuickLink[];
  personalLinks: QuickLink[];
  isLoggedIn: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || migratedRef.current) return;
    migratedRef.current = true;

    const local = loadPersonalLinks();
    if (local.length === 0) return;

    void importPersonalLinksAction(local).then(() => {
      try {
        localStorage.removeItem(PERSONAL_LINKS_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    });
  }, [isLoggedIn]);

  const canAddMore =
    isLoggedIn && personalLinks.length < LIMITS.personalLinksMax;
  const isEmpty =
    globalLinks.length === 0 && personalLinks.length === 0 && !canAddMore;
  const hasAnyTile =
    globalLinks.length > 0 || personalLinks.length > 0 || canAddMore;

  return (
    <>
      {isEmpty ? (
        <p className={ui.empty}>{copy.empty.links}</p>
      ) : hasAnyTile ? (
        <div className={styles.linksGrid}>
          {globalLinks.map((link) => (
            <LinkTile key={link.id} link={link} />
          ))}
          {personalLinks.map((link) => (
            <PersonalLinkRow key={link.id} link={link} />
          ))}
          {canAddMore ? (
            <AddPersonalLinkTile onClick={() => setModalOpen(true)} />
          ) : null}
        </div>
      ) : null}

      {isLoggedIn ? (
        <PersonalLinkModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
