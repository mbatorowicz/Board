"use client";

import { useState } from "react";
import type { Acknowledgment, PageView } from "@/lib/types";
import type { UserPageViewStats } from "@/lib/page-views";
import AdminDialog from "@/components/admin/AdminDialog";
import CompactRow from "@/components/admin/CompactRow";
import CsrfFieldClient from "@/components/admin/CsrfFieldClient";
import { copy, withCount } from "@/lib/copy";
import { formatAdminDateTime, formatIso } from "@/lib/format";
import {
  clearAcknowledgmentsAction,
  clearPageViewsAction,
} from "@/app/admin/actions";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

type DetailView =
  | { kind: "userStat"; data: UserPageViewStats }
  | { kind: "pageView"; data: PageView }
  | { kind: "ack"; data: Acknowledgment }
  | null;

export default function AdminStatsList({
  pageViews,
  acknowledgments,
  userStats,
  homePageStats,
  csrfToken,
}: {
  pageViews: PageView[];
  acknowledgments: Acknowledgment[];
  userStats: UserPageViewStats[];
  homePageStats: {
    visitsLast7Days: number;
    uniqueHostsLast7Days: number;
    lastVisit: PageView | null;
  };
  csrfToken: string;
}) {
  const [detail, setDetail] = useState<DetailView>(null);

  function closeDetail(): void {
    setDetail(null);
  }

  return (
    <>
      {userStats.length > 0 ? (
        <section className={`${ui.surface} ${styles.card}`}>
          <h2 className={ui.sectionTitle}>{copy.admin.userStatsTitle}</h2>
          <div className={styles.compactList}>
            {userStats.map((stats) => (
              <CompactRow
                key={stats.userId}
                label={stats.userName}
                meta={copy.admin.userStatsVisits7(
                  stats.userName,
                  stats.visitsLast7Days,
                )}
                actions={
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonGhost}`}
                    onClick={() =>
                      setDetail({ kind: "userStat", data: stats })
                    }
                  >
                    {copy.actions.details}
                  </button>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${ui.surface} ${styles.card}`}>
        <div className={styles.ackHeader}>
          <h2 className={ui.sectionTitle}>
            {withCount(copy.admin.pageViews, pageViews.length)}
          </h2>
          {pageViews.length > 0 ? (
            <form action={clearPageViewsAction}>
              <CsrfFieldClient token={csrfToken} />
              <button
                className={`${ui.button} ${ui.buttonGhost}`}
                type="submit"
              >
                {copy.actions.clearPageViews}
              </button>
            </form>
          ) : null}
        </div>
        <p className={ui.notice}>{copy.admin.pageViewsHelp}</p>
        <div className={styles.pageViewStats}>
          <p className={ui.notice}>
            {copy.admin.pageViewsStatsVisits(homePageStats.visitsLast7Days)}
          </p>
          <p className={ui.notice}>
            {copy.admin.pageViewsStatsHosts(
              homePageStats.uniqueHostsLast7Days,
            )}
          </p>
          {homePageStats.lastVisit ? (
            <p className={ui.notice}>
              {copy.admin.pageViewsLastVisit(
                formatIso(
                  homePageStats.lastVisit.createdAt,
                  formatAdminDateTime,
                ),
                homePageStats.lastVisit.host,
              )}
            </p>
          ) : (
            <p className={ui.emptyPlain}>{copy.admin.pageViewsNoLastVisit}</p>
          )}
        </div>
        {pageViews.length === 0 ? (
          <p className={ui.emptyPlain}>{copy.empty.pageViews}</p>
        ) : (
          <div className={styles.compactList}>
            {pageViews.map((view) => (
              <CompactRow
                key={view.id}
                label={view.path}
                meta={`${view.userName ?? view.host} · ${formatIso(view.createdAt, formatAdminDateTime)}`}
                actions={
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonGhost}`}
                    onClick={() =>
                      setDetail({ kind: "pageView", data: view })
                    }
                  >
                    {copy.actions.details}
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className={`${ui.surface} ${styles.card}`}>
        <div className={styles.ackHeader}>
          <h2 className={ui.sectionTitle}>
            {withCount(copy.admin.acknowledgments, acknowledgments.length)}
          </h2>
          {acknowledgments.length > 0 ? (
            <form action={clearAcknowledgmentsAction}>
              <CsrfFieldClient token={csrfToken} />
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
          <div className={styles.compactList}>
            {acknowledgments.map((ack) => (
              <CompactRow
                key={ack.id}
                label={ack.name}
                meta={formatIso(ack.createdAt, formatAdminDateTime)}
                actions={
                  <button
                    type="button"
                    className={`${ui.button} ${ui.buttonGhost}`}
                    onClick={() => setDetail({ kind: "ack", data: ack })}
                  >
                    {copy.actions.details}
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <AdminDialog
        open={detail !== null}
        title={copy.actions.details}
        titleId="stats-detail-title"
        onClose={closeDetail}
        wide
      >
        {detail?.kind === "userStat" ? (
          <dl className={styles.detailList}>
            <dt>{copy.labels.fullName}</dt>
            <dd>{detail.data.userName}</dd>
            <dt>{copy.admin.statsVisits7}</dt>
            <dd>{detail.data.visitsLast7Days}</dd>
            <dt>{copy.admin.statsVisits30}</dt>
            <dd>{detail.data.visitsLast30Days}</dd>
            {detail.data.lastVisit ? (
              <>
                <dt>{copy.admin.statsLastVisit}</dt>
                <dd>
                  {formatIso(
                    detail.data.lastVisit.createdAt,
                    formatAdminDateTime,
                  )}{" "}
                  — {detail.data.lastVisit.host}
                  {detail.data.lastVisit.ip
                    ? ` (${detail.data.lastVisit.ip})`
                    : ""}
                </dd>
              </>
            ) : null}
          </dl>
        ) : null}
        {detail?.kind === "pageView" ? (
          <dl className={styles.detailList}>
            <dt>{copy.admin.detailPath}</dt>
            <dd>{detail.data.path}</dd>
            <dt>{copy.admin.detailHost}</dt>
            <dd>{detail.data.host}</dd>
            {detail.data.userName ? (
              <>
                <dt>{copy.labels.fullName}</dt>
                <dd>{detail.data.userName}</dd>
              </>
            ) : null}
            <dt>{copy.admin.detailDate}</dt>
            <dd>
              {formatIso(detail.data.createdAt, formatAdminDateTime)}
            </dd>
            {detail.data.ip ? (
              <>
                <dt>IP</dt>
                <dd>{detail.data.ip}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
        {detail?.kind === "ack" ? (
          <dl className={styles.detailList}>
            <dt>{copy.labels.fullName}</dt>
            <dd>{detail.data.name}</dd>
            <dt>{copy.admin.detailDate}</dt>
            <dd>{formatIso(detail.data.createdAt, formatAdminDateTime)}</dd>
            {detail.data.ip ? (
              <>
                <dt>IP</dt>
                <dd>{detail.data.ip}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </AdminDialog>
    </>
  );
}
