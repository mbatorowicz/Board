"use client";

import {
  useEffect,
  useRef,
  useState,
  startTransition,
  type DragEvent,
  type FormEvent,
} from "react";
import type { QuickLink } from "@/lib/types";
import { copy } from "@/lib/copy";
import { LIMITS } from "@/lib/security/limits";
import { collectLinkIds, moveLinkInList } from "@/lib/reorder-links";
import {
  addPersonalLinkAction,
  importPersonalLinksAction,
  removePersonalLinkAction,
} from "@/app/personal-links";
import {
  addDeviceLinkAction,
  removeDeviceLinkAction,
  reorderDeviceLinksAction,
} from "@/app/device-links";
import {
  loadPersonalLinks,
  PERSONAL_LINKS_STORAGE_KEY,
} from "@/lib/personal-links";
import AdminDialog from "@/components/admin/AdminDialog";
import LinkTile from "@/components/LinkTile";
import ui from "@/styles/ui.module.css";
import dialogStyles from "@/styles/dialog.module.css";
import styles from "./components.module.css";

type LinksMode = "device" | "user";

function AddLinkTile({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={styles.addLinkTile}
      onClick={onClick}
      aria-label={label}
    >
      <span className={styles.addLinkTileIcon} aria-hidden="true">
        +
      </span>
      <span className={styles.addLinkTileLabel}>{label}</span>
    </button>
  );
}

