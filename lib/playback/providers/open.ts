import { env as cloudflareEnv } from "cloudflare:workers";
import { getOpenStream } from "@/lib/catalog/open-catalog";
import type {
  DownloadAccess,
  PlaybackOption,
  PlaybackProvider,
  PlaybackSession,
  ProviderHealth,
} from "../types";
import { signToken, verifyToken } from "../token";

/**
 * OpenMediaProvider streams public-domain and Creative Commons films from the
 * publisher's own free host (Internet Archive). It performs no scraping, no
 * proxy, and no re-hosting: the player receives the publisher's HTTPS URL
 * directly, and attribution is rendered from the catalog record.
 *
 * Adding content here is a licensing decision, not a technical one. See
 * docs/content-sources.md before extending the catalog.
 */
export class OpenMediaProvider implements PlaybackProvider {
  readonly id = "open";
  readonly displayName = "Open media (public domain & CC)";

  async getPlaybackOptions(contentId: string): Promise<PlaybackOption[]> {
    const stream = getOpenStream(contentId);
    if (!stream) return [];

    const assetId = `open-asset-${contentId}`;
    return [
      {
        assetId,
        contentId,
        episodeId: null,
        providerId: this.id,
        server: {
          id: "open-archive",
          displayName: "Internet Archive",
          providerId: this.id,
          region: "global",
          priority: 10,
          availability: "available",
          supportedFormats: ["mp4"],
          supportedQualities: ["1080p", "720p", "480p"],
          lastHealthCheck: new Date().toISOString(),
          error: null,
        },
        manifestUrl: stream.url,
        manifestType: stream.type,
        qualities: ["1080p", "720p", "480p"],
        audioTracks: [
          {
            id: `${assetId}-audio`,
            playbackAssetId: assetId,
            language: "en",
            label: "Original",
            codec: null,
            channels: null,
            isDefault: true,
          },
        ],
        subtitleTracks: [],
        expiresAt: null,
        downloadAvailable: stream.license.downloadable,
      },
    ];
  }

  async createPlaybackSession(
    assetId: string,
    userId: string,
  ): Promise<PlaybackSession> {
    if (!assetId.startsWith("open-asset-open-")) {
      throw new Error("Unknown open media asset.");
    }
    const secret = cloudflareEnv.BETTER_AUTH_SECRET;
    if (!secret) throw new Error("Playback signing is not configured.");
    const token = await signToken(
      { sub: assetId, scope: "playback:open", userId, ttlSeconds: 4 * 60 * 60 },
      secret,
    );
    return {
      id: crypto.randomUUID(),
      assetId,
      providerId: this.id,
      token,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    };
  }

  async validatePlaybackAccess(sessionId: string): Promise<boolean> {
    const secret = cloudflareEnv.BETTER_AUTH_SECRET;
    if (!secret) return false;
    const result = await verifyToken(sessionId, secret);
    return result.valid && result.payload.scope === "playback:open";
  }

  async getDownloadAccess(assetId: string): Promise<DownloadAccess> {
    const contentId = assetId.replace(/^open-asset-/, "");
    const stream = getOpenStream(contentId);
    if (!stream || !stream.license.downloadable) {
      return { allowed: false, reason: "license_does_not_allow_download" };
    }
    // The source is already a public, freely redistributable file, so the
    // download is a direct link to the publisher with attribution preserved.
    return {
      allowed: true,
      url: stream.url,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      format: "mp4",
      quality: null,
    };
  }

  async getProviderHealth(): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      message: "Public-domain and CC BY sources hosted by their publishers.",
    };
  }
}
