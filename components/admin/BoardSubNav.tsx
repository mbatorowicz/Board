import Link from "next/link";
import {
  boardSectionsForRole,
  boardTabHref,
  type BoardSection,
} from "@/lib/admin-tabs";
import styles from "@/app/admin/admin.module.css";

export default function BoardSubNav({
  activeSection,
  editorOnly,
}: {
  activeSection: BoardSection;
  editorOnly: boolean;
}) {
  const sections = boardSectionsForRole(editorOnly);

  if (sections.length <= 1) {
    return null;
  }

  return (
    <nav className={styles.tabNav} aria-label="Sekcje tablicy">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={boardTabHref(section.id)}
          className={`${styles.tabLink} ${
            activeSection === section.id ? styles.tabLinkActive : ""
          }`}
          aria-current={activeSection === section.id ? "page" : undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
