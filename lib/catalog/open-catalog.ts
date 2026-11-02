import type { CatalogDetail, CatalogTitle } from "./types";

/**
 * Open catalog.
 *
 * Every entry below is distributed under a license that permits free,
 * non-exclusive streaming: works in the public domain, or Creative Commons
 * Attribution (CC BY) films published by the Blender Foundation. Stream URLs
 * point at the publisher's own free host (Internet Archive), never at a
 * third-party player or an extracted `blob:` URL.
 *
 * Attribution is mandatory for the CC BY titles, so it is stored with the
 * record and rendered next to the player. Do not add an entry here without
 * recording its license and public source URL.
 */

export type OpenLicense = {
  name: string;
  url: string;
  attribution: string;
  sourceUrl: string;
  downloadable: boolean;
};

export type OpenStream = {
  url: string;
  type: "mp4";
  license: OpenLicense;
};

type OpenSeed = {
  id: string;
  title: string;
  originalTitle: string;
  overview: string;
  tagline: string | null;
  releaseDate: string;
  runtimeMinutes: number;
  originalLanguage: string;
  voteAverage: number;
  popularity: number;
  genres: string[];
  posterUrl: string;
  streamUrl: string;
  license: OpenLicense;
};

const PUBLIC_DOMAIN_MARK: OpenLicense = {
  name: "Public domain",
  url: "https://creativecommons.org/publicdomain/mark/1.0/",
  attribution: "Public domain — source: Internet Archive",
  sourceUrl: "https://archive.org/",
  downloadable: true,
};

const CC0: OpenLicense = {
  name: "CC0 1.0",
  url: "https://creativecommons.org/publicdomain/zero/1.0/",
  attribution: "CC0 1.0 — source: Internet Archive",
  sourceUrl: "https://archive.org/",
  downloadable: true,
};

function blenderLicense(site: string): OpenLicense {
  return {
    name: "CC BY 3.0",
    url: "https://creativecommons.org/licenses/by/3.0/",
    attribution: `© Blender Foundation — ${site}`,
    sourceUrl: site,
    downloadable: true,
  };
}

