import Link from "next/link";
import { env } from "cloudflare:workers";
import {
  Activity,
  Database,
  Film,
  Radio,
  Server,
  Settings2,
  Users,
} from "lucide-react";
import { AdminActions, BlockChannelForm } from "@/components/admin/admin-actions";
import {
  getAdminStats,
  getProviderStatuses,
  getRecentAudit,
  getRecentSyncJobs,
  getRegisteredServers,
} from "@/lib/admin/stats";
import { createTranslator } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

const SECTIONS = [
  { key: "overview", labelKey: "admin.stats", icon: Activity },
  { key: "catalog", labelKey: "admin.catalog", icon: Film },
  { key: "playback", labelKey: "admin.playback", icon: Server },
  { key: "live", labelKey: "admin.liveTv", icon: Radio },
  { key: "system", labelKey: "admin.system", icon: Settings2 },
] as const;

export type AdminSection = (typeof SECTIONS)[number]["key"];

export async function AdminDashboard({
  locale,
  section,
}: {
  locale: Locale;
  section: AdminSection;
}) {
  const { t, formatDate, formatNumber } = createTranslator(locale);
  const [stats, audit, jobs, servers, providers] = await Promise.all([
    getAdminStats(),
    getRecentAudit(20),
    getRecentSyncJobs(10),
    getRegisteredServers(),
    section === "playback" ? getProviderStatuses() : Promise.resolve([]),
  ]);

  return (
    <main className="page admin-page">
      <header className="page-intro">
        <span className="kicker">{t("common.admin")}</span>
        <h1>{t("admin.title")}</h1>
        <p>{t("admin.subtitle")}</p>
      </header>

      <nav className="admin-tabs" aria-label={t("admin.title")}>
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const href = item.key === "overview" ? "/admin" : `/admin/${item.key}`;
          return (
            <Link
              key={item.key}
              href={localePath(locale, href)}
              className={section === item.key ? "active" : undefined}
              aria-current={section === item.key ? "page" : undefined}
            >
              <Icon size={16} /> {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {section === "overview" && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <Users size={18} />
              <strong>{formatNumber(stats.users)}</strong>
              <span>{t("admin.users")}</span>
            </div>
            <div className="stat-card">
              <Film size={18} />
              <strong>{formatNumber(stats.titles)}</strong>
              <span>{t("admin.titles")}</span>
            </div>
            <div className="stat-card">
              <Radio size={18} />
              <strong>{formatNumber(stats.channels)}</strong>
              <span>{t("admin.channels")}</span>
            </div>
            <div className="stat-card">
              <Server size={18} />
              <strong>{formatNumber(stats.servers)}</strong>
              <span>{t("admin.serverRegistry")}</span>
            </div>
            <div className="stat-card">
              <Database size={18} />
              <strong>{stats.databaseReady ? "D1" : "—"}</strong>
              <span>{t("admin.system")}</span>
            </div>
          </div>
          <AdminActions />
        </>
      )}

      {section === "catalog" && (
        <>
          <AdminActions />
          <section className="admin-panel">
            <h2>{t("admin.stats")}</h2>
            <p className="muted-text">
              {formatNumber(stats.titles)} {t("admin.titles")}
            </p>
            <p className="muted-text">
              TMDB: {env.TMDB_READ_ACCESS_TOKEN ? "configured" : "not configured"} ·
              AniList: public GraphQL
            </p>
          </section>
        </>
      )}

      {section === "playback" && (
        <>
          <section className="admin-panel">
            <h2>{t("admin.providerStatus")}</h2>
            <div className="provider-list">
              {providers.length === 0 && <p className="muted-text">{t("admin.noData")}</p>}
              {providers.map((provider) => (
                <div key={provider.providerId} className="provider-row">
                  <span className={`status-dot ${provider.status}`} />
                  <strong>{provider.providerId}</strong>
                  <small>{provider.message ?? provider.status}</small>
                  <span>{formatDate(provider.checkedAt)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-panel">
            <h2>{t("admin.serverRegistry")}</h2>
            {servers.length === 0 ? (
              <p className="muted-text">{t("admin.noData")}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("player.server")}</th>
                      <th>{t("common.category")}</th>
                      <th>{t("live.health")}</th>
                      <th>{t("admin.lastRun")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map((server) => (
                      <tr key={server.id}>
                        <td>{server.displayName}</td>
                        <td>{server.region ?? server.providerKey}</td>
                        <td>{server.healthStatus}</td>
                        <td>{server.lastHealthCheck ? formatDate(server.lastHealthCheck) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {section === "live" && (
        <>
          <AdminActions />
          <BlockChannelForm />
          <section className="admin-panel">
            <h2>{t("admin.channels")}</h2>
            <p className="muted-text">
              {formatNumber(stats.channels)} {t("admin.channels")}
            </p>
            <p className="rights-note">{t("live.rightsNotice")}</p>
          </section>
        </>
      )}

      {section === "system" && (
        <>
          <AdminActions />
          <section className="admin-panel">
            <h2>{t("admin.syncHistory")}</h2>
            {jobs.length === 0 ? (
              <p className="muted-text">{t("admin.noData")}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("common.category")}</th>
                      <th>{t("admin.lastRun")}</th>
                      <th>{t("admin.items")}</th>
                      <th>{t("admin.errors")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.jobType} · {job.status}</td>
                        <td>{formatDate(job.finishedAt ?? job.createdAt)}</td>
                        <td>{job.itemsProcessed}</td>
                        <td>{job.errorCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="admin-panel">
            <h2>{t("admin.auditLog")}</h2>
            {audit.length === 0 ? (
              <p className="muted-text">{t("admin.noData")}</p>
            ) : (
              <div className="audit-list">
                {audit.map((entry) => (
                  <div key={entry.id} className="audit-row">
                    <strong>{entry.action}</strong>
                    <span>{entry.targetType ?? "—"}</span>
                    <small>{formatDate(entry.createdAt)}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
