export type QualityLevel = "2160p" | "1080p" | "720p" | "480p" | "360p";

export type ManifestType = "hls" | "dash" | "mp4";

export type HealthStatus = "unknown" | "healthy" | "degraded" | "down";

export type PlaybackServer = {
  id: string;
  displayName: string;
  providerId: string;
  region: string | null;
  priority: number;
  availability: "available" | "degraded" | "unavailable";
  supportedFormats: ManifestType[];
  supportedQualities: QualityLevel[];
  lastHealthCheck: string | null;
  error: string | null;
};

export type SubtitleTrack = {
  id: string;
  playbackAssetId: string;
  language: string;
  label: string;
  format: "vtt" | "srt" | "embedded";
  fileUrl: string | null;
  isDefault: boolean;
  isForced?: boolean;
};

export type AudioTrack = {
  id: string;
  playbackAssetId: string;
  language: string;
  label: string;
  codec: string | null;
  channels: string | null;
  isDefault: boolean;
};

export type PlaybackOption = {
  assetId: string;
  contentId: string;
  episodeId: string | null;
  providerId: string;
  server: PlaybackServer;
  manifestUrl: string;
  manifestType: ManifestType;
  qualities: QualityLevel[];
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  expiresAt: string | null;
  downloadAvailable: boolean;
};

export type PlaybackSession = {
  id: string;
  assetId: string;
  providerId: string;
  token: string;
  expiresAt: string;
};

export type DownloadAccess =
  | { allowed: true; url: string; expiresAt: string; format: string; quality: string | null }
  | { allowed: false; reason: string };

export type ProviderHealth = {
  providerId: string;
  status: HealthStatus;
  checkedAt: string;
  message?: string;
};

export interface PlaybackProvider {
  readonly id: string;
  readonly displayName: string;
  getPlaybackOptions(contentId: string, profileId?: string): Promise<PlaybackOption[]>;
  createPlaybackSession(assetId: string, userId: string): Promise<PlaybackSession>;
  validatePlaybackAccess(sessionId: string): Promise<boolean>;
  getDownloadAccess(assetId: string, userId: string): Promise<DownloadAccess>;
  getProviderHealth(): Promise<ProviderHealth>;
}

export type SelectServerInput = {
  options: PlaybackOption[];
  preferredServerId?: string | null;
  excludeServerIds?: string[];
  allowDegraded?: boolean;
};

/** Deterministic, rights-preserving server ordering (no cross-asset fallback). */
export function selectServer({
  options,
  preferredServerId,
  excludeServerIds = [],
  allowDegraded = true,
}: SelectServerInput): PlaybackOption | null {
  const excluded = new Set(excludeServerIds);
  const candidates = options.filter((option) => {
    if (excluded.has(option.server.id)) return false;
    if (option.server.availability === "unavailable") return false;
    if (!allowDegraded && option.server.availability !== "available") return false;
    return option.manifestUrl.length > 0;
  });

  if (!candidates.length) return null;

  if (preferredServerId) {
    const preferred = candidates.find(
      (option) => option.server.id === preferredServerId,
    );
    if (preferred) return preferred;
  }

  return [...candidates].sort((a, b) => {
    const healthRank = (value: PlaybackOption) =>
      value.server.availability === "available" ? 0 : 1;
    return (
      healthRank(a) - healthRank(b) ||
      a.server.priority - b.server.priority ||
      a.server.displayName.localeCompare(b.server.displayName)
    );
  })[0];
}

export function filterQualities(qualities: QualityLevel[]): QualityLevel[] {
  const order: QualityLevel[] = ["2160p", "1080p", "720p", "480p", "360p"];
  return order.filter((quality) => qualities.includes(quality));
}

export function isDownloadable(option: PlaybackOption): boolean {
  return option.downloadAvailable;
}
