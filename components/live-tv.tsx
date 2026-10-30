"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, Play, Radio, Search, X } from "lucide-react";

type Channel = {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
};

const collections = [
  ["arab", "العالم العربي"],
  ["nl", "هولندا"],
  ["news", "أخبار"],
  ["sports", "رياضة"],
  ["movies", "أفلام"],
  ["music", "موسيقى"],
];

export function LiveTV() {
  const [collection, setCollection] = useState("arab");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/channels?list=${collection}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("تعذّر تحميل قائمة القنوات");
        return r.json() as Promise<{ channels?: Channel[] }>;
      })
      .then((data) => {
        setChannels(data.channels ?? []);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message || "تعذّر تحميل القنوات");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [collection]);

  useEffect(() => {
    if (!selected || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    setError("");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selected.url;
      video.play().catch(() => undefined);
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(selected.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError("هذه القناة غير متاحة حاليًا أو محجوبة جغرافيًا. جرّب قناة أخرى.");
      });
    } else {
      setError("المتصفح لا يدعم تشغيل HLS.");
    }

    return () => {
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? channels.filter((c) => `${c.name} ${c.group}`.toLowerCase().includes(q)) : channels;
  }, [channels, query]);

  return (
    <section id="live" className="content-section live-section">
      <div className="section-heading live-heading">
        <div>
          <span className="kicker"><Radio size={13} /> مباشر الآن</span>
          <h2>قنوات تلفزيونية من أنحاء العالم</h2>
          <p>قنوات عامة من مشروع IPTV-org؛ قد يختلف التوفر حسب البلد ومصدر البث.</p>
        </div>
        <div className="channel-search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن قناة" aria-label="ابحث عن قناة" />
        </div>
      </div>

      <div className="collection-tabs" role="tablist" aria-label="مجموعات القنوات">
        {collections.map(([id, label]) => (
          <button key={id} className={collection === id ? "active" : ""} onClick={() => setCollection(id)}>{label}</button>
        ))}
      </div>

      {loading && <div className="status-box"><LoaderCircle className="spin" size={24} /> جاري تحميل القنوات…</div>}
      {!loading && error && !selected && <div className="status-box error"><AlertCircle size={22} /> {error}</div>}
      {!loading && !error && !filtered.length && <div className="status-box">لا توجد نتائج مطابقة.</div>}

      <div className="channel-grid">
        {filtered.slice(0, 36).map((channel, index) => (
          <button className="channel-card" key={`${channel.id}-${index}`} onClick={() => setSelected(channel)}>
            <span className="channel-logo">
              {channel.logo ? <img src={channel.logo} alt="" loading="lazy" /> : <Radio size={24} />}
            </span>
            <span className="channel-copy"><strong>{channel.name}</strong><small>{channel.group || "قناة عامة"}</small></span>
            <span className="channel-play"><Play fill="currentColor" size={14} /></span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="player-overlay" role="dialog" aria-modal="true" aria-label={`تشغيل ${selected.name}`}>
          <button className="player-backdrop" aria-label="إغلاق" onClick={() => setSelected(null)} />
          <div className="player-modal">
            <div className="player-top">
              <div><span className="live-pill"><b /> مباشر</span><strong>{selected.name}</strong></div>
              <button onClick={() => setSelected(null)} aria-label="إغلاق المشغّل"><X size={21} /></button>
            </div>
            <div className="video-shell">
              <video ref={videoRef} controls playsInline autoPlay />
              {error && <div className="video-error"><AlertCircle size={25} /><span>{error}</span></div>}
            </div>
            <p>يتم الاتصال بمصدر البث العام مباشرةً. بعض القنوات قد تكون مقيّدة جغرافيًا أو غير متاحة طوال اليوم.</p>
          </div>
        </div>
      )}
    </section>
  );
}
