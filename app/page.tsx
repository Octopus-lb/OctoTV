"use client";

import {
  Bell,
  ChevronLeft,
  CircleUserRound,
  Clapperboard,
  Compass,
  History,
  Home as HomeIcon,
  ListPlus,
  Play,
  Radio,
  Search,
  Sparkles,
  Tv,
} from "lucide-react";
import { LiveTV } from "@/components/live-tv";

const featured = [
  { title: "أصداء أوريون", meta: "2026 · خيال علمي", tone: "violet", score: "8.7" },
  { title: "خط الأطلس", meta: "2025 · إثارة", tone: "orange", score: "8.3" },
  { title: "المدينة الصامتة", meta: "2026 · غموض", tone: "blue", score: "8.1" },
  { title: "آخر إشارة", meta: "2024 · دراما", tone: "green", score: "7.9" },
  { title: "شمس منتصف الليل", meta: "2025 · مغامرة", tone: "rose", score: "8.5" },
  { title: "ما وراء المحيط", meta: "2026 · وثائقي", tone: "cyan", score: "8.0" },
];

const genres = [
  ["أكشن", "#f97316"],
  ["خيال علمي", "#8b5cf6"],
  ["كوميديا", "#eab308"],
  ["وثائقي", "#14b8a6"],
  ["دراما", "#ec4899"],
  ["عائلي", "#3b82f6"],
];

function Logo() {
  return (
    <div className="brand" aria-label="OctoTV">
      <span className="brand-mark"><Play fill="currentColor" size={15} /></span>
      <span>OCTOTV</span>
    </div>
  );
}

function MediaCard({ item, index }: { item: (typeof featured)[number]; index: number }) {
  return (
    <button className="media-card" style={{ "--i": index } as React.CSSProperties}>
      <span className={`poster poster-${item.tone}`}>
        <span className="poster-noise" />
        <span className="poster-title">{item.title}</span>
        <span className="poster-orbit" />
      </span>
      <span className="card-copy">
        <strong>{item.title}</strong>
        <small>{item.meta}</small>
      </span>
      <span className="score">★ {item.score}</span>
    </button>
  );
}

export default function Home() {
  const scrollToLive = () => document.getElementById("live")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main>
      <header className="topbar">
        <Logo />
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <a href="#home" className="active">الرئيسية</a>
          <a href="#movies">أفلام</a>
          <a href="#movies">مسلسلات</a>
          <a href="#genres">أنمي</a>
          <a href="#live">بث مباشر <span className="live-dot" /></a>
        </nav>
        <div className="top-actions">
          <button aria-label="بحث"><Search size={20} /></button>
          <button aria-label="التنبيهات"><Bell size={20} /></button>
          <button className="profile" aria-label="الملف الشخصي"><CircleUserRound size={22} /></button>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-art" aria-hidden="true">
          <span className="planet" />
          <span className="ring ring-one" />
          <span className="ring ring-two" />
          <span className="ship" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> اختيار الأسبوع</div>
          <h1>أصداء<br /><em>أوريون</em></h1>
          <div className="hero-meta"><b>9.1</b><span>2026</span><span>2س 18د</span><span>4K</span></div>
          <p>رحلة عبر آخر حدود الكون، حيث تصل إشارة غامضة من مكان لم يكن من المفترض أن يوجد.</p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={scrollToLive}><Play fill="currentColor" size={18} /> شاهد الآن</button>
            <button className="ghost-btn"><ListPlus size={19} /> أضف إلى قائمتي</button>
          </div>
        </div>
        <div className="hero-pager" aria-label="شرائح العرض"><b /><span /><span /><span /></div>
      </section>

      <section id="movies" className="content-section overlap-section">
        <div className="section-heading">
          <div><span className="kicker">مختارة لك</span><h2>الأكثر مشاهدة الآن</h2></div>
          <button>عرض الكل <ChevronLeft size={18} /></button>
        </div>
        <div className="media-row">
          {featured.map((item, index) => <MediaCard key={item.title} item={item} index={index} />)}
        </div>
      </section>

      <LiveTV />

      <section id="genres" className="content-section genre-section">
        <div className="section-heading">
          <div><span className="kicker">تصفّح بطريقتك</span><h2>أنواع شائعة</h2></div>
        </div>
        <div className="genre-grid">
          {genres.map(([name, color], i) => (
            <button className="genre-card" key={name} style={{ "--genre": color, "--i": i } as React.CSSProperties}>
              <Compass size={22} />
              <strong>{name}</strong>
              <span>{String(120 + i * 47)} عنوانًا</span>
            </button>
          ))}
        </div>
      </section>

      <footer>
        <Logo />
        <p>واجهة بث حديثة للمحتوى المرخّص والقنوات العامة المتاحة عبر IPTV-org.</p>
        <div><a href="#home">الرئيسية</a><a href="#movies">المكتبة</a><a href="#live">القنوات</a></div>
        <small>© 2026 OctoTV · نسخة تجريبية خاصة</small>
      </footer>

      <nav className="mobile-nav" aria-label="تنقل الجوال">
        <a href="#home" className="active"><HomeIcon size={19} /><span>الرئيسية</span></a>
        <a href="#movies"><Clapperboard size={19} /><span>أفلام</span></a>
        <a href="#live"><Radio size={19} /><span>مباشر</span></a>
        <a href="#genres"><Tv size={19} /><span>أنواع</span></a>
        <a href="#home"><History size={19} /><span>السجل</span></a>
      </nav>
    </main>
  );
}
