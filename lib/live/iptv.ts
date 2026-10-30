import { cached } from "@/lib/metadata/cache";
import { filterChannels, parseM3U } from "./filters";
import type { ChannelFilters, LiveChannel, LiveSource } from "./types";

export { filterChannels, parseM3U };

const CHANNELS_API = "https://iptv-org.github.io/api/channels.json";
const STREAMS_API = "https://iptv-org.github.io/api/streams.json";

export const PLAYLISTS: Record<string, string> = {
  arab: "https://iptv-org.github.io/iptv/regions/arab.m3u",
  nl: "https://iptv-org.github.io/iptv/countries/nl.m3u",
  news: "https://iptv-org.github.io/iptv/categories/news.m3u",
  sports: "https://iptv-org.github.io/iptv/categories/sports.m3u",
  movies: "https://iptv-org.github.io/iptv/categories/movies.m3u",
  music: "https://iptv-org.github.io/iptv/categories/music.m3u",
};

type RawChannel = {
  id: string;
  name: string;
  alt_names?: string[];
  country?: string;
  categories?: string[];
  languages?: string[];
  is_nsfw?: boolean;
  website?: string;
  logo?: string;
};

type RawStream = {
  channel?: string | null;
  url: string;
  quality?: string;
  label?: string;
  title?: string;
};

export async function loadApiChannels(): Promise<LiveChannel[]> {
  return cached(
    "iptv:channels:api",
    async () => {
      const [channelsResponse, streamsResponse] = await Promise.all([
        fetch(CHANNELS_API, { signal: AbortSignal.timeout(20_000) }),
        fetch(STREAMS_API, { signal: AbortSignal.timeout(20_000) }),
      ]);
      if (!channelsResponse.ok || !streamsResponse.ok) {
        throw new Error("IPTV-org API unavailable");
      }
      const rawChannels = (await channelsResponse.json()) as RawChannel[];
      const rawStreams = (await streamsResponse.json()) as RawStream[];

      const streamsByChannel = new Map<string, LiveSource[]>();
      for (const stream of rawStreams) {
        if (!stream.channel || !stream.url) continue;
        const list = streamsByChannel.get(stream.channel) ?? [];
        if (list.length >= 6) continue;
        list.push({
          url: stream.url,
          quality: stream.quality ?? null,
          label: stream.label ?? stream.title ?? null,
        });
        streamsByChannel.set(stream.channel, list);
      }

      return rawChannels
        .map<LiveChannel>((channel) => {
          const sources = streamsByChannel.get(channel.id) ?? [];
          return {
            id: channel.id,
            name: channel.name,
            altNames: channel.alt_names ?? [],
            country: channel.country ?? null,
            languages: channel.languages ?? [],
            categories: channel.categories ?? [],
            logo: channel.logo ?? null,
            website: channel.website ?? null,
            isNsfw: Boolean(channel.is_nsfw),
            sources,
            sourceCount: sources.length,
          };
        })
        .filter((channel) => channel.sourceCount > 0);
    },
    { ttlMs: 30 * 60 * 1000, staleOnError: true },
  );
}

export async function loadChannels(options: {
  playlist?: string | null;
  filters: ChannelFilters;
  limit: number;
  offset: number;
}): Promise<{ channels: LiveChannel[]; total: number; degraded: boolean }> {
  const playlist = options.playlist ? PLAYLISTS[options.playlist] : null;

  if (playlist) {
    try {
      const channels = await cached(
        `iptv:playlist:${options.playlist}`,
        async () => {
          const response = await fetch(playlist, {
            headers: { Accept: "application/x-mpegURL,text/plain" },
            signal: AbortSignal.timeout(20_000),
          });
          if (!response.ok) throw new Error(`Playlist ${response.status}`);
          return parseM3U(await response.text());
        },
        { ttlMs: 30 * 60 * 1000, staleOnError: true },
      );
      const filtered = filterChannels(channels, options.filters);
      return {
        channels: filtered.slice(options.offset, options.offset + options.limit),
        total: filtered.length,
        degraded: false,
      };
    } catch {
      const filtered = filterChannels(fallbackChannels(), options.filters);
      return {
        channels: filtered.slice(0, options.limit),
        total: filtered.length,
        degraded: true,
      };
    }
  }

  try {
    const channels = await loadApiChannels();
    const filtered = filterChannels(channels, options.filters);
    return {
      channels: filtered.slice(options.offset, options.offset + options.limit),
      total: filtered.length,
      degraded: false,
    };
  } catch {
    const filtered = filterChannels(fallbackChannels(), options.filters);
    return {
      channels: filtered.slice(0, options.limit),
      total: filtered.length,
      degraded: true,
    };
  }
}

export async function findChannel(id: string): Promise<LiveChannel | null> {
  try {
    const channels = await loadApiChannels();
    return channels.find((channel) => channel.id === id) ?? null;
  } catch {
    return fallbackChannels().find((channel) => channel.id === id) ?? null;
  }
}

export function fallbackChannels(): LiveChannel[] {
  const seeds = [
    {
      id: "Alarabiya.ae@SD",
      name: "Al Arabiya",
      group: "News",
      url: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
    },
    {
      id: "DW.de@Arabic",
      name: "DW Arabic",
      group: "News",
      url: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/master.m3u8",
    },
    {
      id: "France24.fr@Arabic",
      name: "France 24 Arabic",
      group: "News",
      url: "https://live.france24.com/hls/live/2037222/F24_AR_HI_HLS/master_2300.m3u8",
    },
  ];
  return seeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    altNames: [],
    country: null,
    languages: ["ara"],
    categories: [seed.group],
    logo: null,
    website: null,
    isNsfw: false,
    sources: [{ url: seed.url, quality: null, label: null }],
    sourceCount: 1,
  }));
}
