import type { Announcement, QuickLink } from "@/lib/types";
import { CsrfField } from "@/components/admin/CsrfField";
import BoardSubNav from "@/components/admin/BoardSubNav";
import AdminAnnouncementsList from "@/components/admin/panels/AdminAnnouncementsList";
import AdminLinksList from "@/components/admin/panels/AdminLinksList";
import { copy } from "@/lib/copy";
import { saveCertCategoriesAction } from "@/app/admin/actions";
import type { BoardSection } from "@/lib/admin-tabs";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

export default function BoardPanel({
  activeSection,
  announcements,
  links,
  certCategories,
  hiddenCategories,
  csrfToken,
  editorOnly,
}: {
  activeSection: BoardSection;
  announcements: Announcement[];
  links: QuickLink[];
  certCategories: string[];
  hiddenCategories: Set<string>;
  csrfToken: string;
  editorOnly: boolean;
}) {
  return (
    <>
      <BoardSubNav activeSection={activeSection} editorOnly={editorOnly} />

      {activeSection === "announcements" ? (
        <AdminAnnouncementsList
          announcements={announcements}
          csrfToken={csrfToken}
        />
      ) : null}

      {activeSection === "links" ? (
        <AdminLinksList links={links} csrfToken={csrfToken} />
      ) : null}

      {activeSection === "cert" ? (
        <section className={`${ui.surface} ${styles.card}`}>
          <h2 className={ui.sectionTitle}>{copy.admin.certCategoriesTitle}</h2>
          {certCategories.length === 0 ? (
            <p className={ui.emptyPlain}>{copy.empty.certCategories}</p>
          ) : (
            <form action={saveCertCategoriesAction} className={ui.form}>
              <CsrfField />
              <p className={ui.notice}>{copy.admin.certCategoriesHelp}</p>
              <div className={styles.categoryList}>
                {certCategories.map((category) => (
                  <label key={category} className={ui.checkboxLabel}>
                    <input type="hidden" name="category" value={category} />
                    <input
                      type="checkbox"
                      name="visible"
                      value={category}
                      defaultChecked={!hiddenCategories.has(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
              <button className={ui.button} type="submit">
                {copy.actions.saveCertCategories}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </>
  );
}
