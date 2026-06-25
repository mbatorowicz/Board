import Link from "next/link";
import {
  ADMIN_TABS,
  adminTabHref,
  type AdminTab,
} from "@/lib/admin-tabs";
import styles from "@/app/admin/admin.module.css";

export default function AdminNav({
  activeTab,
  fullAdmin,
  editorOnly,
}: {
  activeTab: AdminTab;
  fullAdmin: boolean;
  editorOnly: boolean;
}) {
  const tabs = ADMIN_TABS.filter(
    (tab) => fullAdmin || (!tab.fullAdminOnly && editorOnly),
  );

  return (
    <nav className={styles.tabNav} aria-label="Sekcje panelu">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={adminTabHref(tab.id)}
          className={`${styles.tabLink} ${
            activeTab === tab.id ? styles.tabLinkActive : ""
          }`}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
