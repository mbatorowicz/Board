import { headers } from "next/headers";
import { getAdminPassword } from "@/lib/config";
import { getAnnouncements } from "@/lib/announcements";
import { getAcknowledgments } from "@/lib/acknowledgments";
import {
  computeHomePageStats,
  computeUserPageViewStats,
  getPageViews,
} from "@/lib/page-views";
import { getAdvisories } from "@/lib/cert";
import { getQuickLinks } from "@/lib/links";
import { getSettings } from "@/lib/settings";
import { getOfficeLogo } from "@/lib/logo";
import { isAuthed, isEditorAuthed } from "@/lib/admin-auth";
import { getCurrentUser } from "@/lib/user-session";
import { getUsers } from "@/lib/users";
import { resolveAdminTab, resolveBoardSection } from "@/lib/admin-tabs";
import { readFlash } from "@/lib/flash";
import { CsrfField } from "@/components/admin/CsrfField";
import FlashBanner from "@/components/FlashBanner";
import AdminNav from "@/components/admin/AdminNav";
import BoardPanel from "@/components/admin/panels/BoardPanel";
import SettingsPanel from "@/components/admin/panels/SettingsPanel";
import UsersPanel from "@/components/admin/panels/UsersPanel";
import AdminStatsList from "@/components/admin/panels/AdminStatsList";
import { copy } from "@/lib/copy";
import { CSRF_HEADER } from "@/lib/security/csrf";
import { logoutUserAction } from "@/app/user-session";
import ui from "@/styles/ui.module.css";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const loginError =
    typeof params.error === "string" ? params.error : undefined;
  const tabParam = typeof params.tab === "string" ? params.tab : undefined;
  const sectionParam =
    typeof params.section === "string" ? params.section : undefined;
  const flash = await readFlash();
  const hasAdminPassword = Boolean(getAdminPassword());
  const editorAuthed = await isEditorAuthed();
  const fullAdmin = await isAuthed();
  const currentUser = await getCurrentUser();

  if (!hasAdminPassword && !editorAuthed && !fullAdmin) {
    return (
      <main className={styles.page}>
        <div className={`${ui.surface} ${styles.card}`}>
          <h1 className={styles.title}>{copy.admin.title}</h1>
          <p className={ui.notice}>{copy.admin.notConfigured}</p>
        </div>
      </main>
    );
  }

  if (!editorAuthed && !fullAdmin) {
    return (
      <main className={styles.page}>
        <div className={`${ui.surface} ${styles.card}`}>
          <h1 className={styles.title}>{copy.admin.title}</h1>
          <p className={styles.subtitle}>{copy.admin.loginHint}</p>
          {loginError === "rate" ? (
            <p className={ui.error}>{copy.admin.rateLimited}</p>
          ) : null}
          {loginError === "csrf" ? (
            <p className={ui.error}>{copy.admin.csrfFailed}</p>
          ) : null}
          {loginError === "1" ? (
            <p className={ui.error}>{copy.admin.wrongPassword}</p>
          ) : null}
          <form action="/api/admin/login" method="POST" className={ui.form}>
            <CsrfField />
            <label className={ui.label}>
              {copy.labels.password}
              <input
                className={ui.input}
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className={ui.button} type="submit">
              {copy.actions.login}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const isEditorOnly = editorAuthed && !fullAdmin;
  const activeTab = resolveAdminTab(tabParam, fullAdmin, isEditorOnly);
  const boardSection = resolveBoardSection(sectionParam, {
    editorOnly: isEditorOnly,
    legacyAnnouncementsTab: tabParam === "announcements" && !sectionParam,
  });

  const onBoard = activeTab === "board";
  const needsBoardAnnouncements =
    onBoard && boardSection === "announcements";

  const needsBoardLinks =
    fullAdmin && onBoard && boardSection === "links";
  const needsBoardCert = fullAdmin && onBoard && boardSection === "cert";
  const needsSettings = fullAdmin && activeTab === "settings";

  const needsUsers = fullAdmin && activeTab === "users";
  const needsSettingsData =
    needsSettings || needsBoardCert || needsUsers;

  const [
    announcements,
    acknowledgments,
    pageViews,
    advisories,
    links,
    settings,
    logo,
    headerList,
    users,
  ] = await Promise.all([
    needsBoardAnnouncements ? getAnnouncements() : Promise.resolve([]),
    fullAdmin && activeTab === "stats"
      ? getAcknowledgments()
      : Promise.resolve([]),
    fullAdmin && activeTab === "stats"
      ? getPageViews()
      : Promise.resolve([]),
    needsBoardCert ? getAdvisories() : Promise.resolve([]),
    needsBoardLinks ? getQuickLinks() : Promise.resolve([]),
    needsSettingsData ? getSettings() : Promise.resolve(null),
    needsSettings ? getOfficeLogo() : Promise.resolve(null),
    headers(),
    needsUsers ? getUsers() : Promise.resolve([]),
  ]);

  const homePageStats =
    fullAdmin && activeTab === "stats"
      ? computeHomePageStats(pageViews)
      : { visitsLast7Days: 0, uniqueHostsLast7Days: 0, lastVisit: null };
  const userStats =
    fullAdmin && activeTab === "stats"
      ? computeUserPageViewStats(pageViews)
      : [];

  const csrfToken = headerList.get(CSRF_HEADER) ?? "";
  const hiddenCategories = new Set(settings?.hiddenCertCategories ?? []);
  const certCategories = needsBoardCert
    ? Array.from(
        new Set(
          advisories
            .map((advisory) => advisory.category)
            .filter((category) => category.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pl"))
    : [];

  return (
    <main className={styles.page}>
      <FlashBanner flash={flash} />

      <div className={styles.header}>
        <h1 className={styles.title}>{copy.admin.title}</h1>
        {fullAdmin ? (
          <form action="/api/admin/logout" method="POST">
            <CsrfField />
            <button className={`${ui.button} ${ui.buttonGhost}`} type="submit">
              {copy.actions.logout}
            </button>
          </form>
        ) : currentUser ? (
          <form action={logoutUserAction}>
            <button className={`${ui.button} ${ui.buttonGhost}`} type="submit">
              {copy.actions.logout}
            </button>
          </form>
        ) : null}
      </div>

      <AdminNav
        activeTab={activeTab}
        fullAdmin={fullAdmin}
        editorOnly={isEditorOnly}
      />

      {isEditorOnly ? (
        <p className={ui.notice}>{copy.admin.editorOnlyAnnouncements}</p>
      ) : null}

      {onBoard ? (
        <BoardPanel
          activeSection={boardSection}
          announcements={announcements}
          links={links}
          certCategories={certCategories}
          hiddenCategories={hiddenCategories}
          csrfToken={csrfToken}
          editorOnly={isEditorOnly}
        />
      ) : null}

      {fullAdmin && activeTab === "settings" && settings ? (
        <SettingsPanel settings={settings} logo={logo} />
      ) : null}

      {fullAdmin && activeTab === "users" && settings ? (
        <UsersPanel users={users} settings={settings} csrfToken={csrfToken} />
      ) : null}

      {fullAdmin && activeTab === "stats" ? (
        <AdminStatsList
          pageViews={pageViews}
          acknowledgments={acknowledgments}
          userStats={userStats}
          homePageStats={homePageStats}
          csrfToken={csrfToken}
        />
      ) : null}
    </main>
  );
}
