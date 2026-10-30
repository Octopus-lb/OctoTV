import { env as cloudflareEnv } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { tryGetDb } from "@/db";
import { downloadAssets, playbackAssets } from "@/db/schema";
import type {
  DownloadAccess,
  PlaybackOption,
  PlaybackProvider,
  PlaybackSession,
  ProviderHealth,
} from "../types";
import { signToken, verifyToken } from "../token";
import { isPlaybackAssetAuthorized } from "../authorization";
import { healthSnapshot, loadDbOptions, type BuildManifest } from "./provider-utils";

function signingSecret(): string | null {
  return cloudflareEnv.BETTER_AUTH_SECRET ?? null;
}

export type DbProviderConfig = {
  id: string;
  displayName: string;
  /** Provider credentials are configured and the owner authorized the integration. */
  ready: () => boolean;
  buildManifest: BuildManifest;
};

export function createDbBackedProvider(config: DbProviderConfig): PlaybackProvider {
  return {
    id: config.id,
    displayName: config.displayName,

    async getPlaybackOptions(contentId: string): Promise<PlaybackOption[]> {
      if (!config.ready()) return [];
      return loadDbOptions({
        contentId,
        providerId: config.id,
        buildManifest: config.buildManifest,
      });
    },

    async createPlaybackSession(assetId: string, userId: string): Promise<PlaybackSession> {
      const db = tryGetDb();
      if (!db) throw new Error("Playback authorization is unavailable.");
      const [asset] = await db
        .select({
          id: playbackAssets.id,
          providerKey: playbackAssets.providerKey,
          status: playbackAssets.status,
          licenseStartsAt: playbackAssets.licenseStartsAt,
          licenseEndsAt: playbackAssets.licenseEndsAt,
        })
        .from(playbackAssets)
        .where(
          and(
            eq(playbackAssets.id, assetId),
            eq(playbackAssets.providerKey, config.id),
            eq(playbackAssets.status, "active"),
          ),
        )
        .limit(1);
      if (!asset || !isPlaybackAssetAuthorized(asset, config.id)) {
        throw new Error("Playback asset is not currently authorized.");
      }

      const secret = signingSecret();
      if (!secret) throw new Error("Playback signing is not configured.");
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresAtSeconds = Math.min(
        nowSeconds + 4 * 60 * 60,
        asset.licenseEndsAt ? Math.floor(asset.licenseEndsAt.getTime() / 1000) : Number.MAX_SAFE_INTEGER,
      );
      if (expiresAtSeconds <= nowSeconds) {
        throw new Error("Playback license expires too soon.");
      }
      const token = await signToken(
        { sub: assetId, scope: `playback:${config.id}`, userId, exp: expiresAtSeconds },
        secret,
      );
      return {
        id: crypto.randomUUID(),
        assetId,
        providerId: config.id,
        token,
        expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
      };
    },

    async validatePlaybackAccess(sessionId: string): Promise<boolean> {
      const secret = signingSecret();
      if (!secret) return false;
      const result = await verifyToken(sessionId, secret);
      if (
        !result.valid ||
        result.payload.scope !== `playback:${config.id}` ||
        typeof result.payload.sub !== "string"
      ) return false;

      const db = tryGetDb();
      if (!db) return false;
      try {
        const [asset] = await db
          .select({
            providerKey: playbackAssets.providerKey,
            status: playbackAssets.status,
            licenseStartsAt: playbackAssets.licenseStartsAt,
            licenseEndsAt: playbackAssets.licenseEndsAt,
          })
          .from(playbackAssets)
          .where(
            and(
              eq(playbackAssets.id, result.payload.sub),
              eq(playbackAssets.providerKey, config.id),
              eq(playbackAssets.status, "active"),
            ),
          )
          .limit(1);
        return Boolean(asset && isPlaybackAssetAuthorized(asset, config.id));
      } catch {
        return false;
      }
    },

    async getDownloadAccess(assetId: string, userId: string): Promise<DownloadAccess> {
      const db = tryGetDb();
      const secret = signingSecret();
      if (!db || !secret) {
        return { allowed: false, reason: "download_not_configured" };
      }
      try {
        const [asset] = await db
          .select()
          .from(downloadAssets)
          .where(
            and(
              eq(downloadAssets.playbackAssetId, assetId),
              eq(downloadAssets.downloadAllowed, true),
              eq(downloadAssets.rightsVerified, true),
            ),
          )
          .limit(1);
        if (!asset) return { allowed: false, reason: "no_licensed_download" };

        const expiresIn = 5 * 60;
        const token = await signToken(
          {
            sub: asset.id,
            scope: "download",
            userId,
            providerId: config.id,
            ttlSeconds: expiresIn,
          },
          secret,
        );
        return {
          allowed: true,
          url: `/api/download/${token}`,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          format: asset.format,
          quality: asset.quality,
        };
      } catch {
        return { allowed: false, reason: "download_lookup_failed" };
      }
    },

    async getProviderHealth(): Promise<ProviderHealth> {
      return healthSnapshot(
        config.id,
        config.ready() ? "healthy" : "unknown",
        config.ready() ? undefined : "credentials_not_configured",
      );
    },
  };
}
