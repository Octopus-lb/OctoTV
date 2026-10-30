import assert from "node:assert/strict";
import test from "node:test";
import { ar } from "../lib/i18n/messages/ar.ts";
import { en } from "../lib/i18n/messages/en.ts";
import { fr } from "../lib/i18n/messages/fr.ts";
import { tr } from "../lib/i18n/messages/tr.ts";
import { filterChannels, parseM3U } from "../lib/live/filters.ts";
import type { LiveChannel } from "../lib/live/types.ts";
import { isPlaybackAssetAuthorized } from "../lib/playback/authorization.ts";
import { signToken, verifyToken } from "../lib/playback/token.ts";
import { filterQualities, selectServer } from "../lib/playback/types.ts";
import type { PlaybackOption } from "../lib/playback/types.ts";
import { isSameOriginRequest } from "../lib/security/origin.ts";

test("all supported locale dictionaries have the same complete keys", () => {
  const expected = Object.keys(en).sort();
  for (const [locale, messages] of Object.entries({ ar, en, tr, fr })) {
    assert.deepEqual(Object.keys(messages).sort(), expected, `${locale} dictionary differs`);
    assert.ok(Object.values(messages).every((message) => typeof message === "string"));
  }
});

test("write request origin checks reject missing, null, and foreign origins", () => {
  const sameOrigin = new Request("https://octotv.example/api/progress", {
    method: "POST",
    headers: { Origin: "https://octotv.example" },
  });
  const foreignOrigin = new Request("https://octotv.example/api/progress", {
    method: "POST",
    headers: { Origin: "https://attacker.example" },
  });
  const nullOrigin = new Request("https://octotv.example/api/progress", {
    method: "POST",
    headers: { Origin: "null" },
  });
  assert.equal(isSameOriginRequest(sameOrigin), true);
  assert.equal(isSameOriginRequest(foreignOrigin), false);
  assert.equal(isSameOriginRequest(nullOrigin), false);
  assert.equal(isSameOriginRequest(new Request("https://octotv.example/api/progress", { method: "POST" })), false);
});

test("signed playback tokens validate, reject tampering, and expire", async () => {
  const secret = "unit-test-secret-with-enough-entropy";
  const token = await signToken({ sub: "user-1", scope: "playback", ttlSeconds: 5 }, secret);
  const verified = await verifyToken(token, secret);
  assert.equal(verified.valid, true);
  if (verified.valid) assert.equal(verified.payload.sub, "user-1");

  const [body, signature] = token.split(".");
  assert.equal((await verifyToken(`${body}.bad${signature}`, secret)).valid, false);

  const expired = await signToken({ sub: "user-1", scope: "download", exp: 10 }, secret);
  assert.deepEqual(await verifyToken(expired, secret, 10_000), { valid: false, reason: "expired" });
});

function option(
  id: string,
  availability: PlaybackOption["server"]["availability"],
  priority: number,
  manifestUrl = `https://media.example/${id}.m3u8`,
): PlaybackOption {
  return {
    assetId: `asset-${id}`,
    contentId: "title-1",
    episodeId: null,
    providerId: "licensed-provider",
    server: {
      id,
      displayName: id,
      providerId: "licensed-provider",
      region: null,
      priority,
      availability,
      supportedFormats: ["hls"],
      supportedQualities: ["1080p", "720p"],
      lastHealthCheck: null,
      error: null,
    },
    manifestUrl,
    manifestType: "hls",
    qualities: ["1080p", "720p"],
    audioTracks: [],
    subtitleTracks: [],
    expiresAt: null,
    downloadAvailable: false,
  };
}

