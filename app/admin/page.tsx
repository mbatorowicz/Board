import { headers } from "next/headers";
import { getAdminPassword } from "@/lib/config";
import { getAnnouncements } from "@/lib/announcements";
import { getAcknowledgments } from "@/lib/acknowledgments";
import { getAdvisories } from "@/lib/cert";
import { getQuickLinks } from "@/lib/links";
import { getSettings } from "@/lib/settings";
import { getAllowedIps } from "@/lib/allowlist";
import { getOfficeLogo } from "@/lib/logo";
import { isAuthed } from "@/lib/admin-auth";
import { HeaderBrandPreview } from "@/components/PageHeader";
import { copy, withCount } from "@/lib/copy";
import { formatAdminDateTime, formatIso } from "@/lib/format";
import {
  allowlistEnforcementEnabled,
  getClientIpFromHeaders,
} from "@/lib/security/client-ip";
import ui from "@/styles/ui.module.css";
import {
  clearAcknowledgmentsAction,
  createAction,
  createLinkAction,
  deleteAction,
  deleteLinkAction,
  removeLogoAction,
  saveAllowlistAction,
  saveHeaderAction,
  saveCertCategoriesAction,
  updateAction,
  updateLinkAction,
  uploadLogoAction,
} from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const hasError = params.error !== undefined;
  const logoStatus =
    typeof params.logo === "string" ? params.logo : undefined;
  const headerStatus =
    typeof params.header === "string" ? params.header : undefined;

  if (!getAdminPassword()) {
    return (
      <main className={styles.page}>
        <div className={`${ui.surface} ${styles.card}`}>
          <h1 className={styles.title}>{copy.admin.title}</h1>
          <p className={ui.notice}>{copy.admin.notConfigured}</p>
        </div>
      </main>
    );
  }

  const authed = await isAuthed();

  if (!authed) {
    return (
      <main className={styles.page}>
        <div className={`${ui.surface} ${styles.card}`}>
          <h1 className={styles.title}>{copy.admin.title}</h1>
          <p className={styles.subtitle}>{copy.admin.loginHint}</p>
          {hasError ? (
            <p className={ui.error}>{copy.admin.wrongPassword}</p>
          ) : null}
          <form action="/api/admin/login" method="POST" className={ui.form}>
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

  const [
    announcements,
    acknowledgments,
    advisories,
    links,
    settings,
    allowedIps,
    logo,
    headerList,
  ] = await Promise.all([
    getAnnouncements(),
    getAcknowledgments(),
    getAdvisories(),
    getQuickLinks(),
    getSettings(),
    getAllowedIps(),
    getOfficeLogo(),
    headers(),
  ]);

  const currentIp = getClientIpFromHeaders(headerList);

  const hiddenCategories = new Set(settings.hiddenCertCategories);
  const certCategories = Array.from(
    new Set(
      advisories
        .map((advisory) => advisory.category)
        .filter((category) => category.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "pl"));

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{copy.admin.title}</h1>
        <form action="/api/admin/logout" method="POST">
          <button className={`${ui.button} ${ui.buttonGhost}`} type="submit">
            {copy.actions.logout}
          </button>
        </form>
      </div>

      <section className={`${ui.surface} ${styles.card}`}>
        <h2 className={ui.sectionTitle}>{copy.admin.headerTitle}</h2>

        <h3 className={styles.subheading}>{copy.admin.headerPreview}</h3>
        <div className={styles.headerPreview}>
          <HeaderBrandPreview
            logo={logo}
            title={settings.headerTitle}
            subtitle={settings.headerSubtitle}
            className={styles.headerPreviewBrand}
            logoClassName={styles.headerPreviewLogo}
            titleClassName={styles.headerPreviewTitle}
            subtitleClassName={styles.headerPreviewSubtitle}
          />
        </div>

        <h3 className={styles.subheading}>{copy.admin.headerTextForm}</h3>
        {headerStatus === "ok" ? (
          <p className={ui.notice}>{copy.admin.headerSaved}</p>
        ) : null}
        {headerStatus === "invalid" ? (
          <p className={ui.error}>{copy.admin.headerInvalid}</p>
        ) : null}
        <form action={saveHeaderAction} className={ui.form}>
          <label className={ui.label}>
            {copy.labels.headerTitle}
            <input
              className={ui.input}
              type="text"
              name="headerTitle"
              defaultValue={settings.headerTitle}
              required
            />
          </label>
          <label className={ui.label}>
            {copy.labels.headerSubtitle}
            <input
              className={ui.input}
              type="text"
              name="headerSubtitle"
              defaultValue={settings.headerSubtitle}
            />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.saveHeader}
          </button>
        </form>

        <h3 className={styles.subheading}>{copy.admin.logoForm}</h3>
        <p className={ui.notice}>{copy.admin.logoHelp}</p>
        {logoStatus === "ok" ? (
          <p className={ui.notice}>Logo zostało zapisane.</p>
        ) : null}
        {logoStatus === "removed" ? (
          <p className={ui.notice}>Logo zostało usunięte.</p>
        ) : null}
        {logoStatus === "invalid" ? (
          <p className={ui.error}>
            Nie udało się wgrać logo. Dozwolone: PNG, JPG lub WebP, maks. 2 MB.
          </p>
        ) : null}
        {!logo ? (
          <p className={ui.emptyPlain}>{copy.admin.logoMissing}</p>
        ) : null}
        <form
          action={uploadLogoAction}
          className={ui.form}
          encType="multipart/form-data"
        >
          <label className={ui.label}>
            {copy.labels.logoFile}
            <input
              className={styles.fileInput}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
            />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.uploadLogo}
          </button>
        </form>
        {logo ? (
          <form action={removeLogoAction}>
            <button
              className={`${ui.button} ${ui.buttonGhost}`}
              type="submit"
            >
              {copy.actions.removeLogo}
            </button>
          </form>
        ) : null}
      </section>

      <section className={`${ui.surface} ${styles.card}`}>
        <h2 className={ui.sectionTitle}>{copy.admin.allowlistTitle}</h2>
        <p className={ui.notice}>{copy.admin.allowlistHelp}</p>
        {!allowlistEnforcementEnabled() ? (
          <p className={ui.warning}>
            Allowlista IP jest wyłączona (brak TRUST_PROXY=true). Ochrona opiera
            się na dostępie tylko z sieci urzędu.
          </p>
        ) : null}
        <p className={ui.notice}>
          {currentIp
            ? copy.admin.allowlistCurrentIp(currentIp)
            : copy.admin.allowlistUnknownIp}
        </p>
        <p className={ui.warning}>{copy.admin.allowlistWarning}</p>
        <form action={saveAllowlistAction} className={ui.form}>
          <label className={ui.label}>
            {copy.labels.allowedIps}
            <textarea
              className={ui.textarea}
              name="ips"
              rows={5}
              defaultValue={allowedIps.join("\n")}
              placeholder="192.168.1.10&#10;192.168.1.0/24"
            />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.saveAllowlist}
          </button>
        </form>
      </section>

      <section className={`${ui.surface} ${styles.card}`}>
        <h2 className={ui.sectionTitle}>{copy.admin.certCategoriesTitle}</h2>
        {certCategories.length === 0 ? (
          <p className={ui.emptyPlain}>{copy.empty.certCategories}</p>
        ) : (
          <form action={saveCertCategoriesAction} className={ui.form}>
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

      <section className={`${ui.surface} ${styles.card}`}>
        <h2 className={ui.sectionTitle}>{copy.admin.addAnnouncement}</h2>
        <form action={createAction} className={ui.form}>
          <label className={ui.label}>
            {copy.labels.title}
            <input className={ui.input} type="text" name="title" required />
          </label>
          <label className={ui.label}>
            {copy.labels.body}
            <textarea className={ui.textarea} name="body" rows={4} required />
          </label>
          <label className={ui.checkboxLabel}>
            <input type="checkbox" name="pinned" />
            {copy.labels.pinned}
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.addAnnouncement}
          </button>
        </form>
      </section>

      <section className={styles.list}>
        <h2 className={ui.sectionTitle}>
          {withCount(copy.admin.existingAnnouncements, announcements.length)}
        </h2>
        {announcements.length === 0 ? (
          <p className={ui.emptyPlain}>{copy.empty.announcements}</p>
        ) : (
          announcements.map((announcement) => (
            <article key={announcement.id} className={`${ui.surface} ${styles.card}`}>
              <div className={`${ui.meta} ${styles.meta}`}>
                {announcement.pinned ? (
                  <span className={`${ui.badge} ${ui.badgePinned}`}>
                    {copy.badges.pinned}
                  </span>
                ) : null}
                <span className={ui.mutedDate}>
                  {formatIso(announcement.createdAt, formatAdminDateTime)}
                </span>
              </div>
              <form action={updateAction} className={ui.form}>
                <input type="hidden" name="id" value={announcement.id} />
                <label className={ui.label}>
                  {copy.labels.title}
                  <input
                    className={ui.input}
                    type="text"
                    name="title"
                    defaultValue={announcement.title}
                    required
                  />
                </label>
                <label className={ui.label}>
                  {copy.labels.body}
                  <textarea
                    className={ui.textarea}
                    name="body"
                    rows={4}
                    defaultValue={announcement.body}
                    required
                  />
                </label>
                <label className={ui.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="pinned"
                    defaultChecked={announcement.pinned}
                  />
                  {copy.labels.pinned}
                </label>
                <button className={ui.button} type="submit">
                  {copy.actions.edit}
                </button>
              </form>
              <form action={deleteAction} className={ui.deleteForm}>
                <input type="hidden" name="id" value={announcement.id} />
                <button
                  className={`${ui.button} ${ui.buttonDanger}`}
                  type="submit"
                >
                  {copy.actions.delete}
                </button>
              </form>
            </article>
          ))
        )}
      </section>

      <section className={`${ui.surface} ${styles.card}`}>
        <h2 className={ui.sectionTitle}>{copy.admin.addLink}</h2>
        <form action={createLinkAction} className={ui.form}>
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
      </section>

      <section className={styles.list}>
        <h2 className={ui.sectionTitle}>
          {withCount(copy.admin.quickLinks, links.length)}
        </h2>
        {links.length === 0 ? (
          <p className={ui.emptyPlain}>{copy.empty.links}</p>
        ) : (
          links.map((link) => (
            <article key={link.id} className={`${ui.surface} ${styles.card}`}>
              <form action={updateLinkAction} className={ui.form}>
                <input type="hidden" name="id" value={link.id} />
                <label className={ui.label}>
                  {copy.labels.linkName}
                  <input
                    className={ui.input}
                    type="text"
                    name="label"
                    defaultValue={link.label}
                    required
                  />
                </label>
                <label className={ui.label}>
                  {copy.labels.linkUrl}
                  <input
                    className={ui.input}
                    type="url"
                    name="url"
                    defaultValue={link.url}
                    required
                  />
                </label>
                <label className={ui.label}>
                  {copy.labels.linkDescription}
                  <input
                    className={ui.input}
                    type="text"
                    name="description"
                    defaultValue={link.description ?? ""}
                  />
                </label>
                <button className={ui.button} type="submit">
                  {copy.actions.saveLink}
                </button>
              </form>
              <form action={deleteLinkAction} className={ui.deleteForm}>
                <input type="hidden" name="id" value={link.id} />
                <button
                  className={`${ui.button} ${ui.buttonDanger}`}
                  type="submit"
                >
                  {copy.actions.delete}
                </button>
              </form>
            </article>
          ))
        )}
      </section>

      <section className={`${ui.surface} ${styles.card}`}>
        <div className={styles.ackHeader}>
          <h2 className={ui.sectionTitle}>
            {withCount(copy.admin.acknowledgments, acknowledgments.length)}
          </h2>
          {acknowledgments.length > 0 ? (
            <form action={clearAcknowledgmentsAction}>
              <button
                className={`${ui.button} ${ui.buttonGhost}`}
                type="submit"
              >
                {copy.actions.clearAcknowledgments}
              </button>
            </form>
          ) : null}
        </div>
        {acknowledgments.length === 0 ? (
          <p className={ui.emptyPlain}>{copy.empty.acknowledgments}</p>
        ) : (
          <ul className={styles.ackList}>
            {acknowledgments.map((ack) => (
              <li key={ack.id} className={styles.ackItem}>
                <span className={styles.ackName}>{ack.name}</span>
                <span className={ui.mutedDate}>
                  {formatIso(ack.createdAt, formatAdminDateTime)}
                </span>
                {ack.ip ? (
                  <span className={styles.ackIp}>{ack.ip}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
