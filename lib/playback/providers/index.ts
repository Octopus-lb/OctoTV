import { env as cloudflareEnv } from "cloudflare:workers";
import type { PlaybackProvider } from "../types";
import { createDbBackedProvider } from "./db-backed";
import { DemoPlaybackProvider } from "./demo";
export { DemoPlaybackProvider } from "./demo";

export const muxProvider = createDbBackedProvider({
  id: "mux",
  displayName: "Mux",
  ready: () => Boolean(cloudflareEnv.MUX_TOKEN_ID && cloudflareEnv.MUX_TOKEN_SECRET),
  buildManifest: ({ externalAssetId }) => ({
    url: `https://stream.mux.com/${encodeURIComponent(externalAssetId)}.m3u8`,
    type: "hls",
  }),
});

export const cloudflareStreamProvider = createDbBackedProvider({
  id: "cloudflare-stream",
  displayName: "Cloudflare Stream",
  ready: () =>
    Boolean(
      cloudflareEnv.CLOUDFLARE_ACCOUNT_ID &&
        cloudflareEnv.CLOUDFLARE_STREAM_API_TOKEN &&
        cloudflareEnv.CLOUDFLARE_STREAM_SUBDOMAIN,
    ),
  buildManifest: ({ externalAssetId }) => {
    const subdomain = cloudflareEnv.CLOUDFLARE_STREAM_SUBDOMAIN;
    if (!subdomain) return null;
    return {
      url: `https://customer-${subdomain}.cloudflarestream.com/${encodeURIComponent(externalAssetId)}/manifest/video.m3u8`,
      type: "hls",
    };
  },
});

export const bunnyStreamProvider = createDbBackedProvider({
  id: "bunny",
  displayName: "Bunny Stream",
  ready: () =>
    Boolean(
      cloudflareEnv.BUNNY_STREAM_API_KEY &&
        cloudflareEnv.BUNNY_STREAM_LIBRARY_ID &&
        cloudflareEnv.BUNNY_STREAM_PULL_ZONE,
    ),
  buildManifest: ({ externalAssetId }) => {
    const zone = cloudflareEnv.BUNNY_STREAM_PULL_ZONE;
    if (!zone) return null;
    return {
      url: `https://${zone}.b-cdn.net/${encodeURIComponent(externalAssetId)}/playlist.m3u8`,
      type: "hls",
    };
  },
});

export const privateLibraryProvider = createDbBackedProvider({
  id: "private",
  displayName: "Private library",
  ready: () => true,
  buildManifest: ({ storedManifestUrl }) => {
    if (!storedManifestUrl) return null;
    const type = storedManifestUrl.endsWith(".mp4")
      ? "mp4"
      : storedManifestUrl.endsWith(".mpd")
        ? "dash"
        : "hls";
    return { url: storedManifestUrl, type };
  },
});

const registry = new Map<string, PlaybackProvider>();

for (const provider of [
  new DemoPlaybackProvider(),
  muxProvider,
  cloudflareStreamProvider,
  bunnyStreamProvider,
  privateLibraryProvider,
]) {
  registry.set(provider.id, provider);
}

export function getProvider(id: string): PlaybackProvider | null {
  return registry.get(id) ?? null;
}

export function allProviders(): PlaybackProvider[] {
  return [...registry.values()];
}

export const providerIds = [
  "demo",
  "mux",
  "cloudflare-stream",
  "bunny",
  "private",
] as const;
