"use client";

import { useEffect, useState, type FormEvent } from "react";
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

function PersonalLinkForm({
  links,
  onLinksChange,
}: {
  links: QuickLink[];
  onLinksChange: (next: QuickLink[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

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
    setLabel("");
    setUrl("");
    setDescription("");
  }

  return (
    <form
      className={`${ui.form} ${styles.personalLinksForm}`}
      onSubmit={handleSubmit}
    >
      <h3 className={styles.personalLinksTitle}>{copy.personalLinks.add}</h3>
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
      <button type="submit" className={ui.button}>
        {copy.personalLinks.add}
      </button>
    </form>
  );
}

export default function QuickLinksPanel({
  globalLinks,
}: {
  globalLinks: QuickLink[];
}) {
  const [personalLinks, setPersonalLinks] = useState<QuickLink[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersonalLinks(loadPersonalLinks());
    setReady(true);
  }, []);

  function handleRemove(id: string): void {
    const next = removePersonalLink(personalLinks, id);
    setPersonalLinks(next);
    savePersonalLinks(next);
  }

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

      {ready && personalLinks.length > 0 ? (
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
          </div>
        </div>
      ) : null}

      <PersonalLinkForm links={personalLinks} onLinksChange={setPersonalLinks} />
    </>
  );
}
