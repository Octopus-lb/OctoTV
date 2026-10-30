import { and, eq, or } from "drizzle-orm";
import { tryGetDb } from "@/db";
import {
  audioTracks as audioTracksTable,
  playbackAssets,
  playbackServers,
  subtitleTracks as subtitleTracksTable,
} from "@/db/schema";
import type {
  AudioTrack,
  HealthStatus,
  ManifestType,
  PlaybackOption,
  PlaybackServer,
  QualityLevel,
  SubtitleTrack,
} from "../types";

type JsonList = string[] | null;

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function availabilityFromHealth(status: string): PlaybackServer["availability"] {
  if (status === "healthy") return "available";
  if (status === "down") return "unavailable";
  return "degraded";
}

export type BuildManifest = (input: {
  externalAssetId: string;
  storedManifestUrl: string | null;
}) => { url: string; type: ManifestType } | null;

/**
 * Loads administrator-registered assets for one provider from the database.
 * Playback endpoints are never discovered automatically; only rows an admin
 * created (with a verified rights status) are returned.
 */
export async function loadDbOptions(input: {
  contentId: string;
  providerId: string;
  buildManifest: BuildManifest;
}): Promise<PlaybackOption[]> {
  const db = tryGetDb();
  if (!db) return [];

  try {
    const assets = await db
      .select()
      .from(playbackAssets)
      .where(
        and(
          eq(playbackAssets.providerKey, input.providerId),
          eq(playbackAssets.status, "active"),
          or(
            eq(playbackAssets.titleId, input.contentId),
            eq(playbackAssets.episodeId, input.contentId),
          ),
        ),
      );

    if (!assets.length) return [];

    const now = Date.now();
    const options: PlaybackOption[] = [];

    for (const asset of assets) {
      if (asset.licenseStartsAt && asset.licenseStartsAt.getTime() > now) continue;
      if (asset.licenseEndsAt && asset.licenseEndsAt.getTime() < now) continue;

      const servers = await db
        .select()
        .from(playbackServers)
        .where(
          and(
            eq(playbackServers.assetId, asset.id),
            eq(playbackServers.enabled, true),
          ),
        );

      const subtitles = await db
        .select()
        .from(subtitleTracksTable)
        .where(eq(subtitleTracksTable.playbackAssetId, asset.id));

      const audio = await db
        .select()
        .from(audioTracksTable)
        .where(eq(audioTracksTable.playbackAssetId, asset.id));

      const subtitleTracks: SubtitleTrack[] = subtitles.map((track) => ({
        id: track.id,
        playbackAssetId: track.playbackAssetId,
        language: track.language,
        label: track.label,
        format: track.format,
        fileUrl: track.fileUrl,
        isDefault: track.isDefault,
        isForced: track.isForced,
      }));

      const audioTracks: AudioTrack[] = audio.map((track) => ({
        id: track.id,
        playbackAssetId: track.playbackAssetId,
        language: track.language,
        label: track.label,
        codec: track.codec,
        channels: track.channels,
        isDefault: track.isDefault,
      }));

      for (const server of servers) {
        const built = input.buildManifest({
          externalAssetId: asset.externalAssetId,
          storedManifestUrl: server.manifestUrl,
        });
        if (!built) continue;

        const formats = parseList(server.formatsJson) as ManifestType[];
        const qualities = parseList(server.qualitiesJson) as QualityLevel[];

        options.push({
          assetId: asset.id,
          contentId: input.contentId,
          episodeId: asset.episodeId,
          providerId: input.providerId,
          server: {
            id: server.id,
            displayName: server.displayName,
            providerId: input.providerId,
            region: server.region,
            priority: server.priority,
            availability: availabilityFromHealth(server.healthStatus),
            supportedFormats: formats.length ? formats : [built.type],
            supportedQualities: qualities,
            lastHealthCheck: server.lastHealthCheck?.toISOString() ?? null,
            error: server.errorMessage,
          },
          manifestUrl: built.url,
          manifestType: built.type,
          qualities,
          audioTracks,
          subtitleTracks,
          expiresAt: asset.licenseEndsAt?.toISOString() ?? null,
          downloadAvailable: asset.downloadAllowed,
        });
      }
    }

    return options;
  } catch {
    return [];
  }
}

export function healthSnapshot(
  providerId: string,
  status: HealthStatus,
  message?: string,
) {
  return {
    providerId,
    status,
    checkedAt: new Date().toISOString(),
    message,
  };
}

export type { JsonList };