function AddLinkModal({
  open,
  onClose,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  title: string;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  function resetForm(): void {
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
    const formData = new FormData();
    formData.set("label", label);
    formData.set("url", url);
    formData.set("description", description);
    await onSubmit(formData);
    handleClose();
  }

  return (
    <AdminDialog
      open={open}
      title={title}
      titleId="add-link-modal-title"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit}>
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
            {title}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}

function EditableLinkRow({
  link,
  removeLabel,
  dragLabel,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: {
  link: QuickLink;
  removeLabel: string;
  dragLabel: string;
  onRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const canDragRef = useRef(false);

  function cancelRemove(): void {
    setConfirmingRemove(false);
  }

  function handleRemoveClick(): void {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    onRemove(link.id);
    setConfirmingRemove(false);
  }

  function handleRowDragStart(event: DragEvent<HTMLDivElement>): void {
    if (!canDragRef.current) {
      event.preventDefault();
      return;
    }

    canDragRef.current = false;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", link.id);

    const row = rowRef.current;
    if (row) {
      const rect = row.getBoundingClientRect();
      const offsetX = Math.min(
        Math.max(event.clientX - rect.left, 0),
        rect.width,
      );
      const offsetY = Math.min(
        Math.max(event.clientY - rect.top, 0),
        rect.height,
      );

      const ghost = row.cloneNode(true) as HTMLDivElement;
      ghost.style.position = "fixed";
      ghost.style.top = "-10000px";
      ghost.style.left = "-10000px";
      ghost.style.width = `${rect.width}px`;
      ghost.style.pointerEvents = "none";
      ghost.classList.add(styles.editableLinkDragGhost);
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, offsetX, offsetY);
      window.setTimeout(() => ghost.remove(), 0);
    }

    onDragStart(link.id);
  }

  function handleRowDragEnd(): void {
    canDragRef.current = false;
    onDragEnd();
  }

  return (
    <div
      ref={rowRef}
      draggable={!confirmingRemove}
      className={[
        styles.editableLinkWrap,
        isDragging ? styles.editableLinkDragging : "",
        confirmingRemove ? styles.editableLinkConfirming : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragStart={handleRowDragStart}
      onDragEnd={handleRowDragEnd}
      onDragOver={(event) => onDragOver(event, link.id)}
      onDrop={(event) => event.preventDefault()}
    >
      <button
        type="button"
        className={styles.linkDragHandle}
        aria-label={`${dragLabel}: ${link.label}`}
        onPointerDown={() => {
          canDragRef.current = true;
        }}
        onPointerUp={() => {
          canDragRef.current = false;
        }}
        onPointerCancel={() => {
          canDragRef.current = false;
        }}
      >
        <span className={styles.linkDragHandleIcon} aria-hidden="true">
          ⠿
        </span>
      </button>
      <LinkTile
        link={link}
        className={styles.linkTileEditable}
        showArrow={false}
      />
      <div
        className={[
          styles.editableLinkActions,
          confirmingRemove ? styles.editableLinkActionsOpen : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {confirmingRemove ? (
          <>
            <span className={styles.editableLinkConfirmText}>
              {copy.deviceLinks.removePrompt}
            </span>
            <button
              type="button"
              className={styles.linkRemoveConfirm}
              onClick={handleRemoveClick}
            >
              {copy.deviceLinks.removeConfirm}
            </button>
            <button
              type="button"
              className={styles.linkRemoveCancel}
              onClick={cancelRemove}
            >
              {copy.deviceLinks.removeCancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.linkRemoveTrigger}
            aria-label={`${removeLabel}: ${link.label}`}
            onClick={handleRemoveClick}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function SortableLinksGrid({
  links: initialLinks,
  removeLabel,
  dragLabel,
  onRemove,
  onReorder,
  canAddMore,
  addLabel,
  onAddClick,
}: {
  links: QuickLink[];
  removeLabel: string;
  dragLabel: string;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => Promise<void>;
  canAddMore: boolean;
  addLabel: string;
  onAddClick: () => void;
}) {
  const [links, setLinks] = useState(initialLinks);
  const dragIdRef = useRef<string | null>(null);
  const linksRef = useRef(initialLinks);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    linksRef.current = links;
  }, [links]);

  function handleDragStart(id: string): void {
    dragIdRef.current = id;
    setDraggingId(id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, overId: string): void {
    event.preventDefault();
    const dragId = dragIdRef.current;
    if (!dragId) {
      return;
    }

    const moved = moveLinkInList(linksRef.current, dragId, overId);
    if (!moved) {
      return;
    }

    linksRef.current = moved.next;
    dragIdRef.current = moved.dragId;
    setLinks(moved.next);
  }

  function handleDragEnd(): void {
    setDraggingId(null);
    dragIdRef.current = null;
    const orderedIds = collectLinkIds(linksRef.current);
    startTransition(() => {
      void onReorder(orderedIds);
    });
  }

  if (links.length === 0 && !canAddMore) {
    return <p className={ui.empty}>{copy.empty.links}</p>;
  }

  return (
    <div className={styles.linksGrid}>
      {links.map((link) => (
        <EditableLinkRow
          key={link.id}
          link={link}
          removeLabel={removeLabel}
          dragLabel={dragLabel}
          onRemove={onRemove}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          isDragging={draggingId === link.id}
        />
      ))}
      {canAddMore ? <AddLinkTile onClick={onAddClick} label={addLabel} /> : null}
    </div>
  );
}

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

export default function QuickLinksPanel({
  globalLinks,
  editableLinks,
  mode,
}: {
  globalLinks: QuickLink[];
  editableLinks: QuickLink[];
  mode: LinksMode;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (mode !== "user" || migratedRef.current) {
      return;
    }
    migratedRef.current = true;

    const local = loadPersonalLinks();
    if (local.length === 0) {
      return;
    }

    void importPersonalLinksAction(local).then(() => {
      try {
        localStorage.removeItem(PERSONAL_LINKS_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    });
  }, [mode]);

  const canAddMore = editableLinks.length < LIMITS.personalLinksMax;

  if (mode === "device") {
    return (
      <>
        <SortableLinksGrid
          key={editableLinks.map((link) => link.id).join(",")}
          links={editableLinks}
          removeLabel={copy.deviceLinks.remove}
          dragLabel={copy.deviceLinks.dragHandle}
          onRemove={(id) => {
            const formData = new FormData();
            formData.set("id", id);
            void removeDeviceLinkAction(formData);
          }}
          onReorder={reorderDeviceLinksAction}
          canAddMore={canAddMore}
          addLabel={copy.deviceLinks.add}
          onAddClick={() => setModalOpen(true)}
        />
        <AddLinkModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={addDeviceLinkAction}
          title={copy.deviceLinks.add}
        />
      </>
    );
  }

  const isEmpty =
    globalLinks.length === 0 && editableLinks.length === 0 && !canAddMore;
  const hasAnyTile =
    globalLinks.length > 0 || editableLinks.length > 0 || canAddMore;

  return (
    <>
      {isEmpty ? (
        <p className={ui.empty}>{copy.empty.links}</p>
      ) : hasAnyTile ? (
        <div className={styles.linksGrid}>
          {globalLinks.map((link) => (
            <LinkTile key={link.id} link={link} />
          ))}
          {editableLinks.map((link) => (
            <PersonalLinkRow key={link.id} link={link} />
          ))}
          {canAddMore ? (
            <AddLinkTile
              onClick={() => setModalOpen(true)}
              label={copy.personalLinks.add}
            />
          ) : null}
        </div>
      ) : null}

      <AddLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={addPersonalLinkAction}
        title={copy.personalLinks.add}
      />
    </>
  );
}
