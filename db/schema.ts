import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const now = () => new Date();
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now)
    .$onUpdateFn(now);

/* -------------------------------------------------------------------------- */
/* Authentication (Better Auth core schema, plural table names)               */
/* -------------------------------------------------------------------------- */

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    preferredLocale: text("preferred_locale").notNull().default("ar"),
    role: text("role").notNull().default("user"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now)
      .$onUpdateFn(now),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now)
      .$onUpdateFn(now),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_idx").on(table.userId),
  ],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now)
      .$onUpdateFn(now),
  },
  (table) => [index("accounts_user_idx").on(table.userId)],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(now),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

/** Better Auth's D1-persisted request counters. */
export const rateLimits = sqliteTable("rate_limits", {
  // Better Auth's schema checker expects an id column, but its rate-limit
  // adapter doesn't write one; keep it nullable for compatibility.
  id: text("id"),
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  lastRequest: integer("last_request", { mode: "number" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/* Profiles and devices                                                       */
/* -------------------------------------------------------------------------- */

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    avatar: text("avatar"),
    pinHash: text("pin_hash"),
    preferredLocale: text("preferred_locale"),
    maturityLevel: text("maturity_level").notNull().default("all"),
    isKids: integer("is_kids", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("profiles_user_idx").on(table.userId)],
);

export const profilePreferences = sqliteTable(
  "profile_preferences",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    subtitleLanguage: text("subtitle_language"),
    audioLanguage: text("audio_language"),
    autoplayNext: integer("autoplay_next", { mode: "boolean" })
      .notNull()
      .default(true),
    autoplayPreviews: integer("autoplay_previews", { mode: "boolean" })
      .notNull()
      .default(false),
    subtitleSize: text("subtitle_size").notNull().default("medium"),
    reducedMotion: integer("reduced_motion", { mode: "boolean" })
      .notNull()
      .default(false),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("profile_preferences_profile_unique").on(table.profileId)],
);

export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    name: text("name"),
    userAgent: text("user_agent"),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    createdAt: createdAt(),
  },
  (table) => [index("devices_user_idx").on(table.userId)],
);

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export const titles = sqliteTable(
  "titles",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["movie", "tv", "anime"] }).notNull(),
    tmdbId: integer("tmdb_id"),
    anilistId: integer("anilist_id"),
    imdbId: text("imdb_id"),
    originalTitle: text("original_title").notNull(),
    originalLanguage: text("original_language"),
    releaseDate: text("release_date"),
    status: text("status"),
    runtimeMinutes: integer("runtime_minutes"),
    episodeCount: integer("episode_count"),
    seasonCount: integer("season_count"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    trailerKey: text("trailer_key"),
    overview: text("overview"),
    tagline: text("tagline"),
    voteAverage: real("vote_average"),
    popularity: real("popularity"),
    isAdult: integer("is_adult", { mode: "boolean" }).notNull().default(false),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    metadataJson: text("metadata_json", { mode: "json" }),
    sourceUpdatedAt: integer("source_updated_at", { mode: "timestamp_ms" }),
    syncedAt: integer("synced_at", { mode: "timestamp_ms" }).$defaultFn(now),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("titles_tmdb_unique").on(table.tmdbId),
    uniqueIndex("titles_anilist_unique").on(table.anilistId),
    index("titles_type_idx").on(table.type),
    index("titles_popularity_idx").on(table.popularity),
    index("titles_release_idx").on(table.releaseDate),
  ],
);

export const titleTranslations = sqliteTable(
  "title_translations",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    overview: text("overview"),
    tagline: text("tagline"),
  },
  (table) => [
    uniqueIndex("title_translations_unique").on(table.titleId, table.locale),
  ],
);

export const externalIds = sqliteTable(
  "external_ids",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    source: text("source", { enum: ["tmdb", "anilist", "imdb", "tvdb"] }).notNull(),
    externalId: text("external_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("external_ids_unique").on(table.source, table.externalId),
    index("external_ids_title_idx").on(table.titleId),
  ],
);

export const genres = sqliteTable(
  "genres",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull().default("tmdb"),
    sourceId: integer("source_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [uniqueIndex("genres_slug_source_unique").on(table.slug, table.source)],
);

export const titleGenres = sqliteTable(
  "title_genres",
  {
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.titleId, table.genreId] })],
);

