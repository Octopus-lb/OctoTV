import { and, desc, eq, isNull } from "drizzle-orm";
import { tryGetDb } from "@/db";
import {
  customListItems,
  customLists,
  titles,
  watchHistory,
  watchProgress,
  watchlistItems,
  watchlists,
} from "@/db/schema";
import type { CatalogTitle } from "@/lib/catalog/types";
import { rowToTitle } from "@/lib/catalog/repository";
import { getDemoTitle } from "@/lib/catalog/demo-data";

function titleTypeFromId(id: string, hint?: string) {
  if (hint === "movie" || hint === "tv" || hint === "anime") return hint;
  if (id.startsWith("tmdb-movie-")) return "movie" as const;
  if (id.startsWith("tmdb-tv-")) return "tv" as const;
  return "anime" as const;
}

/** Ensures the catalog row exists so activity foreign keys remain valid. */
async function ensureTitleRow(
  db: NonNullable<ReturnType<typeof tryGetDb>>,
  titleId: string,
  typeHint?: string,
  titleName?: string,
) {
  try {
    const [existing] = await db
      .select({ id: titles.id })
      .from(titles)
      .where(eq(titles.id, titleId))
      .limit(1);
    if (existing) return;

    const demo = getDemoTitle(titleId);
    await db
      .insert(titles)
      .values({
        id: titleId,
        type: titleTypeFromId(titleId, demo?.type ?? typeHint),
        originalTitle: demo?.title ?? titleName ?? titleId,
        overview: demo?.overview ?? null,
        releaseDate: demo?.releaseDate ?? null,
        runtimeMinutes: demo?.runtimeMinutes ?? null,
        episodeCount: demo?.episodeCount ?? null,
        posterPath: demo?.posterPath ?? null,
        backdropPath: demo?.backdropPath ?? null,
        voteAverage: demo?.voteAverage ?? null,
        popularity: demo?.popularity ?? null,
        originalLanguage: demo?.originalLanguage ?? null,
        enabled: true,
      })
      .onConflictDoNothing();
  } catch {
    // Ignore: activity writes will surface the failure to the caller.
  }
}

export type ContinueWatchingEntry = {
  title: CatalogTitle;
  episodeId: string | null;
  positionSeconds: number;
  durationSeconds: number | null;
  progressPercent: number;
  updatedAt: Date;
};

export async function saveProgress(input: {
  profileId: string;
  titleId: string;
  titleName?: string;
  typeHint?: string;
  episodeId?: string | null;
  positionSeconds: number;
  durationSeconds?: number | null;
  completed?: boolean;
}): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    await ensureTitleRow(db, input.titleId, input.typeHint, input.titleName);
    const duration = input.durationSeconds ?? null;
    const completed =
      input.completed ??
      Boolean(duration && duration > 0 && input.positionSeconds / duration > 0.95);

    const episodeFilter = input.episodeId
      ? eq(watchProgress.episodeId, input.episodeId)
      : isNull(watchProgress.episodeId);

    const [existing] = await db
      .select({ id: watchProgress.id })
      .from(watchProgress)
      .where(
        and(
          eq(watchProgress.profileId, input.profileId),
          eq(watchProgress.titleId, input.titleId),
          episodeFilter,
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(watchProgress)
        .set({
          positionSeconds: input.positionSeconds,
          durationSeconds: duration,
          completed,
          updatedAt: new Date(),
        })
        .where(eq(watchProgress.id, existing.id));
    } else {
      await db.insert(watchProgress).values({
        id: crypto.randomUUID(),
        profileId: input.profileId,
        titleId: input.titleId,
        episodeId: input.episodeId ?? null,
        positionSeconds: input.positionSeconds,
        durationSeconds: duration,
        completed,
      });
    }

    await db.insert(watchHistory).values({
      id: crypto.randomUUID(),
      profileId: input.profileId,
      titleId: input.titleId,
      episodeId: input.episodeId ?? null,
    });

    return true;
  } catch {
    return false;
  }
}

