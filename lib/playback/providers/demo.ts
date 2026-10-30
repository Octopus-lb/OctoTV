import type {
  AudioTrack,
  PlaybackOption,
  PlaybackProvider,
  PlaybackSession,
  ProviderHealth,
  SubtitleTrack,
} from "../types";
import { signToken, verifyToken } from "../token";
import { env as cloudflareEnv } from "cloudflare:workers";

const SERVERS = [
  {
    id: "demo-server-miami",
    displayName: "Miami",
    region: "us-east",
    priority: 10,
    manifestUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    id: "demo-server-paris",
    displayName: "Paris",
    region: "eu-west",
    priority: 20,
    manifestUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8",
  },
  {
    id: "demo-server-berlin",
    displayName: "Berlin",
    region: "eu-central",
    priority: 30,
    manifestUrl: "https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8",
  },
] as const;

const SUBTITLE_LANGUAGES = [
  { language: "ar", label: "العربية" },
  { language: "en", label: "English" },
  { language: "tr", label: "Türkçe" },
  { language: "fr", label: "Français" },
];

function demoSubtitles(assetId: string): SubtitleTrack[] {
  return SUBTITLE_LANGUAGES.map((entry, index) => ({
    id: `${assetId}-sub-${entry.language}`,
    playbackAssetId: assetId,
    language: entry.language,
    label: entry.label,
    format: "vtt",
    fileUrl: `/api/subtitles/demo?lang=${entry.language}`,
    isDefault: index === 1,
  }));
}

function demoAudio(assetId: string): AudioTrack[] {
  return [
    {
      id: `${assetId}-audio-en`,
      playbackAssetId: assetId,
      language: "en",
      label: "English",
      codec: "aac",
      channels: "2.0",
      isDefault: true,
    },
  ];
}

/**
 * DemoPlaybackProvider serves public player test streams. It is intentionally
 * limited to demonstration content and never claims third-party distribution
 * rights. Production playback requires an authorized provider adapter.
 */
export class DemoPlaybackProvider implements PlaybackProvider {
  readonly id = "demo";
  readonly displayName = "Demo (test streams)";

  async getPlaybackOptions(contentId: string): Promise<PlaybackOption[]> {
    if (!contentId.startsWith("demo-")) return [];
    const assetId = `demo-asset-${contentId}`;
    return SERVERS.map((server) => ({
      assetId,
      contentId,
      episodeId: null,
      providerId: this.id,
      server: {
        id: server.id,
        displayName: server.displayName,
        providerId: this.id,
        region: server.region,
        priority: server.priority,
        availability: "available" as const,
        supportedFormats: ["hls"],
        supportedQualities: ["1080p", "720p", "480p"],
        lastHealthCheck: new Date().toISOString(),
        error: null,
      },
      manifestUrl: server.manifestUrl,
      manifestType: "hls" as const,
      qualities: ["1080p", "720p", "480p"],
      audioTracks: demoAudio(assetId),
      subtitleTracks: demoSubtitles(assetId),
      expiresAt: null,
      downloadAvailable: false,
    }));
  }

  async createPlaybackSession(assetId: string, userId: string): Promise<PlaybackSession> {
    const secret = cloudflareEnv.BETTER_AUTH_SECRET;
    if (!secret) throw new Error("Playback signing is not configured.");
    const token = await signToken(
      { sub: assetId, scope: "playback:demo", userId, ttlSeconds: 4 * 60 * 60 },
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
    return result.valid && result.payload.scope === "playback:demo";
  }

  async getDownloadAccess() {
    return {
      allowed: false as const,
      reason: "demo_content_has_no_download_rights",
    };
  }

  async getProviderHealth(): Promise<ProviderHealth> {
    return {
      providerId: this.id,
      status: "healthy",
      checkedAt: new Date().toISOString(),
      message: "Public player test streams.",
    };
  }
}