const seeds: OpenSeed[] = [
  {
    id: "open-night-of-the-living-dead",
    title: "Night of the Living Dead",
    originalTitle: "Night of the Living Dead",
    overview:
      "A group of strangers barricade themselves in a rural farmhouse as the recently dead begin to rise. George A. Romero's landmark independent horror film helped define the modern zombie genre.",
    tagline: "They won't stay dead.",
    releaseDate: "1968-10-01",
    runtimeMinutes: 96,
    originalLanguage: "en",
    voteAverage: 7.6,
    popularity: 96,
    genres: ["Horror", "Drama"],
    posterUrl: "https://archive.org/services/img/Night.Of.The.Living.Dead_1080p",
    streamUrl:
      "https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p_512kb.mp4",
    license: {
      ...PUBLIC_DOMAIN_MARK,
      sourceUrl: "https://archive.org/details/Night.Of.The.Living.Dead_1080p",
    },
  },
  {
    id: "open-nosferatu",
    title: "Nosferatu",
    originalTitle: "Nosferatu, eine Symphonie des Grauens",
    overview:
      "An estate agent travels to a remote castle to close a sale, unaware that his client is an ancient vampire. F. W. Murnau's silent expressionist classic remains one of cinema's most influential horror films.",
    tagline: "A symphony of horror.",
    releaseDate: "1922-03-04",
    runtimeMinutes: 94,
    originalLanguage: "de",
    voteAverage: 7.9,
    popularity: 88,
    genres: ["Horror", "Fantasy"],
    posterUrl: "https://archive.org/services/img/Nosferatu1922",
    streamUrl: "https://archive.org/download/Nosferatu1922/Nosferatu-smaller2.mp4",
    license: { ...CC0, sourceUrl: "https://archive.org/details/Nosferatu1922" },
  },
  {
    id: "open-the-general",
    title: "The General",
    originalTitle: "The General",
    overview:
      "A Confederate railway engineer chases the Union spies who stole his locomotive and his sweetheart. Buster Keaton's silent comedy is famous for its practical stunts and precise physical timing.",
    tagline: "The comedy that made Buster Keaton immortal.",
    releaseDate: "1926-12-31",
    runtimeMinutes: 78,
    originalLanguage: "en",
    voteAverage: 8.1,
    popularity: 74,
    genres: ["Comedy", "Action"],
    posterUrl: "https://archive.org/services/img/TheGeneral1926",
    streamUrl:
      "https://archive.org/download/TheGeneral1926/The_General_1926_720p_512kb.mp4",
    license: {
      ...PUBLIC_DOMAIN_MARK,
      sourceUrl: "https://archive.org/details/TheGeneral1926",
    },
  },
  {
    id: "open-plan-9",
    title: "Plan 9 from Outer Space",
    originalTitle: "Plan 9 from Outer Space",
    overview:
      "Alien visitors resurrect the dead in a scheme to stop humanity from destroying the universe. Ed Wood's low-budget science-fiction film became a cult classic of inadvertent comedy.",
    tagline: "Future events such as these will affect you in the future.",
    releaseDate: "1959-07-22",
    runtimeMinutes: 79,
    originalLanguage: "en",
    voteAverage: 4.2,
    popularity: 61,
    genres: ["Science Fiction", "Horror"],
    posterUrl: "https://archive.org/services/img/plan-9-from-outer-space",
    streamUrl:
      "https://archive.org/download/plan-9-from-outer-space/plan-9-from-outer-space.mp4",
    license: { ...CC0, sourceUrl: "https://archive.org/details/plan-9-from-outer-space" },
  },
  {
    id: "open-big-buck-bunny",
    title: "Big Buck Bunny",
    originalTitle: "Big Buck Bunny",
    overview:
      "A gentle rabbit turns the tables on three bullying rodents. The Blender Foundation's second open movie was released with its full source assets to demonstrate free-software animation.",
    tagline: "A big bunny, three bullies, and one sweet revenge.",
    releaseDate: "2008-05-30",
    runtimeMinutes: 10,
    originalLanguage: "en",
    voteAverage: 7.4,
    popularity: 69,
    genres: ["Animation", "Comedy"],
    posterUrl: "https://archive.org/services/img/BigBuckBunny_124",
    streamUrl:
      "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
    license: blenderLicense("https://peach.blender.org/"),
  },
  {
    id: "open-sintel",
    title: "Sintel",
    originalTitle: "Sintel",
    overview:
      "A lone warrior searches for the dragon hatchling she raised and lost. The Blender Foundation's third open movie pairs a hand-crafted fantasy world with an orchestral score.",
    tagline: "A journey worth every step.",
    releaseDate: "2010-09-27",
    runtimeMinutes: 15,
    originalLanguage: "en",
    voteAverage: 7.2,
    popularity: 57,
    genres: ["Animation", "Fantasy"],
    posterUrl: "https://archive.org/services/img/Sintel",
    streamUrl: "https://archive.org/download/Sintel/sintel-2048-stereo.mp4",
    license: blenderLicense("https://durian.blender.org/"),
  },
  {
    id: "open-tears-of-steel",
    title: "Tears of Steel",
    originalTitle: "Tears of Steel",
    overview:
      "In a ruined future, a team of scientists tries to undo the robot uprising by revisiting a single moment from the past. This open movie was made to test live-action visual effects in Blender.",
    tagline: "The future is not set.",
    releaseDate: "2012-09-26",
    runtimeMinutes: 12,
    originalLanguage: "en",
    voteAverage: 6.5,
    popularity: 52,
    genres: ["Science Fiction", "Action"],
    posterUrl: "https://archive.org/services/img/Tears-of-Steel",
    streamUrl: "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
    license: blenderLicense("https://mango.blender.org/"),
  },
  {
    id: "open-elephants-dream",
    title: "Elephants Dream",
    originalTitle: "Elephants Dream",
    overview:
      "Two men wander an endless mechanical world that reshapes itself around them. The first Blender open movie explored what a freely licensed production pipeline could produce.",
    tagline: "The world is a machine.",
    releaseDate: "2006-03-24",
    runtimeMinutes: 11,
    originalLanguage: "en",
    voteAverage: 6.6,
    popularity: 48,
    genres: ["Animation", "Science Fiction"],
    posterUrl: "https://archive.org/services/img/ElephantsDream",
    streamUrl: "https://archive.org/download/ElephantsDream/ed_hd.mp4",
    license: blenderLicense("https://orange.blender.org/"),
  },
];

function toTitle(seed: OpenSeed): CatalogTitle {
  return {
    id: seed.id,
    type: "movie",
    tmdbId: null,
    anilistId: null,
    imdbId: null,
    title: seed.title,
    originalTitle: seed.originalTitle,
    overview: seed.overview,
    tagline: seed.tagline,
    posterPath: seed.posterUrl,
    backdropPath: seed.posterUrl,
    releaseDate: seed.releaseDate,
    year: Number(seed.releaseDate.slice(0, 4)),
    runtimeMinutes: seed.runtimeMinutes,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: seed.originalLanguage,
    voteAverage: seed.voteAverage,
    popularity: seed.popularity,
    genres: seed.genres,
    trailerKey: null,
    source: "open",
    isDemo: false,
    license: {
      name: seed.license.name,
      url: seed.license.url,
      attribution: seed.license.attribution,
      sourceUrl: seed.license.sourceUrl,
      downloadable: seed.license.downloadable,
    },
  };
}

export const openCatalog: CatalogTitle[] = seeds.map(toTitle);

const byId = new Map(seeds.map((seed) => [seed.id, seed]));

export function isOpenId(id: string): boolean {
  return id.startsWith("open-");
}

export function getOpenTitle(id: string): CatalogTitle | null {
  const seed = byId.get(id);
  return seed ? toTitle(seed) : null;
}

export function getOpenDetail(id: string): CatalogDetail | null {
  const title = getOpenTitle(id);
  if (!title) return null;
  const recommendations = openCatalog
    .filter((item) => item.id !== id && item.genres.some((g) => title.genres.includes(g)))
    .slice(0, 6);
  return { ...title, cast: [], recommendations, seasons: [] };
}

export function getOpenStream(id: string): OpenStream | null {
  const seed = byId.get(id);
  if (!seed) return null;
  return { url: seed.streamUrl, type: "mp4", license: seed.license };
}