export async function getContinueWatching(
  profileId: string,
  limit = 12,
): Promise<ContinueWatchingEntry[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    const rows = await db
      .select({
        progress: watchProgress,
        title: titles,
      })
      .from(watchProgress)
      .innerJoin(titles, eq(watchProgress.titleId, titles.id))
      .where(eq(watchProgress.profileId, profileId))
      .orderBy(desc(watchProgress.updatedAt))
      .limit(limit);

    return rows.map((row) => ({
      title: rowToTitle(row.title),
      episodeId: row.progress.episodeId,
      positionSeconds: row.progress.positionSeconds,
      durationSeconds: row.progress.durationSeconds,
      progressPercent:
        row.progress.durationSeconds && row.progress.durationSeconds > 0
          ? Math.min(
              100,
              Math.round(
                (row.progress.positionSeconds / row.progress.durationSeconds) * 100,
              ),
            )
          : 0,
      updatedAt: row.progress.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function getPlaybackProgress(
  profileId: string,
  titleId: string,
  episodeId?: string | null,
): Promise<number> {
  const db = tryGetDb();
  if (!db) return 0;
  try {
    const [row] = await db
      .select({ position: watchProgress.positionSeconds })
      .from(watchProgress)
      .where(
        and(
          eq(watchProgress.profileId, profileId),
          eq(watchProgress.titleId, titleId),
          episodeId ? eq(watchProgress.episodeId, episodeId) : isNull(watchProgress.episodeId),
        ),
      )
      .limit(1);
    return row?.position ?? 0;
  } catch {
    return 0;
  }
}

export async function getHistory(profileId: string, limit = 50) {
  const db = tryGetDb();
  if (!db) return [] as Array<{ title: CatalogTitle; watchedAt: Date; episodeId: string | null }>;
  try {
    const rows = await db
      .select({ history: watchHistory, title: titles })
      .from(watchHistory)
      .innerJoin(titles, eq(watchHistory.titleId, titles.id))
      .where(eq(watchHistory.profileId, profileId))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limit);

    const seen = new Set<string>();
    return rows
      .filter((row) => {
        if (seen.has(row.title.id)) return false;
        seen.add(row.title.id);
        return true;
      })
      .map((row) => ({
        title: rowToTitle(row.title),
        watchedAt: row.history.watchedAt,
        episodeId: row.history.episodeId,
      }));
  } catch {
    return [];
  }
}

export async function clearHistory(profileId: string): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    await db.delete(watchHistory).where(eq(watchHistory.profileId, profileId));
    await db.delete(watchProgress).where(eq(watchProgress.profileId, profileId));
    return true;
  } catch {
    return false;
  }
}

async function getOrCreateWatchlist(
  db: NonNullable<ReturnType<typeof tryGetDb>>,
  profileId: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: watchlists.id })
    .from(watchlists)
    .where(eq(watchlists.profileId, profileId))
    .limit(1);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await db.insert(watchlists).values({ id, profileId });
  return id;
}

export async function getWatchlist(profileId: string): Promise<CatalogTitle[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    const watchlistId = await getOrCreateWatchlist(db, profileId);
    const rows = await db
      .select({ title: titles })
      .from(watchlistItems)
      .innerJoin(titles, eq(watchlistItems.titleId, titles.id))
      .where(eq(watchlistItems.watchlistId, watchlistId))
      .orderBy(desc(watchlistItems.createdAt));
    return rows.map((row) => rowToTitle(row.title));
  } catch {
    return [];
  }
}

export async function addToWatchlist(
  profileId: string,
  titleId: string,
  titleName?: string,
): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    await ensureTitleRow(db, titleId, undefined, titleName);
    const watchlistId = await getOrCreateWatchlist(db, profileId);
    await db
      .insert(watchlistItems)
      .values({ watchlistId, titleId })
      .onConflictDoNothing();
    return true;
  } catch {
    return false;
  }
}

export async function removeFromWatchlist(
  profileId: string,
  titleId: string,
): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    const watchlistId = await getOrCreateWatchlist(db, profileId);
    await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, watchlistId),
          eq(watchlistItems.titleId, titleId),
        ),
      );
    return true;
  } catch {
    return false;
  }
}

export async function isInWatchlist(
  profileId: string,
  titleId: string,
): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    const watchlistId = await getOrCreateWatchlist(db, profileId);
    const [row] = await db
      .select({ titleId: watchlistItems.titleId })
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, watchlistId),
          eq(watchlistItems.titleId, titleId),
        ),
      )
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function getCustomLists(profileId: string) {
  const db = tryGetDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(customLists)
      .where(eq(customLists.profileId, profileId))
      .orderBy(desc(customLists.updatedAt));
  } catch {
    return [];
  }
}

export async function createCustomList(
  profileId: string,
  name: string,
  description?: string,
): Promise<string | null> {
  const db = tryGetDb();
  if (!db) return null;
  try {
    const id = crypto.randomUUID();
    await db.insert(customLists).values({
      id,
      profileId,
      name: name.slice(0, 80),
      description: description?.slice(0, 400) ?? null,
    });
    return id;
  } catch {
    return null;
  }
}

export async function addToCustomList(
  listId: string,
  titleId: string,
  titleName?: string,
): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    await ensureTitleRow(db, titleId, undefined, titleName);
    await db
      .insert(customListItems)
      .values({ listId, titleId, position: 0 })
      .onConflictDoNothing();
    return true;
  } catch {
    return false;
  }
}

export async function removeFromCustomList(
  listId: string,
  titleId: string,
): Promise<boolean> {
  const db = tryGetDb();
  if (!db) return false;
  try {
    await db
      .delete(customListItems)
      .where(
        and(
          eq(customListItems.listId, listId),
          eq(customListItems.titleId, titleId),
        ),
      );
    return true;
  } catch {
    return false;
  }
}

export async function getCustomListItems(
  profileId: string,
  listId: string,
): Promise<CatalogTitle[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    const [list] = await db
      .select({ id: customLists.id })
      .from(customLists)
      .where(and(eq(customLists.id, listId), eq(customLists.profileId, profileId)))
      .limit(1);
    if (!list) return [];
    const rows = await db
      .select({ title: titles })
      .from(customListItems)
      .innerJoin(titles, eq(customListItems.titleId, titles.id))
      .where(eq(customListItems.listId, listId))
      .orderBy(customListItems.position);
    return rows.map((row) => rowToTitle(row.title));
  } catch {
    return [];
  }
}