export const seasons = sqliteTable(
  "seasons",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number").notNull(),
    title: text("title"),
    overview: text("overview"),
    episodeCount: integer("episode_count"),
    airDate: text("air_date"),
    posterPath: text("poster_path"),
  },
  (table) => [uniqueIndex("seasons_unique").on(table.titleId, table.seasonNumber)],
);

export const episodes = sqliteTable(
  "episodes",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    seasonNumber: integer("season_number").notNull(),
    episodeNumber: integer("episode_number").notNull(),
    title: text("title"),
    overview: text("overview"),
    runtimeMinutes: integer("runtime_minutes"),
    airDate: text("air_date"),
    stillPath: text("still_path"),
  },
  (table) => [
    uniqueIndex("episodes_unique").on(
      table.titleId,
      table.seasonNumber,
      table.episodeNumber,
    ),
  ],
);

export const castMembers = sqliteTable(
  "cast_members",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull().default("tmdb"),
    sourceId: integer("source_id").notNull(),
    name: text("name").notNull(),
    profilePath: text("profile_path"),
  },
  (table) => [
    uniqueIndex("cast_members_source_unique").on(table.source, table.sourceId),
  ],
);

export const titleCast = sqliteTable(
  "title_cast",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    castMemberId: text("cast_member_id")
      .notNull()
      .references(() => castMembers.id, { onDelete: "cascade" }),
    character: text("character"),
    department: text("department").notNull().default("cast"),
    ordering: integer("ordering").notNull().default(0),
  },
  (table) => [index("title_cast_title_idx").on(table.titleId)],
);

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    recommendedTitleId: text("recommended_title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    score: real("score"),
    source: text("source").notNull().default("tmdb"),
  },
  (table) => [
    uniqueIndex("recommendations_unique").on(
      table.titleId,
      table.recommendedTitleId,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Playback                                                                   */
/* -------------------------------------------------------------------------- */

export const playbackProviders = sqliteTable(
  "playback_providers",
  {
    id: text("id").primaryKey(),
    providerKey: text("provider_key").notNull(),
    displayName: text("display_name").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    configJson: text("config_json", { mode: "json" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("playback_providers_key_unique").on(table.providerKey)],
);

export const playbackAssets = sqliteTable(
  "playback_assets",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    episodeId: text("episode_id").references(() => episodes.id, {
      onDelete: "cascade",
    }),
    providerKey: text("provider_key").notNull(),
    externalAssetId: text("external_asset_id").notNull(),
    status: text("status", { enum: ["active", "pending", "disabled"] })
      .notNull()
      .default("pending"),
    licenseStartsAt: integer("license_starts_at", { mode: "timestamp_ms" }),
    licenseEndsAt: integer("license_ends_at", { mode: "timestamp_ms" }),
    downloadAllowed: integer("download_allowed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("playback_assets_title_idx").on(table.titleId),
    index("playback_assets_episode_idx").on(table.episodeId),
  ],
);

export const playbackServers = sqliteTable(
  "playback_servers",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    serverKey: text("server_key").notNull(),
    displayName: text("display_name").notNull(),
    providerKey: text("provider_key").notNull(),
    region: text("region"),
    priority: integer("priority").notNull().default(100),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    formatsJson: text("formats_json", { mode: "json" }),
    qualitiesJson: text("qualities_json", { mode: "json" }),
    manifestUrl: text("manifest_url"),
    manifestType: text("manifest_type", { enum: ["hls", "dash", "mp4"] }),
    lastHealthCheck: integer("last_health_check", { mode: "timestamp_ms" }),
    healthStatus: text("health_status", {
      enum: ["unknown", "healthy", "degraded", "down"],
    })
      .notNull()
      .default("unknown"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("playback_servers_unique").on(table.assetId, table.serverKey),
    index("playback_servers_asset_idx").on(table.assetId),
  ],
);

export const playbackSessions = sqliteTable(
  "playback_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    assetId: text("asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    providerKey: text("provider_key").notNull(),
    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("playback_sessions_token_unique").on(table.token),
    index("playback_sessions_user_idx").on(table.userId),
  ],
);

export const playbackVariants = sqliteTable(
  "playback_variants",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    serverId: text("server_id").references(() => playbackServers.id, {
      onDelete: "cascade",
    }),
    quality: text("quality").notNull(),
    width: integer("width"),
    height: integer("height"),
    bitrate: integer("bitrate"),
    codec: text("codec"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [index("playback_variants_asset_idx").on(table.assetId)],
);

export const subtitleTracks = sqliteTable(
  "subtitle_tracks",
  {
    id: text("id").primaryKey(),
    playbackAssetId: text("playback_asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    label: text("label").notNull(),
    format: text("format", { enum: ["vtt", "srt", "embedded"] })
      .notNull()
      .default("vtt"),
    fileUrl: text("file_url"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    isForced: integer("is_forced", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [index("subtitle_tracks_asset_idx").on(table.playbackAssetId)],
);

export const audioTracks = sqliteTable(
  "audio_tracks",
  {
    id: text("id").primaryKey(),
    playbackAssetId: text("playback_asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    label: text("label").notNull(),
    codec: text("codec"),
    channels: text("channels"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [index("audio_tracks_asset_idx").on(table.playbackAssetId)],
);

export const downloadAssets = sqliteTable(
  "download_assets",
  {
    id: text("id").primaryKey(),
    playbackAssetId: text("playback_asset_id")
      .notNull()
      .references(() => playbackAssets.id, { onDelete: "cascade" }),
    providerKey: text("provider_key").notNull(),
    externalFileId: text("external_file_id"),
    fileUrl: text("file_url"),
    format: text("format").notNull().default("mp4"),
    quality: text("quality"),
    sizeBytes: integer("size_bytes"),
    rightsVerified: integer("rights_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    downloadAllowed: integer("download_allowed", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
  },
  (table) => [index("download_assets_asset_idx").on(table.playbackAssetId)],
);

export const downloadEvents = sqliteTable(
  "download_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    downloadAssetId: text("download_asset_id")
      .notNull()
      .references(() => downloadAssets.id, { onDelete: "cascade" }),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
  },
  (table) => [index("download_events_user_idx").on(table.userId)],
);

export const playbackHealthEvents = sqliteTable(
  "playback_health_events",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id").references(() => playbackServers.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull(),
    latencyMs: integer("latency_ms"),
    message: text("message"),
    createdAt: createdAt(),
  },
  (table) => [index("playback_health_server_idx").on(table.serverId)],
);

/* -------------------------------------------------------------------------- */
/* User activity                                                              */
/* -------------------------------------------------------------------------- */

export const watchProgress = sqliteTable(
  "watch_progress",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    episodeId: text("episode_id").references(() => episodes.id, {
      onDelete: "cascade",
    }),
    positionSeconds: real("position_seconds").notNull().default(0),
    durationSeconds: real("duration_seconds"),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("watch_progress_unique").on(
      table.profileId,
      table.titleId,
      table.episodeId,
    ),
    index("watch_progress_profile_idx").on(table.profileId),
  ],
);

export const watchHistory = sqliteTable(
  "watch_history",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    episodeId: text("episode_id").references(() => episodes.id, {
      onDelete: "cascade",
    }),
    watchedAt: integer("watched_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => [index("watch_history_profile_idx").on(table.profileId)],
);

export const watchlists = sqliteTable(
  "watchlists",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Watchlist"),
    createdAt: createdAt(),
  },
  (table) => [index("watchlists_profile_idx").on(table.profileId)],
);

export const watchlistItems = sqliteTable(
  "watchlist_items",
  {
    watchlistId: text("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.watchlistId, table.titleId] })],
);

export const customLists = sqliteTable(
  "custom_lists",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("custom_lists_profile_idx").on(table.profileId)],
);

export const customListItems = sqliteTable(
  "custom_list_items",
  {
    listId: text("list_id")
      .notNull()
      .references(() => customLists.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.listId, table.titleId] })],
);

/* -------------------------------------------------------------------------- */
/* Live TV                                                                    */
/* -------------------------------------------------------------------------- */

export const channels = sqliteTable(
  "channels",
  {
    id: text("id").primaryKey(),
    iptvOrgId: text("iptv_org_id").notNull(),
    name: text("name").notNull(),
    altNames: text("alt_names", { mode: "json" }),
    country: text("country"),
    languagesJson: text("languages_json", { mode: "json" }),
    categoriesJson: text("categories_json", { mode: "json" }),
    logoUrl: text("logo_url"),
    website: text("website"),
    isNsfw: integer("is_nsfw", { mode: "boolean" }).notNull().default(false),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    syncedAt: integer("synced_at", { mode: "timestamp_ms" }).$defaultFn(now),
  },
  (table) => [
    uniqueIndex("channels_iptv_unique").on(table.iptvOrgId),
    index("channels_country_idx").on(table.country),
    index("channels_enabled_idx").on(table.enabled),
  ],
);

export const channelSources = sqliteTable(
  "channel_sources",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    quality: text("quality"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    labelsJson: text("labels_json", { mode: "json" }),
    rightsStatus: text("rights_status", {
      enum: ["unknown", "verified", "restricted"],
    })
      .notNull()
      .default("unknown"),
    priority: integer("priority").notNull().default(100),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    healthStatus: text("health_status", {
      enum: ["unknown", "healthy", "degraded", "down"],
    })
      .notNull()
      .default("unknown"),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("channel_sources_channel_idx").on(table.channelId)],
);

export const channelCategories = sqliteTable("channel_categories", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
});

export const channelLanguages = sqliteTable("channel_languages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
});

export const channelBlocklist = sqliteTable(
  "channel_blocklist",
  {
    id: text("id").primaryKey(),
    iptvOrgId: text("iptv_org_id"),
    reason: text("reason").notNull(),
    createdBy: text("created_by"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("channel_blocklist_iptv_unique").on(table.iptvOrgId)],
);

export const epgPrograms = sqliteTable(
  "epg_programs",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    locale: text("locale"),
  },
  (table) => [index("epg_programs_channel_time_idx").on(table.channelId, table.startsAt)],
);

export const channelHealth = sqliteTable(
  "channel_health",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id").references(() => channels.id, {
      onDelete: "cascade",
    }),
    sourceId: text("source_id").references(() => channelSources.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull(),
    latencyMs: integer("latency_ms"),
    message: text("message"),
    createdAt: createdAt(),
  },
  (table) => [index("channel_health_channel_idx").on(table.channelId)],
);

/* -------------------------------------------------------------------------- */
/* Administration                                                             */
/* -------------------------------------------------------------------------- */

export const syncJobs = sqliteTable(
  "sync_jobs",
  {
    id: text("id").primaryKey(),
    jobType: text("job_type").notNull(),
    status: text("status", {
      enum: ["queued", "running", "success", "failed"],
    })
      .notNull()
      .default("queued"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    itemsProcessed: integer("items_processed").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    triggeredBy: text("triggered_by"),
    createdAt: createdAt(),
  },
  (table) => [index("sync_jobs_type_idx").on(table.jobType)],
);

export const syncLogs = sqliteTable(
  "sync_logs",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id").references(() => syncJobs.id, {
      onDelete: "cascade",
    }),
    level: text("level", { enum: ["info", "warn", "error"] })
      .notNull()
      .default("info"),
    message: text("message").notNull(),
    contextJson: text("context_json", { mode: "json" }),
    createdAt: createdAt(),
  },
  (table) => [index("sync_logs_job_idx").on(table.jobId)],
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "editor", "viewer"] })
      .notNull()
      .default("viewer"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("admin_users_user_unique").on(table.userId)],
);

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    adminUserId: text("admin_user_id"),
    userId: text("user_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadataJson: text("metadata_json", { mode: "json" }),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
  },
  (table) => [index("admin_audit_logs_action_idx").on(table.action)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
  sessions: many(sessions),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  progress: many(watchProgress),
  watchlists: many(watchlists),
}));

export const titlesRelations = relations(titles, ({ many }) => ({
  seasons: many(seasons),
  episodes: many(episodes),
  assets: many(playbackAssets),
  genres: many(titleGenres),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  title: one(titles, { fields: [seasons.titleId], references: [titles.id] }),
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
  season: one(seasons, { fields: [episodes.seasonId], references: [seasons.id] }),
  title: one(titles, { fields: [episodes.titleId], references: [titles.id] }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Title = typeof titles.$inferSelect;
export type PlaybackAsset = typeof playbackAssets.$inferSelect;
export type PlaybackServerRow = typeof playbackServers.$inferSelect;
export type Channel = typeof channels.$inferSelect;
