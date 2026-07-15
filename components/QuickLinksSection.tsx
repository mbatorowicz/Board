"use client";

import { useSyncExternalStore } from "react";
import type { QuickLink } from "@/lib/types";
import { copy } from "@/lib/copy";
import {
  persistQuickLinksCollapsed,
  readQuickLinksCollapsed,
  subscribeQuickLinksCollapsed,
} from "@/lib/quick-links-panel";
import QuickLinksPanel from "@/components/QuickLinksPanel";
import ui from "@/styles/ui.module.css";
import pageStyles from "@/app/page.module.css";
import styles from "./components.module.css";

type LinksMode = "device" | "user";

export default function QuickLinksSection({
  globalLinks,
  editableLinks,
  mode,
}: {
  globalLinks: QuickLink[];
  editableLinks: QuickLink[];
  mode: LinksMode;
}) {
  const collapsed = useSyncExternalStore(
    subscribeQuickLinksCollapsed,
    readQuickLinksCollapsed,
    () => false,
  );

  function toggleCollapsed(): void {
    persistQuickLinksCollapsed(!collapsed);
  }

  const linkCount = globalLinks.length + editableLinks.length;
  const expanded = !collapsed;

  return (
    <section
      className={[
        ui.panel,
        pageStyles.linksBar,
        collapsed ? styles.linksPanelCollapsed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="links-heading"
    >
      <div
        className={[
          ui.panelHead,
          collapsed ? styles.linksPanelHeadCollapsed : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <h2 id="links-heading" className={ui.panelTitle}>
          {copy.sections.quickLinks}
          {collapsed && linkCount > 0 ? (
            <span className={styles.linksPanelCount}>{linkCount}</span>
          ) : null}
        </h2>
        <button
          type="button"
          className={styles.linksPanelToggle}
          onClick={toggleCollapsed}
          aria-expanded={expanded}
          aria-controls="links-panel-body"
          aria-label={
            expanded
              ? copy.quickLinksPanel.collapse
              : copy.quickLinksPanel.expand
          }
        >
          <span className={styles.linksPanelToggleIcon} aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
        </button>
      </div>
      {expanded ? (
        <div id="links-panel-body" className={styles.linksPanelBody}>
          <QuickLinksPanel
            globalLinks={globalLinks}
            editableLinks={editableLinks}
            mode={mode}
          />
        </div>
      ) : null}
    </section>
  );
}
