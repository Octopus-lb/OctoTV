import { and, desc, eq, like, or } from "drizzle-orm";
import { tryGetDb } from "@/db";
import {
  castMembers,
  episodes as episodesTable,
  genres as genresTable,
  seasons as seasonsTable,
  titleCast,
  titleGenres,
  titles as titlesTable,
  type Title,
} from "@/db/schema";
import type {
  CatalogCastMember,
  CatalogDetail,
  CatalogEpisode,
  CatalogPage,
  CatalogQuery,
  CatalogSeason,
  CatalogTitle,
  TitleType,
} from "./types";

const TYPE_LABEL: Record<string, TitleType> = {
  movie: "movie",
  tv: "tv",
  anime: "anime",
};

export function rowToTitle(row: Title, genres: string[] = []): CatalogTitle {
  return {
    id: row.id,
    type: TYPE_LABEL[row.type] ?? "movie",
    tmdbId: row.tmdbId,
    anilistId: row.anilistId,
    imdbId: row.imdbId,
    title: row.originalTitle,
    originalTitle: row.originalTitle,
    overview: row.overview ?? "",
    tagline: row.tagline,
    posterPath: row.posterPath,
    backdropPath: row.backdropPath,
    releaseDate: row.releaseDate,
    year: row.releaseDate ? Number(row.releaseDate.slice(0, 4)) || null : null,
    runtimeMinutes: row.runtimeMinutes,
    episodeCount: row.episodeCount,
    seasonCount: row.seasonCount,
    status: row.status,
    originalLanguage: row.originalLanguage,
    voteAverage: row.voteAverage,
    popularity: row.popularity,
    genres,
    trailerKey: row.trailerKey,
    source: row.anilistId ? "anilist" : row.tmdbId ? "tmdb" : "demo",
    isDemo: false,
  };
}

async function loadGenres(
  db: NonNullable<ReturnType<typeof tryGetDb>>,
  titleIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!titleIds.length) return map;
  const genreRows = await db
    .select({
      titleId: titleGenres.titleId,
      name: genresTable.name,
    })
    .from(titleGenres)
    .innerJoin(genresTable, eq(titleGenres.genreId, genresTable.id));

  const wanted = new Set(titleIds);
  for (const row of genreRows) {
    if (!wanted.has(row.titleId)) continue;
    const list = map.get(row.titleId) ?? [];
    list.push(row.name);
    map.set(row.titleId, list);
  }
  return map;
}

export async function listTitlesFromDb(
  query: Pick<CatalogQuery, "type" | "query" | "page" | "perPage" | "sort">,
): Promise<CatalogPage | null> {
  const db = tryGetDb();
  if (!db) return null;

  try {
    const conditions = [eq(titlesTable.enabled, true)];
    if (query.type) conditions.push(eq(titlesTable.type, query.type));
    if (query.query?.trim()) {
      const term = `%${query.query.trim()}%`;
      const match = or(
        like(titlesTable.originalTitle, term),
        like(titlesTable.overview, term),
      );
      if (match) conditions.push(match);
    }

    const order =
      query.sort === "newest"
        ? desc(titlesTable.releaseDate)
        : query.sort === "rating"
          ? desc(titlesTable.voteAverage)
          : desc(titlesTable.popularity);

    const perPage = Math.min(Math.max(query.perPage ?? 20, 1), 60);
    const page = Math.max(query.page ?? 1, 1);
    const rows = await db
      .select()
      .from(titlesTable)
      .where(and(...conditions))
      .orderBy(order)
      .limit(perPage)
      .offset((page - 1) * perPage);

    if (!rows.length) return null;

    const genreMap = await loadGenres(
      db,
      rows.map((row) => row.id),
    );
    return {
      items: rows.map((row) => rowToTitle(row, genreMap.get(row.id) ?? [])),
      page,
      totalPages: page,
      totalResults: rows.length,
      source: "mixed",
    };
  } catch {
    // Tables may not be migrated yet; callers fall back to live providers/demo.
    return null;
  }
}

export async function getTitleFromDb(id: string): Promise<CatalogDetail | null> {
  const db = tryGetDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(titlesTable)
      .where(eq(titlesTable.id, id))
      .limit(1);
    if (!row) return null;

    const genreMap = await loadGenres(db, [row.id]);

    const seasonRows = await db
      .select()
      .from(seasonsTable)
      .where(eq(seasonsTable.titleId, id))
      .orderBy(seasonsTable.seasonNumber);

    const episodeRows = await db
      .select()
      .from(episodesTable)
      .where(eq(episodesTable.titleId, id))
      .orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber);

    const castRows = await db
      .select({
        character: titleCast.character,
        department: titleCast.department,
        name: castMembers.name,
        profilePath: castMembers.profilePath,
        sourceId: castMembers.sourceId,
      })
      .from(titleCast)
      .innerJoin(castMembers, eq(titleCast.castMemberId, castMembers.id))
      .where(eq(titleCast.titleId, id))
      .orderBy(titleCast.ordering);

    const seasons: CatalogSeason[] = seasonRows.map((season) => ({
      id: season.id,
      seasonNumber: season.seasonNumber,
      title: season.title ?? `Season ${season.seasonNumber}`,
      overview: season.overview ?? "",
      episodeCount: season.episodeCount ?? 0,
      airDate: season.airDate,
      posterPath: season.posterPath,
      episodes: episodeRows
        .filter((episode) => episode.seasonId === season.id)
        .map<CatalogEpisode>((episode) => ({
          id: episode.id,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          title: episode.title ?? `Episode ${episode.episodeNumber}`,
          overview: episode.overview ?? "",
          runtimeMinutes: episode.runtimeMinutes,
          airDate: episode.airDate,
          stillPath: episode.stillPath,
        })),
    }));

    const cast: CatalogCastMember[] = castRows.map((member) => ({
      id: `db-cast-${member.sourceId}`,
      name: member.name,
      character: member.character,
      profilePath: member.profilePath,
      department: member.department,
    }));

    return {
      ...rowToTitle(row, genreMap.get(row.id) ?? []),
      cast,
      recommendations: [],
      seasons,
    };
  } catch {
    return null;
  }
}

export async function countTitles(): Promise<number> {
  const db = tryGetDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ id: titlesTable.id }).from(titlesTable);
    return rows.length;
  } catch {
    return 0;
  }
}
