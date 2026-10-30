"use client";

import Hls, { type Level } from "hls.js";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Subtitles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { PlaybackOption } from "@/lib/playback/types";
import type { Locale } from "@/lib/i18n/config";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hrs > 0
    ? `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${mins}:${String(secs).padStart(2, "0")}`;
}

function qualityLabel(height: number | undefined, fallback: string): string {
  if (!height) return fallback;
  if (height >= 2160) return "2160p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  return "360p";
}

export type VideoPlayerProps = {
  locale: Locale;
  contentId: string;
  title: string;
  episodeId?: string | null;
  options: PlaybackOption[];
  resumeSeconds?: number;
  nextHref?: string | null;
  nextLabel?: string | null;
  backHref: string;
  backLabel: string;
};

export function VideoPlayer({
  contentId,
  title,
  episodeId,
  options,
  resumeSeconds = 0,
  nextHref,
  nextLabel,
  backHref,
  backLabel,
}: VideoPlayerProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const networkRetries = useRef(0);
  const lastReport = useRef(0);

  const [serverId, setServerId] = useState(options[0]?.server.id ?? "");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [levels, setLevels] = useState<Array<{ index: number; height: number }>>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<Array<{ index: number; label: string; lang?: string }>>([]);
  const [audioIndex, setAudioIndex] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<Array<{ index: number; label: string; lang?: string }>>([]);
  const [subtitleSelection, setSubtitleSelection] = useState("off");
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);

  const current = useMemo(
    () =>
      options.find((option) => option.server.id === serverId) ?? options[0] ?? null,
    [options, serverId],
  );

  const externalSubtitles = useMemo(() => current?.subtitleTracks ?? [], [current]);
  const qualityChoices = useMemo(() => {
    const fromLevels = levels
      .map((level) => ({ height: level.height, index: level.index, label: qualityLabel(level.height, `${level.height}p`) }))
      .filter((level) => level.height > 0)
      .sort((a, b) => b.height - a.height);
    if (fromLevels.length) {
      const seen = new Set<string>();
      return fromLevels.filter((level) => {
        if (seen.has(level.label)) return false;
        seen.add(level.label);
        return true;
      });
    }
    return current?.qualities.map((quality) => ({
      label: quality,
      height: Number.parseInt(quality, 10),
      index: -1,
    })) ?? [];
  }, [current, levels]);

  const reportProgress = useCallback(
    (force = false) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const now = Date.now();
      if (!force && now - lastReport.current < 12_000) return;
      lastReport.current = now;
      const body = JSON.stringify({
        titleId: contentId,
        episodeId: episodeId ?? null,
        positionSeconds: video.currentTime,
        durationSeconds: video.duration,
      });
      if (force && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon("/api/progress", new Blob([body], { type: "application/json" }));
        return;
      }
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    },
    [contentId, episodeId],
  );

  const tryFallbackServer = useCallback(() => {
    const next = options.find(
      (option) =>
        option.server.id !== serverId &&
        !excluded.includes(option.server.id) &&
        option.server.availability !== "unavailable",
    );
    if (!next) {
      setError(t("player.playbackErrorBody"));
      return;
    }
    setExcluded((current) => [...current, serverId]);
    setFallbackNote(t("player.autoFallback"));
    setError(null);
    setServerId(next.server.id);
  }, [excluded, options, serverId, t]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current) return;

    let disposed = false;
    setError(null);
    setLevels([]);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setSelectedLevel(-1);
    setAudioIndex(-1);
    setSubtitleSelection("off");
    networkRetries.current = 0;

    const begin = () => {
      if (disposed) return;
      const startAt = resumeSeconds > 0 ? Math.min(resumeSeconds, 3600) : 0;
      if (startAt > 0 && startAt < (video.duration || Number.MAX_SAFE_INTEGER)) {
        try {
          video.currentTime = startAt;
        } catch {
          // Seeking before metadata is available; retry on loadedmetadata.
        }
      }
      void video.play().catch(() => setPlaying(false));
    };

    if (
      current.manifestType === "hls" &&
      video.canPlayType("application/vnd.apple.mpegurl") &&
      !Hls.isSupported()
    ) {
      video.src = current.manifestUrl;
      video.addEventListener("loadedmetadata", begin, { once: true });
      return () => {
        disposed = true;
        video.removeEventListener("loadedmetadata", begin);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (current.manifestType === "mp4" || !Hls.isSupported()) {
      video.src = current.manifestUrl;
      video.addEventListener("loadedmetadata", begin, { once: true });
      return () => {
        disposed = true;
        video.removeEventListener("loadedmetadata", begin);
        video.removeAttribute("src");
        video.load();
      };
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
    });
    hlsRef.current = hls;
    hls.loadSource(current.manifestUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      setLevels(
        data.levels.map((level: Level, index: number) => ({
          index,
          height: level.height ?? 0,
        })),
      );
      begin();
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      if (hls.autoLevelEnabled) setSelectedLevel(-1);
      else setSelectedLevel(data.level);
    });

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      setAudioTracks(
        hls.audioTracks.map((track, index) => ({
          index,
          label: track.name || track.lang || `Audio ${index + 1}`,
          lang: track.lang,
        })),
      );
    });

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
      setSubtitleTracks(
        hls.subtitleTracks.map((track, index) => ({
          index,
          label: track.name || track.lang || `Subtitle ${index + 1}`,
          lang: track.lang,
        })),
      );
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries.current < 1) {
        networkRetries.current += 1;
        hls.startLoad();
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }
      tryFallbackServer();
    });

    return () => {
      disposed = true;
      hls.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // resumeSeconds is intentionally read once per server switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.manifestUrl, current?.server.id, tryFallbackServer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hlsRef.current) hlsRef.current.currentLevel = selectedLevel;
    video.volume = volume;
    video.muted = muted;
  }, [selectedLevel, volume, muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const hls = hlsRef.current;
    if (hls && subtitleTracks.length) {
      if (subtitleSelection === "off") hls.subtitleTrack = -1;
      else {
        const index = Number(subtitleSelection.replace("hls:", ""));
        if (Number.isFinite(index)) hls.subtitleTrack = index;
      }
    }
    for (const track of Array.from(video.textTracks)) {
      track.mode = "disabled";
    }
    if (subtitleSelection.startsWith("ext:")) {
      const id = subtitleSelection.slice(4);
      const track = Array.from(video.textTracks).find(
        (item) => item.id === id || item.label === externalSubtitles.find((sub) => sub.id === id)?.label,
      );
      if (track) track.mode = "showing";
    }
  }, [subtitleSelection, subtitleTracks, externalSubtitles]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (audioTracks.length && audioIndex >= 0 && hlsRef.current) {
      hlsRef.current.audioTrack = audioIndex;
    }
  }, [audioIndex, audioTracks.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      reportProgress(false);
    };
    const onDuration = () => setDuration(video.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      reportProgress(true);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onEnded = () => {
      reportProgress(true);
      setPlaying(false);
    };
    const onVolume = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("loadedmetadata", onDuration);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    video.addEventListener("volumechange", onVolume);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("loadedmetadata", onDuration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("volumechange", onVolume);
    };
  }, [reportProgress]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") reportProgress(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => reportProgress(true));
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reportProgress]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const video = videoRef.current;
      if (!video) return;
      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          void (video.paused ? video.play() : video.pause());
          break;
        case "ArrowRight":
          video.currentTime = Math.min(video.currentTime + 10, video.duration || 0);
          break;
        case "ArrowLeft":
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        case "m":
          video.muted = !video.muted;
          break;
        case "f":
          void toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function toggleFullscreen() {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch {
      // Fullscreen may be blocked by the browser.
    }
  }

  async function togglePip() {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // PiP can be rejected for this stream/browser.
    }
  }

  if (!current) {
    return (
      <div className="player-unavailable">
        <AlertTriangle size={30} />
        <h2>{t("catalog.playUnavailable")}</h2>
        <p>{t("catalog.playUnavailableBody")}</p>
        <Link href={backHref} className="primary-btn">
          {backLabel}
        </Link>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="watch-shell">
      <div className="watch-topbar">
        <Link href={backHref} className="ghost-btn small">
          {backLabel}
        </Link>
        <div className="watch-title">
          <strong>{title}</strong>
          {current.server.availability !== "available" && (
            <span className="status-pill degraded">{t("live.health")}: {current.server.availability}</span>
          )}
        </div>
        {nextHref && nextLabel ? (
          <Link href={nextHref} className="ghost-btn small">
            <SkipForward size={16} /> {nextLabel}
          </Link>
        ) : null}
      </div>

      <div className="video-frame" ref={shellRef}>
        <video
          ref={videoRef}
          className="video-element"
          playsInline
          autoPlay
          preload="metadata"
          poster={undefined}
          onDoubleClick={() => void toggleFullscreen()}
          aria-label={title}
        >
          {externalSubtitles.map((track) => (
            <track
              key={track.id}
              id={track.id}
              kind="subtitles"
              src={track.fileUrl ?? undefined}
              srcLang={track.language}
              label={track.label}
              default={track.isDefault && subtitleSelection === "off"}
            />
          ))}
        </video>

        {buffering && !error && (
          <div className="video-overlay-status">
            <Loader2 className="spin" size={32} />
            <span>{t("player.buffering")}</span>
          </div>
        )}

        {error && (
          <div className="video-overlay-status error">
            <AlertTriangle size={34} />
            <strong>{t("player.playbackError")}</strong>
            <p>{error}</p>
            <div className="overlay-actions">
              <button type="button" className="primary-btn" onClick={() => setServerId(current.server.id)}>
                <RotateCcw size={16} /> {t("common.retry")}
              </button>
              {options.length > 1 && (
                <button type="button" className="ghost-btn" onClick={tryFallbackServer}>
                  {t("player.selectServer")}
                </button>
              )}
            </div>
          </div>
        )}

        {fallbackNote && !error && <div className="fallback-note">{fallbackNote}</div>}

        <div className="video-controls">
          <input
            type="range"
            className="seek-bar"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            aria-label={t("catalog.overview")}
            onChange={(event) => {
              const video = videoRef.current;
              if (video) video.currentTime = Number(event.target.value);
            }}
            style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}
          />
          <div className="controls-row">
            <button
              type="button"
              aria-label={playing ? "Pause" : t("common.play")}
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                void (video.paused ? video.play() : video.pause());
              }}
            >
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="volume-control">
              <button
                type="button"
                aria-label={muted ? "Unmute" : "Mute"}
                onClick={() => {
                  const video = videoRef.current;
                  if (video) video.muted = !video.muted;
                }}
              >
                {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                aria-label="Volume"
                onChange={(event) => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.volume = Number(event.target.value);
                  video.muted = Number(event.target.value) === 0;
                }}
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="controls-spacer" />

            <span className="server-chip">
              {t("player.server")}: <b>{current.server.displayName}</b>
            </span>

            <button
              type="button"
              aria-label={t("player.settings")}
              aria-expanded={settingsOpen}
              className={settingsOpen ? "active" : undefined}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Settings size={19} />
            </button>

            <button type="button" aria-label={t("player.pictureInPicture")} onClick={() => void togglePip()}>
              <PictureInPicture2 size={19} />
            </button>

            <button
              type="button"
              aria-label={fullscreen ? t("player.exitFullscreen") : t("player.fullscreen")}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>

        {settingsOpen && (
          <div className="settings-panel" role="dialog" aria-label={t("player.settings")}>
            <div className="settings-group">
              <h4>{t("player.server")}</h4>
              <div className="server-list">
                {options.map((option) => (
                  <button
                    key={option.server.id}
                    type="button"
                    className={option.server.id === serverId ? "active" : undefined}
                    disabled={option.server.availability === "unavailable"}
                    onClick={() => {
                      setExcluded([]);
                      setFallbackNote(null);
                      setServerId(option.server.id);
                    }}
                  >
                    <span>{option.server.displayName}</span>
                    <small>{option.server.region ?? option.providerId}</small>
                    {option.server.id === serverId && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <label className="settings-group">
              <h4>{t("player.quality")}</h4>
              <select
                value={selectedLevel}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSelectedLevel(value);
                  const hls = hlsRef.current;
                  if (hls) hls.currentLevel = value;
                }}
              >
                <option value={-1}>{t("player.autoQuality")}</option>
                {qualityChoices.map((quality) => (
                  <option key={quality.label} value={quality.index}>
                    {quality.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="settings-group">
              <h4>
                <Subtitles size={14} /> {t("player.subtitles")}
              </h4>
              <select
                value={subtitleSelection}
                onChange={(event) => setSubtitleSelection(event.target.value)}
              >
                <option value="off">{t("player.off")}</option>
                {externalSubtitles.map((track) => (
                  <option key={track.id} value={`ext:${track.id}`}>
                    {track.label}
                  </option>
                ))}
                {subtitleTracks.map((track) => (
                  <option key={`hls-${track.index}`} value={`hls:${track.index}`}>
                    {track.label}
                  </option>
                ))}
              </select>
            </label>

            {audioTracks.length > 1 && (
              <label className="settings-group">
                <h4>{t("player.audio")}</h4>
                <select value={audioIndex} onChange={(event) => setAudioIndex(Number(event.target.value))}>
                  <option value={-1}>{t("player.auto")}</option>
                  {audioTracks.map((track) => (
                    <option key={track.index} value={track.index}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="settings-group">
              <h4>{t("player.speed")}</h4>
              <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                {SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value === 1 ? t("player.normal") : `${value}×`}
                  </option>
                ))}
              </select>
            </label>

            <p className="keyboard-hint">{t("player.keyboardHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