test("server selection respects authorization constraints, health, priority and exclusions", () => {
  const options = [
    option("unavailable", "unavailable", 0),
    option("degraded", "degraded", 1),
    option("healthy-later", "available", 5),
    option("healthy-first", "available", 2),
  ];
  assert.equal(selectServer({ options })?.server.id, "healthy-first");
  assert.equal(selectServer({ options, preferredServerId: "degraded" })?.server.id, "degraded");
  assert.equal(selectServer({ options, allowDegraded: false, preferredServerId: "degraded" })?.server.id, "healthy-first");
  assert.equal(selectServer({ options, excludeServerIds: ["healthy-first"] })?.server.id, "healthy-later");
  assert.equal(selectServer({ options: [option("bad", "available", 0, "")] }), null);
  assert.deepEqual(filterQualities(["480p", "1080p", "360p"]), ["1080p", "480p", "360p"]);
});

test("playback rights require an active matching provider and current license window", () => {
  const now = Date.UTC(2026, 0, 1);
  const active = {
    providerKey: "mux",
    status: "active",
    licenseStartsAt: new Date(now - 60_000),
    licenseEndsAt: new Date(now + 60_000),
  };
  assert.equal(isPlaybackAssetAuthorized(active, "mux", now), true);
  assert.equal(isPlaybackAssetAuthorized(active, "bunny", now), false);
  assert.equal(isPlaybackAssetAuthorized({ ...active, status: "disabled" }, "mux", now), false);
  assert.equal(isPlaybackAssetAuthorized({ ...active, licenseStartsAt: new Date(now + 1) }, "mux", now), false);
  assert.equal(isPlaybackAssetAuthorized({ ...active, licenseEndsAt: new Date(now) }, "mux", now), false);
});

test("M3U parser extracts channels and deduplicates IDs", () => {
  const channels = parseM3U(`#EXTM3U\n#EXTINF:-1 tvg-id="news.one" tvg-name="News" tvg-logo="https://img.example/n.png" group-title="News",Global News\nhttps://stream.example/one.m3u8\n#EXTINF:-1 tvg-id="news.one",Duplicate\nhttps://stream.example/two.m3u8`);
  assert.equal(channels.length, 1);
  assert.equal(channels[0]?.id, "news.one");
  assert.equal(channels[0]?.name, "Global News");
  assert.equal(channels[0]?.logo, "https://img.example/n.png");
  assert.equal(channels[0]?.sources[0]?.url, "https://stream.example/one.m3u8");
});

test("channel filters always exclude NSFW and blocked sources by default", () => {
  const channel = (id: string, isNsfw: boolean, name: string): LiveChannel => ({
    id,
    name,
    altNames: [],
    country: "SA",
    languages: ["ara"],
    categories: ["news"],
    logo: null,
    website: null,
    isNsfw,
    sources: [{ url: `https://stream.example/${id}.m3u8`, quality: null, label: null }],
    sourceCount: 1,
  });
  const channels = [channel("safe", false, "Arab News"), channel("adult", true, "Arab Adult")];
  const israeliByCountry = { ...channel("country-il", false, "Regional News"), country: "IL" };
  const israeliById = { ...channel("channel.il", false, "Regional News"), country: null };
  assert.deepEqual(filterChannels(channels, { country: "SA", query: "arab" }).map((item) => item.id), ["safe"]);
  assert.deepEqual(filterChannels(channels, { includeNsfw: true, blockedIds: new Set(["safe"]) }).map((item) => item.id), ["adult"]);
  assert.deepEqual(filterChannels([...channels, israeliByCountry, israeliById], { includeNsfw: true }).map((item) => item.id), ["safe", "adult"]);
});

test("channel country and category filters match normalized metadata", () => {
  const channel: LiveChannel = {
    id: "regional-news",
    name: "Regional News",
    altNames: [],
    country: "TR",
    languages: ["tur"],
    categories: ["news", "culture"],
    logo: null,
    website: null,
    isNsfw: false,
    sources: [{ url: "https://stream.example/news.m3u8", quality: null, label: null }],
    sourceCount: 1,
  };
  assert.deepEqual(filterChannels([channel], { country: "tr" }).map((item) => item.id), ["regional-news"]);
  assert.deepEqual(filterChannels([channel], { category: "culture" }).map((item) => item.id), ["regional-news"]);
});
