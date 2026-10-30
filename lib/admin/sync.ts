import { eq } from "drizzle-orm";
import { tryGetDb } from "@/db";
import {
  adminAuditLogs,
  channelSources,
  channels,
  syncJobs,
  syncLogs,
  titles,
} from "@/db/schema";
import { anilist } from "@/lib/metadata/anilist";
import { tmdb, tmdbEnabled } from "@/lib/metadata/tmdb";
import { loadApiChannels } from "@/lib/live/iptv";
import type { CatalogTitle } from "@/lib/catalog/types";

export type SyncJobType = "tmdb" | "anilist" | "iptv" | "epg";

export type SyncResult = {
  jobId: string | null;
  jobType: SyncJobType;
  status: "success" | "failed" | "unavailable";
  itemsProcessed: number;
  errors: number;
  message: string;
};

/**
 * Ensures a catalog row exists for a metadata item. TMDB/AniList identifiers
 * stay in their own columns so the same title can be linked to both sources.
 */
async function upsertTitle(item: CatalogTitle) {
  const db = tryGetDb();
  if (!db) throw new Error("database_unavailable");

  await db
    .insert(titles)
    .values({
      id: item.id,
      type: item.type,
      tmdbId: item.tmdbId,
      anilistId: item.anilistId,
      imdbId: item.imdbId,
      originalTitle: item.originalTitle,
      originalLanguage: item.originalLanguage,
      releaseDate: item.releaseDate,
      status: item.status,
      runtimeMinutes: item.runtimeMinutes,
      episodeCount: item.episodeCount,
      seasonCount: item.seasonCount,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      trailerKey: item.trailerKey,
      overview: item.overview,
      tagline: item.tagline,
      voteAverage: item.voteAverage,
      popularity: item.popularity,
      enabled: true,
      syncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: titles.id,
      set: {
        type: item.type,
        originalTitle: item.originalTitle,
        overview: item.overview,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        releaseDate: item.releaseDate,
        voteAverage: item.voteAverage,
        popularity: item.popularity,
        runtimeMinutes: item.runtimeMinutes,
        episodeCount: item.episodeCount,
        seasonCount: item.seasonCount,
        status: item.status,
        tagline: item.tagline,
        trailerKey: item.trailerKey,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

async function recordAudit(
  userId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  const db = tryGetDb();
  if (!db) return;
  try {
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      userId,
      action,
      targetType: "sync_job",
      metadataJson: metadata,
    });
  } catch {
    // Audit failures must not mask the sync result; the job row still exists.
  }
}

export async function runSyncJob(
  jobType: SyncJobType,
  userId: string,
): Promise<SyncResult> {
  const db = tryGetDb();
  if (!db) {
    return {
      jobId: null,
      jobType,
      status: "unavailable",
      itemsProcessed: 0,
      errors: 0,
      message: "Database is not available. Apply migrations before running sync jobs.",
    };
  }

  const jobId = crypto.randomUUID();
  try {
    await db.insert(syncJobs).values({
      id: jobId,
      jobType,
      status: "running",
      startedAt: new Date(),
      triggeredBy: userId,
    });
  } catch {
    return {
      jobId: null,
      jobType,
      status: "unavailable",
      itemsProcessed: 0,
      errors: 0,
      message: "sync_jobs table is missing. Apply migrations first.",
    };
  }

  let processed = 0;
  let errors = 0;
  let message = "";

  try {
    if (jobType === "tmdb") {
      if (!tmdbEnabled()) throw new Error("TMDB_READ_ACCESS_TOKEN is not configured.");
      const [trending, movies, shows] = await Promise.all([
        tmdb.trending("all", "week", "en"),
        tmdb.discover("movie", { page: 1, sort_by: "popularity.desc" }, "en"),
        tmdb.discover("tv", { page: 1, sort_by: "popularity.desc" }, "en"),
      ]);
      const seen = new Set<string>();
      for (const item of [...trending.items, ...movies.items, ...shows.items]) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        try {
          await upsertTitle(item);
          processed += 1;
        } catch {
          errors += 1;
        }
      }
      message = `${processed} TMDB titles upserted.`;
    } else if (jobType === "anilist") {
      const page = await anilist.popular(1, "en");
      for (const item of page.items) {
        try {
          await upsertTitle(item);
          processed += 1;
        } catch {
          errors += 1;
        }
      }
      message = `${processed} AniList titles upserted.`;
    } else if (jobType === "iptv") {
      const remote = await loadApiChannels();
      for (const channel of remote) {
        try {
          const [row] = await db
            .insert(channels)
            .values({
              id: channel.id,
              iptvOrgId: channel.id,
              name: channel.name,
              altNames: channel.altNames,
              country: channel.country,
              languagesJson: channel.languages,
              categoriesJson: channel.categories,
              logoUrl: channel.logo,
              website: channel.website,
              isNsfw: channel.isNsfw,
              enabled: true,
              syncedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: channels.id,
              set: {
                name: channel.name,
                logoUrl: channel.logo,
                isNsfw: channel.isNsfw,
                syncedAt: new Date(),
              },
            })
            .returning({ id: channels.id });

          if (row) {
            await db
              .delete(channelSources)
              .where(eq(channelSources.channelId, row.id));
            for (const [index, source] of channel.sources.entries()) {
              await db.insert(channelSources).values({
                id: crypto.randomUUID(),
                channelId: row.id,
                url: source.url,
                quality: source.quality,
                priority: index,
              });
            }
          }
          processed += 1;
        } catch {
          errors += 1;
        }
      }
      message = `${processed} channels synced from IPTV-org.`;
    } else {
      message =
        "No EPG source is configured. Register an XMLTV source before running this job.";
      throw new Error(message);
    }

    await db
      .update(syncJobs)
      .set({
        status: "success",
        finishedAt: new Date(),
        itemsProcessed: processed,
        errorCount: errors,
      })
      .where(eq(syncJobs.id, jobId));
    await db.insert(syncLogs).values({
      id: crypto.randomUUID(),
      jobId,
      level: errors ? "warn" : "info",
      message,
      contextJson: { processed, errors },
    });
    await recordAudit(userId, `sync.${jobType}`, { jobId, processed, errors });
    return {
      jobId,
      jobType,
      status: "success",
      itemsProcessed: processed,
      errors,
      message,
    };
  } catch (error) {
    const failure = (error as Error).message.slice(0, 300);
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        itemsProcessed: processed,
        errorCount: errors + 1,
      })
      .where(eq(syncJobs.id, jobId))
      .catch(() => undefined);
    await db
      .insert(syncLogs)
      .values({
        id: crypto.randomUUID(),
        jobId,
        level: "error",
        message: failure,
      })
      .catch(() => undefined);
    await recordAudit(userId, `sync.${jobType}.failed`, { jobId, message: failure });
    return {
      jobId,
      jobType,
      status: "failed",
      itemsProcessed: processed,
      errors: errors + 1,
      message: failure,
    };
  }
}
