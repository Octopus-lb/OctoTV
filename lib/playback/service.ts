import { allProviders, getProvider } from "./providers";
import { selectServer } from "./types";
import type {
  DownloadAccess,
  PlaybackOption,
  PlaybackSession,
  ProviderHealth,
} from "./types";

export async function getPlaybackOptions(
  contentId: string,
  profileId?: string,
): Promise<PlaybackOption[]> {
  const results = await Promise.allSettled(
    allProviders().map((provider) =>
      provider.getPlaybackOptions(contentId, profileId),
    ),
  );

  const options = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  return options.sort(
    (a, b) =>
      a.server.priority - b.server.priority ||
      a.server.displayName.localeCompare(b.server.displayName),
  );
}

export async function resolveServer(input: {
  contentId: string;
  profileId?: string;
  preferredServerId?: string | null;
  excludeServerIds?: string[];
}): Promise<PlaybackOption | null> {
  const options = await getPlaybackOptions(input.contentId, input.profileId);
  return selectServer({
    options,
    preferredServerId: input.preferredServerId,
    excludeServerIds: input.excludeServerIds,
  });
}

export async function createPlaybackSession(
  assetId: string,
  userId: string,
  providerId: string,
): Promise<PlaybackSession> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error("Unknown playback provider.");
  return provider.createPlaybackSession(assetId, userId);
}

export async function validatePlaybackAccess(
  sessionToken: string,
  providerId: string,
): Promise<boolean> {
  const provider = getProvider(providerId);
  if (!provider) return false;
  return provider.validatePlaybackAccess(sessionToken);
}

export async function getDownloadAccess(
  assetId: string,
  userId: string,
  providerId: string,
): Promise<DownloadAccess> {
  const provider = getProvider(providerId);
  if (!provider) return { allowed: false, reason: "unknown_provider" };
  return provider.getDownloadAccess(assetId, userId);
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  const results = await Promise.allSettled(
    allProviders().map((provider) => provider.getProviderHealth()),
  );
  return results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          providerId: allProviders()[index]?.id ?? "unknown",
          status: "down" as const,
          checkedAt: new Date().toISOString(),
          message: "Health check failed.",
        },
  );
}
