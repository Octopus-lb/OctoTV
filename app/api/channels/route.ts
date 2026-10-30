import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const playlists: Record<string, string> = {
  arab: "https://iptv-org.github.io/iptv/regions/arab.m3u",
  nl: "https://iptv-org.github.io/iptv/countries/nl.m3u",
  news: "https://iptv-org.github.io/iptv/categories/news.m3u",
  sports: "https://iptv-org.github.io/iptv/categories/sports.m3u",
  movies: "https://iptv-org.github.io/iptv/categories/movies.m3u",
  music: "https://iptv-org.github.io/iptv/categories/music.m3u",
};

const fallbackChannels = [
  {
    id: "Alarabiya.ae@SD",
    name: "Al Arabiya",
    logo: "",
    group: "أخبار عربية",
    url: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
  },
  {
    id: "DW.de@Arabic",
    name: "DW Arabic",
    logo: "",
    group: "أخبار عربية",
    url: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/master.m3u8",
  },
  {
    id: "France24.fr@Arabic",
    name: "France 24 Arabic",
    logo: "",
    group: "أخبار عربية",
    url: "https://live.france24.com/hls/live/2037222/F24_AR_HI_HLS/master_2300.m3u8",
  },
  {
    id: "AjmanTV.ae@SD",
    name: "Ajman TV",
    logo: "",
    group: "قنوات عامة",
    url: "https://cdn1.logichost.in/ajmantv/live/playlist.m3u8",
  },
];

function attr(line: string, name: string) {
  return line.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1] ?? "";
}

function parseM3U(source: string) {
  const lines = source.replace(/\r/g, "").split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("#EXTINF")) continue;
    const url = lines[i + 1]?.trim();
    if (!url || url.startsWith("#")) continue;
    const name = line.slice(line.lastIndexOf(",") + 1).trim() || attr(line, "tvg-name") || "قناة";
    channels.push({
      id: attr(line, "tvg-id") || `${name}-${i}`,
      name,
      logo: attr(line, "tvg-logo"),
      group: attr(line, "group-title"),
      url,
    });
  }

  return channels.slice(0, 600);
}

export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list") || "arab";
  const playlist = playlists[list];
  if (!playlist) return NextResponse.json({ error: "Unknown playlist" }, { status: 400 });

  try {
    const response = await fetch(playlist, {
      headers: { Accept: "application/x-mpegURL,text/plain" },
    });
    if (!response.ok) throw new Error(`Playlist responded with ${response.status}`);
    const channels = parseM3U(await response.text());
    return NextResponse.json(
      { source: "IPTV-org", list, channels, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=900, s-maxage=1800" } },
    );
  } catch {
    return NextResponse.json(
      { source: "IPTV-org", list, channels: fallbackChannels, degraded: true, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }
}
