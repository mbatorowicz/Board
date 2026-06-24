"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { QuickLink } from "@/lib/types";
import { copy } from "@/lib/copy";
import { LIMITS } from "@/lib/security/limits";
import {
  addPersonalLink,
  loadPersonalLinks,
  personalLinkErrorMessage,
  removePersonalLink,
  savePersonalLinks,
} from "@/lib/personal-links";
import LinkTile from "@/components/LinkTile";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

function PersonalLinkRow({
  link,
  onRemove,
}: {
  link: QuickLink;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={styles.personalLinkWrap}>
      <LinkTile link={link} className={styles.linkTilePersonal} />
      <span className={styles.personalLinkBadge}>{copy.personalLinks.badge}</span>
      <button
        type="button"
        className={styles.personalLinkRemove}
        onClick={() => onRemove(link.id)}
        aria-label={`${copy.personalLinks.remove}: ${link.label}`}
      >
        ×
      </button>
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
  links,
  onClose,
  onLinksChange,
}: {
  open: boolean;
  links: QuickLink[];
  onClose: () => void;
  onLinksChange: (next: QuickLink[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    const result = addPersonalLink(links, {
      label,
      url,
      description: description || undefined,
    });

    if ("error" in result) {
      setError(personalLinkErrorMessage(result.error));
      return;
    }

    savePersonalLinks(result.links);
    onLinksChange(result.links);
    handleClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.personalLinkModal}
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <form className={styles.personalLinkModalInner} onSubmit={handleSubmit}>
        <div className={styles.personalLinkModalHead}>
          <h3 className={styles.personalLinksTitle}>{copy.personalLinks.add}</h3>
          <button
            type="button"
            className={styles.personalLinkModalClose}
            onClick={handleClose}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

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

        <div className={styles.personalLinkModalActions}>
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
    </dialog>
  );
}

export default function QuickLinksPanel({
  globalLinks,
}: {
  globalLinks: QuickLink[];
}) {
  const [personalLinks, setPersonalLinks] = useState<QuickLink[]>([]);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setPersonalLinks(loadPersonalLinks());
    setReady(true);
  }, []);

  function handleRemove(id: string): void {
    const next = removePersonalLink(personalLinks, id);
    setPersonalLinks(next);
    savePersonalLinks(next);
  }

  const canAddMore = personalLinks.length < LIMITS.personalLinksMax;

  return (
    <>
      {globalLinks.length > 0 ? (
        <div className={styles.linksGrid}>
          {globalLinks.map((link) => (
            <LinkTile key={link.id} link={link} />
          ))}
        </div>
      ) : (
        <p className={ui.empty}>{copy.empty.links}</p>
      )}

      {ready ? (
        <div className={styles.personalLinksBlock}>
          <h3 className={styles.personalLinksTitle}>{copy.personalLinks.title}</h3>
          <div className={styles.linksGrid}>
            {personalLinks.map((link) => (
              <PersonalLinkRow
                key={link.id}
                link={link}
                onRemove={handleRemove}
              />
            ))}
            {canAddMore ? (
              <AddPersonalLinkTile onClick={() => setModalOpen(true)} />
            ) : null}
          </div>
        </div>
      ) : null}

      <PersonalLinkModal
        open={modalOpen}
        links={personalLinks}
        onClose={() => setModalOpen(false)}
        onLinksChange={setPersonalLinks}
      />
    </>
  );
}
