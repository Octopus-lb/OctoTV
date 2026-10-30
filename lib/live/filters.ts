import type { ChannelFilters, LiveChannel } from "./types";

function attr(line: string, name: string): string {
  return line.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1] ?? "";
}

/**
 * Minimal M3U parser for IPTV-org playlists. Only the attributes needed by the
 * UI are read; playlist URLs are treated as untrusted input.
 */
export function parseM3U(source: string): LiveChannel[] {
  const lines = source.replace(/\r/g, "").split("\n");
  const channels: LiveChannel[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line?.startsWith("#EXTINF")) continue;
    const url = lines[index + 1]?.trim();
    if (!url || url.startsWith("#")) continue;
    const name =
      line.slice(line.lastIndexOf(",") + 1).trim() ||
      attr(line, "tvg-name") ||
      "Channel";
    const id = attr(line, "tvg-id") || `${name}-${index}`;
    if (seen.has(id)) continue;
    seen.add(id);
    channels.push({
      id,
      name,
      altNames: [],
      country: null,
      languages: attr(line, "tvg-language")
        ? attr(line, "tvg-language").split(",").map((value) => value.trim()).filter(Boolean)
        : [],
      categories: attr(line, "group-title") ? [attr(line, "group-title")] : [],
      logo: attr(line, "tvg-logo") || null,
      website: null,
      isNsfw: false,
      sources: [{ url, quality: attr(line, "tvg-quality") || null, label: null }],
      sourceCount: 1,
    });
  }

  return channels;
}

/**
 * Applies country/language/category/search filters. Adult channels are hidden
 * unless explicitly requested, and blocked IDs always win.
 */
export function filterChannels(
  channels: LiveChannel[],
  filters: ChannelFilters,
): LiveChannel[] {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return channels.filter((channel) => {
    if (!filters.includeNsfw && channel.isNsfw) return false;
    if (filters.blockedIds?.has(channel.id)) return false;
    if (filters.country && channel.country?.toLowerCase() !== filters.country.toLowerCase()) {
      return false;
    }
    if (
      filters.category &&
      !channel.categories.some(
        (category) => category.toLowerCase() === filters.category?.toLowerCase(),
      )
    ) {
      return false;
    }
    if (query) {
      const haystack = `${channel.name} ${channel.altNames.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return channel.sourceCount > 0;
  });
}
